const nodemailer = require('nodemailer');

class emailService {
    constructor(){
        this.transporter = this.createTransporter();
    }

    createTransporter(){
        // Configure email transporter
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD  // App password
            }
        });
    }

    // Send trade execution notification
    async sendTradeNotification(data){
        try{
            const {email, name, trade, bot} = data;

            const subject = `${trade.side.toUpperCase()} Trade Executed - ${bot}`;
            const html = this.generateTradeEmailHTML(trade, bot, name);

            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject,
                html
            });

            console.log(`Trade notification sent to ${email}`);
        }catch(error){
            console.error('Email sending error:', error);
        }
    }

    // Send bot status notification
    async sendBotStatusNotification(data){
        try{
            const {email, name, bot, status, message} = data;

            const subject = `Bot ${status.toUpperCase()} - ${bot.name}`;
            const html = this.generateBotStatusEmailHTML(bot, status, message, name);

            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject,
                html
            });

            console.log(`Bot status notification sent to ${email}`);
        }catch(error){
            console.error('Email sending error:', error);
        }
    }

    // Send daily performance summary
    async sendDailySummary(data){
        try{
            const {email, name, summary} = data;

            const subject = `Daily Trading Summary - ${new Date().toDateString()}`;
            const html = this.generateDailySummaryHTML(summary, name);

            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject,
                html
            });

            console.log(`Daily summary sent to ${email}`);
        }catch(error){
            console.error('Email sending error:', error)
        }
    }

    // Generate trade notification HTML
    generateTradeEmailHTML(trade, botName, userName){
        const profitColor = trade.pnl > 0 ? '#28a745': trade.pnl < 0 ? '#dc3545' : '#6c757d';
        const profitIcon = trade.pnl > 0 ? '📈' : trade.pnl < 0 ? '📉' : '➖';

        return `
            <!DOCTYPE html>
            <html>
                <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
                    .trade-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
                    .trade-row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .trade-label { font-weight: bold; color: #495057; }
                    .trade-value { color: #212529; }
                    .profit { color: ${profitColor}; font-weight: bold; font-size: 1.1em; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 0.9em; }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                    <h1>🚀 Trade Executed</h1>
                    <p>Hello ${userName}, your trading bot has executed a trade!</p>
                    </div>
                    
                    <div class="trade-info">
                    <h3>Trade Details</h3>
                    <div class="trade-row">
                        <span class="trade-label">Bot Name:</span>
                        <span class="trade-value">${botName}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Symbol:</span>
                        <span class="trade-value">${trade.symbol}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Action:</span>
                        <span class="trade-value">${trade.side.toUpperCase()}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Amount:</span>
                        <span class="trade-value">${trade.amount.toFixed(6)}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Price:</span>
                        <span class="trade-value">$${trade.price.toFixed(4)}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Total Cost:</span>
                        <span class="trade-value">$${trade.cost.toFixed(2)}</span>
                    </div>
                    ${trade.pnl !== undefined ? `
                    <div class="trade-row">
                        <span class="trade-label">P&L:</span>
                        <span class="trade-value profit">${profitIcon} $${trade.pnl.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="trade-row">
                        <span class="trade-label">Strategy:</span>
                        <span class="trade-value">${trade.strategy}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Reason:</span>
                        <span class="trade-value">${trade.reason}</span>
                    </div>
                    <div class="trade-row">
                        <span class="trade-label">Time:</span>
                        <span class="trade-value">${new Date().toLocaleString()}</span>
                    </div>
                    </div>
                    
                    <div class="footer">
                    <p>This is an automated notification from your Algo Trading Bot</p>
                    <p>Do not reply to this email</p>
                    </div>
                </div>
                </body>
            </html>
        `;
    }

    // Generate bot status notification HTML
    generateBotStatusEmailHTML(bot, status, message, userName){
        const statusColors = {
            'started': '#28a745',
            'stopped': '#dc3545',
            'paused': '#ffc107',
            'error': '#dc3545',
            'resumed': '#28a745'
        };

        const statusIcon = {
            'started': '▶️',
            'stopped': '⏹️',
            'paused': '⏸️',
            'error': '❌',
            'resumed': '▶️'
        }

        return`
            <!DOCTYPE html>
            <html>
                <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
                    .status-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
                    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: ${statusColors[status] || '#6c757d'}; }
                    .bot-row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .bot-label { font-weight: bold; color: #495057; }
                    .bot-value { color: #212529; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 0.9em; }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                    <h1>${statusIcon[status] || '🤖'} Bot Status Update</h1>
                    <p>Hello ${userName}, your trading bot status has changed!</p>
                    </div>
                    
                    <div class="status-info">
                    <h3>Bot Status: <span class="status-badge">${status.toUpperCase()}</span></h3>
                    <div class="bot-row">
                        <span class="bot-label">Bot Name:</span>
                        <span class="bot-value">${bot.name}</span>
                    </div>
                    <div class="bot-row">
                        <span class="bot-label">Symbol:</span>
                        <span class="bot-value">${bot.symbol}</span>
                    </div>
                    <div class="bot-row">
                        <span class="bot-label">Strategy:</span>
                        <span class="bot-value">${bot.strategy}</span>
                    </div>
                    <div class="bot-row">
                        <span class="bot-label">Time:</span>
                        <span class="bot-value">${new Date().toLocaleString()}</span>
                    </div>
                    ${message ? `
                    <div class="bot-row">
                        <span class="bot-label">Message:</span>
                        <span class="bot-value">${message}</span>
                    </div>
                    ` : ''}
                    </div>
                    
                    <div class="footer">
                    <p>This is an automated notification from your Algo Trading Bot</p>
                    <p>Do not reply to this email</p>
                    </div>
                </div>
                </body>
            </html>
        `;
    }

    // Generate daily summary HTML
    generateDailySummaryHTML(summary, userName){
        const totalPnlColor = summary.totalPnl >= 0 ? '#28a745' : '#dc3545';
        const totalPnlIcon = summary.totalPnl >= 0 ? '📈' : '📉';

        return `
            <!DOCTYPE html>
            <html>
                <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
                    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                    .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
                    .summary-number { font-size: 2em; font-weight: bold; color: #007bff; }
                    .summary-label { color: #6c757d; font-size: 0.9em; }
                    .total-pnl { font-size: 1.5em; font-weight: bold; color: ${totalPnlColor}; text-align: center; margin: 20px 0; }
                    .bot-list { margin: 20px 0; }
                    .bot-item { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 5px 0; display: flex; justify-content: space-between; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 0.9em; }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                    <h1>📊 Daily Trading Summary</h1>
                    <p>Hello ${userName}, here's your daily trading performance!</p>
                    </div>
                    
                    <div class="total-pnl">
                    ${totalPnlIcon} Total P&L: $${summary.totalPnl.toFixed(2)}
                    </div>
                    
                    <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-number">${summary.totalTrades}</div>
                        <div class="summary-label">Total Trades</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${summary.activeBots}</div>
                        <div class="summary-label">Active Bots</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${summary.winningTrades}</div>
                        <div class="summary-label">Winning Trades</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${(summary.winRate || 0).toFixed(1)}%</div>
                        <div class="summary-label">Win Rate</div>
                    </div>
                    </div>
                    
                    ${summary.topPerformingBots && summary.topPerformingBots.length > 0 ? `
                    <div class="bot-list">
                    <h3>Top Performing Bots</h3>
                    ${summary.topPerformingBots.map(bot => `
                        <div class="bot-item">
                        <span>${bot.name}</span>
                        <span style="color: ${bot.pnl >= 0 ? '#28a745' : '#dc3545'}">$${bot.pnl.toFixed(2)}</span>
                        </div>
                    `).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                    <p>Keep up the great work! 🚀</p>
                    <p>This is an automated daily summary from your Algo Trading Bot</p>
                    </div>
                </div>
                </body>
            </html>
        `
    }
    
}

module.exports = new emailService();