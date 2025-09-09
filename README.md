# OpenBags - Bags.FM Token Launcher UI

Interface for launching tokens with fee sharing using the Bags SDK. 
## ✨ Features

- 🔗 **Wallet Integration**: Seamless Phantom wallet connection
- 📁 **File Upload**: Drag & drop image upload following Bags guidelines
- 🤝 **Fee Sharing**: Easy fee splitting with Twitter/Instagram users
- 📱 **Responsive**: Works perfectly on desktop and mobile
- ⚡ **Real-time**: Live wallet balance and transaction status
- 🔒 **Secure**: Client-side wallet signing, no private keys stored

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd sdk/ui
npm install
```

### 2. Start the Server
```bash
npm start
# or from the main SDK directory:
npm run ui
```

### 3. Open in Browser
Navigate to `http://localhost:3003`

## 🎯 How It Works

### **Step 1: Connect Wallet**
- Click "Connect Wallet" to connect your Phantom wallet
- Your balance and address will be displayed
- All transactions are signed client-side for security

### **Step 2: Upload Token Image**
- Drag & drop or click to upload your token image
- Supports PNG, JPG, GIF up to 10MB
- Follows Bags file upload guidelines

### **Step 3: Configure Token**
- Enter token name, symbol, and description
- Add optional social links (website, Twitter, Telegram)
- Set initial buy amount in SOL

### **Step 4: Set Up Fee Sharing (Optional)**
- Choose platform (Twitter or Instagram)
- Enter username (without @)
- Adjust fee split with the slider
- Preview shows exact percentages

### **Step 5: Launch Token**
- Review all details
- Click "Create Token"
- Sign the transaction in your wallet
- Get your token mint address and Bags.fm link

## 🔧 Architecture

### **Frontend Components**
- `index.html` - Modern UI with Tailwind CSS
- `app.js` - Main application logic and wallet integration
- `bags-sdk-client.js` - Browser-compatible Bags API wrapper
- `server.js` - Express server for API key management

### **Key Features**

#### **File Upload System**
Following the Bags documentation for file uploads:
```javascript
const uploadData = new FormData();
uploadData.append('name', formData.name);
uploadData.append('symbol', formData.symbol);
uploadData.append('image', formData.image); // File object
```

#### **Wallet Integration**
```javascript
// Connect wallet
const response = await window.solana.connect();
const publicKey = response.publicKey.toString();

// Sign transaction
const signedTx = await window.solana.signTransaction(transaction);
```

#### **Fee Sharing Configuration**
```javascript
const feeSharePayload = {
    users: [
        { wallet: creatorWallet, bps: creatorBps },
        { wallet: feeClaimerWallet, bps: claimerBps }
    ],
    payer: creatorWallet,
    baseMint: tokenMint,
    quoteMint: "So11111111111111111111111111111111111111112"
};
```

## 🎨 UI Components

### **Glass Morphism Design**
- Translucent cards with backdrop blur
- Gradient text and buttons
- Smooth animations and transitions

### **Interactive Elements**
- Drag & drop file upload with visual feedback
- Real-time fee split slider
- Animated loading states
- Success/error modals

### **Responsive Layout**
- Mobile-first design
- Flexible grid system
- Touch-friendly controls

## 🔒 Security Features

### **Client-Side Signing**
- No private keys stored or transmitted
- All transactions signed in user's wallet
- Secure connection to Solana network

### **API Key Management**
- API keys loaded from server environment
- No sensitive data in client code
- Secure HTTPS connections

## 🛠️ Development

### **Local Development**
```bash
npm run dev  # Start with auto-reload
```

### **File Structure**
```
ui/
├── index.html          # Main UI
├── app.js             # Application logic
├── bags-sdk-client.js # API wrapper
├── server.js          # Express server
├── package.json       # Dependencies
└── README.md          # This file
```

### **Environment Variables**
The UI automatically loads configuration from the parent `.env` file:
- `BAGS_API_KEY` - Your Bags API key
- `HELIUS_API_KEY` - Optional Helius RPC key

## 🎯 Comparison with Original

### **Improvements Over REST API Approach**

1. **Better UX**: Modern, intuitive interface
2. **File Upload**: Proper drag & drop following Bags guidelines
3. **Real-time Feedback**: Live updates and status messages
4. **Error Handling**: User-friendly error messages
5. **Mobile Support**: Responsive design for all devices

### **Maintained Features**
- Fee sharing with custom splits
- Twitter/Instagram username lookup
- Wallet balance display
- Transaction signing
- Social links integration

## 🚀 Deployment

### **Production Setup**
1. Set environment variables in production
2. Use HTTPS for wallet security
3. Configure proper CORS headers
4. Enable rate limiting

### **Docker Support**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
CMD ["npm", "start"]
```

## 📱 Mobile Support

The UI is fully responsive and works great on mobile devices:
- Touch-friendly controls
- Optimized layouts
- Mobile wallet integration
- Swipe gestures for modals

## 🎉 Success Flow

1. **Token Created** ✅
2. **Fee Sharing Configured** ✅ (if enabled)
3. **Transaction Signed** ✅
4. **Token Live on Bags.fm** ✅

Users get direct links to:
- View token on Bags.fm
- View transaction on Solscan
- Share with community

This UI provides the best of both worlds: the power of the Bags SDK with a beautiful, user-friendly interface that anyone can use!
