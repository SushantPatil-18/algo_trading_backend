const ExchangeAccount = require('../models/ExchangeAccount');
const {encrypt, decrypt} = require('../utils/encryption');
const ccxt = require('ccxt');

// add exchange account
const addExchangeAccount = async (req, res) => {
    try{
        const {exchange, label, apiKey, apiSecret, testnet = false} = req.body;
        const userId = req.userId;

        //Validation
        if(!exchange || !label || !apiKey || !apiSecret){
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if(!['binance', 'delta'].includes(exchange)){
            return res.status(400).json({
                success: false,
                message: 'Exchange must be either binance or delta'
            });
        }

        const testResult = await testExchangeConnection(exchange, apiKey, apiSecret,testnet);
        
        if(!testResult.success){
            return res.status(400).json({
                success: false,
                message: `API key test failed: ${testResult.error}`
            });
        }
        
        //Encrypt API credentials
        const encryptApiKey = encrypt(apiKey);
        const encryptApiSecret = encrypt(apiSecret);

        // Create exchange account
        const exchangeAccount = new ExchangeAccount({
            userId,
            exchange,
            label,
            apiKey: encryptApiKey,
            apiSecret: encryptApiSecret,
            testnet,
            permissions: testResult.permissions,
            lastVerified: new Date()
        });

        await exchangeAccount.save();

        res.status(201).json({
            success: true,
            message: 'Exchange account added successfully',
            account:{
                id: exchangeAccount._id,
                exchange: exchangeAccount.exchange,
                label: exchangeAccount.label,
                testnet: exchangeAccount.testnet,
                permissions: exchangeAccount.permissions,
                isActive: exchangeAccount.isActive
            }
        });
    }catch(error){
        console.error('Add exchange account error: ', error);

        // Handle duplicate key error
        if(error.code === 11000){
            return res.status(400).json({
                success: false,
                message: 'An acccount with this exchange and label already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while adding exchange account'
        });
    }

};

const getExchangeAccounts = async (req, res) =>{
    try{
        const userId = req.userId;

        const account = await ExchangeAccount.find({userId}).select('-apiKey -apiSecret').sort({createdAt: -1});

        res.json({
            success: true,
            account
        });
    }catch(error){
        console.error('Get exchange accounts error: ', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching accounts'
        });
    }
};

const testExchangeConnection = async (exchange, apiKey, apiSecret, testnet = false) =>{
    try{
        let exchangeClass;
        let exchangeConfig = {
            apiKey,
            secret: apiSecret,
            sandbox: testnet,
            enableRateLimit: true
        };

        // Initialize exchange based on type
        if(exchange === 'binance'){
            exchangeClass = ccxt.binance;
            if(testnet){
                exchangeConfig.urls = {
                    api:{
                        public: 'https://testnet.binance.vision/api',
                        private: 'https://testnet.binance.vision/api'
                    }
                };
            }
        }else if (exchange === 'delta'){
            exchangeClass = ccxt.delta;
            if(testnet){
                exchangeConfig.urls = {
                    api:{
                        public: 'https://testnet-api.delta.exchange',
                        private: 'https://testnet-api.delta.exchange'
                    }
                };
            }
        }

        const exchangeInstance = new exchangeClass(exchangeConfig);

        // Check connection based on account info
        const accountInfo = await exchangeInstance.fetchBalance();

        // check permission based on account info
        const permissions = {
            spot: true, // assume spot trading if we can fetch balance
            future: accountInfo.info?.canTrade || false,
            margin: accountInfo.info?.canMargin || false
        };
        return{
            success: true,
            permissions,
            balance: accountInfo.total
        };
    } catch(error){
        console.error('Exchange connection test error:', error);
        return{
            success: false,
            error: error.message || 'Failed to connect to exchange'
        };
    }
};

// Delete exchange account
const deleteExchangeAccount = async (req,res) =>{
    try{
        const {accountId} = req.params;
        const userId = req.userId;

        const account = await ExchangeAccount.findOneAndDelete({
            _id: accountId,
            userId
        })
        if(!account){
            return res.status(404).json({
                success: false,
                message: 'Exchange account not found'
            });
        }
        res.json({
            success: true,
            message: 'Exchange account deleted successfully'
        })
    }catch(error){
        console.error('Delete exchange account error:',error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting account'
        });
    }   
};

// Test existing acccount connection 
const testAccountConnection = async (req, res) =>{
    try{
        const {accountId} = req.params;
        const userId = req.userId;

        const account = await ExchangeAccount.findOne({
            _id: accountId,
            userId
        });
        if(!account){
            return res.status(404).json({
                success: false,
                message: 'Exchange account not found'
            });
        }

        // Decrypt credentials
        const apiKey = decrypt(account.apiKey);
        const apiSecret = decrypt(account.apiSecret);

        //Test connection
        const testResult = await testExchangeConnection(
            account.exchange,
            apiKey,
            apiSecret,
            account.testnet
        );
        if(testResult.success){
            // Update last verifed timejstamp
            account.lastVerified = new Date();
            account.permissions = testResult.permissions;
            await account.save();
        }
        res.json({
            success: testResult.success,
            message: testResult.success ? 'Connection successful' : `Connection failed: ${testResult.error}`,
            permissions: testResult.permissions || null,
            lastVerified: account.lastVerified
        });
    }catch{
        console.error('Test account connection error: ', error);
        res.status(500).json({
            success: false,
            message: 'server serror while testing connection'
        });
    }
};


module.exports = {
    addExchangeAccount,
    getExchangeAccounts,
    deleteExchangeAccount,
    testAccountConnection
}