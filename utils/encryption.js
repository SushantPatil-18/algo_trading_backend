const CryptoJS = require('crypto-js');

// Use environment variable for encryption key
const key = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-here-at-least-32-characters-long';

// Encrypt function
const encrypt = (text) => {
    try{
        const encrypted = CryptoJS.AES.encrypt(text,key).toString();
        return encrypted;
    }catch(error){
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};

// Decrypt function
const decrypt = (encryptedText) =>{
    try{
        const decrypted = CryptoJS.AES.decrypt(encryptedText,key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    }catch(error){
        console.error('Decryption error', error);
        throw new Error('Failed to decrypt data');
    }
};

module.exports = {
    encrypt,
    decrypt
};

