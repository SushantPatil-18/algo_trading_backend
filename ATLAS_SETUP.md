# MongoDB Atlas Setup Guide

## ✅ Current Status

Your `.env` file has been updated with the correct MongoDB Atlas connection string format.

## 🔑 Action Required

You need to replace `<db_password>` in your `.env` file with your actual MongoDB Atlas password.

### Quick Steps:

1. **Get Your Password**
   - If you forgot your password, go to MongoDB Atlas → Database Access
   - Click "Edit" on your user `sushantpatil_db_user`
   - Click "Edit Password" and set a new one
   - **Copy the password** (save it securely!)

2. **Update .env File**
   - Open your `.env` file
   - Replace `<db_password>` with your actual password
   - Example:
     ```
     # Before:
     MONGODB_URI=mongodb+srv://sushantpatil_db_user:<db_password>@cluster0...
     
     # After:
     MONGODB_URI=mongodb+srv://sushantpatil_db_user:MyP@ssw0rd123@cluster0...
     ```

3. **Special Characters in Password**
   - If your password contains special characters like `@`, `#`, `%`, etc.
   - You need to URL encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
     - `/` → `%2F`
     - `:` → `%3A`
   - Or use [URL Encoder](https://www.urlencoder.org/)

## 🧪 Test Your Connection

After updating the password, test the connection:

```bash
npm start
```

You should see:
```
MongoDB Connected: cluster0-shard-00-01.t8kwvhu.mongodb.net
Server is running on port 5000
```

## 📊 Seed Your Database

Once connected, seed the strategies:

```bash
npm run seed:strategies
```

Expected output:
```
Connected to MongoDB
Cleared existing strategies
Seeded the strategies successfully
```

## 🔍 Verify in Atlas

1. Go to MongoDB Atlas Dashboard
2. Click "Browse Collections" on your cluster
3. You should see the database `algo_trading` with collections:
   - `strategies`
   - `users`
   - `exchangeaccounts`
   - `tradingbots`
   - `trades`

## ⚠️ Security Reminders

1. **Never commit `.env` to Git**
   - Make sure `.env` is in your `.gitignore`
   
2. **Use Strong Passwords**
   - Change default JWT_SECRET to something secure
   - Use a proper 32-character ENCRYPTION_KEY

3. **Network Access**
   - For production, limit IP addresses in Atlas Network Access
   - Remove "Allow Access from Anywhere" (0.0.0.0/0)

## 🛠️ Troubleshooting

### Error: "Authentication failed"
- Double-check your username and password
- Verify password is URL-encoded if it has special characters

### Error: "connection timed out"
- Check Network Access in Atlas
- Ensure your IP is whitelisted or use 0.0.0.0/0 for testing

### Error: "Server selection timed out"
- Check your internet connection
- Verify the cluster URL is correct

### Error: "MongoParseError"
- Ensure connection string format is correct
- Check for missing or extra characters

## 📝 Connection String Breakdown

```
mongodb+srv://                          ← Protocol
sushantpatil_db_user                   ← Username
:                                      ← Separator
<db_password>                          ← Your password (replace this!)
@                                      ← Separator
cluster0.t8kwvhu.mongodb.net           ← Your cluster URL
/                                      ← Separator
algo_trading                           ← Database name
?                                      ← Query string start
retryWrites=true                       ← Auto-retry writes
&w=majority                            ← Write concern
&appName=Cluster0                      ← App identifier
```

## 🎯 Next Steps

1. Replace `<db_password>` in `.env`
2. Start your server: `npm start`
3. Seed strategies: `npm run seed:strategies`
4. Test API endpoints
5. Monitor in Atlas Dashboard

## 📞 Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify all credentials are correct
3. Check MongoDB Atlas status page
4. Review the troubleshooting section above
