const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Serve static files from the ui directory
app.use(express.static(__dirname));

// API endpoint to get the Bags API key
app.get('/api/config', (req, res) => {
    res.json({
        bagsApiKey: process.env.BAGS_API_KEY || '',
        heliusRpcUrl: process.env.HELIUS_API_KEY ? 
            `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}` : 
            'https://api.mainnet-beta.solana.com'
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎒 Bags SDK UI running at http://localhost:${PORT}`);
    console.log(`API Key loaded: ${process.env.BAGS_API_KEY ? '✅ Yes' : '❌ No'}`);
    console.log(`Helius RPC: ${process.env.HELIUS_API_KEY ? '✅ Yes' : '❌ No'}`);
});