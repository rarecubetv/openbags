// Bags SDK Client - Browser-compatible wrapper for Bags API
export class BagsSDKClient {
    constructor() {
        this.baseUrl = 'https://public-api-v2.bags.fm/api/v1';
        this.apiKey = null;
        this.rpcUrl = 'https://api.mainnet-beta.solana.com'; // Default fallback
        this.init();
    }

    async init() {
        // Load API key and RPC URL from server
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.apiKey = config.bagsApiKey;
            this.rpcUrl = config.heliusRpcUrl || 'https://api.mainnet-beta.solana.com';
            console.log('✅ Bags API key loaded');
            console.log('✅ RPC URL configured:', this.rpcUrl.includes('helius') ? 'Helius' : 'Default');
        } catch (error) {
            console.warn('⚠️ Could not load config from server:', error);
        }
    }

    getRpcUrl() {
        return this.rpcUrl;
    }

    async testConnection() {
        try {
            const response = await fetch('https://public-api-v2.bags.fm/ping');
            const data = await response.json();
            return data.message === 'pong';
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    async createTokenInfo(formData) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        // Validate image file if provided
        if (formData.image) {
            this.validateImageFile(formData.image);
        }

        // Create FormData for file upload following Bags API requirements
        const uploadData = new FormData();
        uploadData.append('name', formData.name);
        uploadData.append('symbol', formData.symbol);
        uploadData.append('description', formData.description || '');

        // Add image with required field name 'image'
        if (formData.image) {
            uploadData.append('image', formData.image);
            console.log(`📁 Uploading image: ${formData.image.name} (${(formData.image.size / 1024 / 1024).toFixed(2)}MB)`);
        }

        // Add optional social links
        if (formData.websiteLink) uploadData.append('website', formData.websiteLink);
        if (formData.twitterLink) uploadData.append('twitter', formData.twitterLink);
        if (formData.telegramLink) uploadData.append('telegram', formData.telegramLink);

        try {
            const response = await fetch(`${this.baseUrl}/token-launch/create-token-info`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey
                    // Note: Don't set Content-Type header, let browser set it with boundary for multipart/form-data
                },
                body: uploadData
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific Bags API errors
                this.handleUploadError(response.status, data);
            }

            console.log('✅ Token info created successfully');
            return {
                tokenMint: data.response?.tokenMint || data.tokenMint,
                tokenMetadata: data.response?.tokenMetadata || data.tokenMetadata,
                tokenLaunch: data.response?.tokenLaunch || data.tokenLaunch
            };

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Please check your connection and try again');
            }
            throw error;
        }
    }

    async getFeeShareWallet(username, platform) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        // Validate username format before making API call
        if (!username || username.length === 0) {
            throw new Error('Username is required');
        }

        if (username.includes('@') || username.includes('/') || username.includes('http')) {
            throw new Error('Please enter just the username (no @ symbol or links)');
        }

        if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
            throw new Error('Username must be 1-15 characters and contain only letters, numbers, and underscores');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/token-launch/fee-share/wallet/${platform}?${platform}Username=${username}`,
                {
                    headers: {
                        'x-api-key': this.apiKey
                    }
                }
            );

            const data = await response.json();

            if (response.ok && data.response) {
                return data.response;
            } else {
                // Provide more specific error messages
                if (response.status === 404) {
                    throw new Error(`@${username} doesn't have a registered Bags wallet. They need to connect their wallet at bags.fm first.`);
                } else if (response.status === 400) {
                    throw new Error(`Invalid username format: @${username}`);
                } else {
                    throw new Error(`User @${username} not found or no wallet registered`);
                }
            }
        } catch (error) {
            if (error.message.includes('@') || error.message.includes('wallet')) {
                throw error; // Re-throw our custom errors
            }
            throw new Error(`Failed to lookup wallet for @${username}: ${error.message}`);
        }
    }

    async createFeeShareConfig(username, platform, creatorBps, claimerBps, creatorWallet, tokenMint) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        // Get the fee claimer's wallet
        const feeClaimerWallet = await this.getFeeShareWallet(username, platform);
        console.log('🤝 Fee share config:', {
            creator: creatorWallet,
            claimer: feeClaimerWallet,
            creatorBps,
            claimerBps
        });

        // Sort wallets alphabetically as required by API (like in your original implementation)
        let walletA, walletB, walletABps, walletBBps;
        if (creatorWallet < feeClaimerWallet) {
            walletA = creatorWallet;
            walletB = feeClaimerWallet;
            walletABps = creatorBps;
            walletBBps = claimerBps;
        } else {
            walletA = feeClaimerWallet;
            walletB = creatorWallet;
            walletABps = claimerBps;
            walletBBps = creatorBps;
        }

        // Create fee share configuration with correct API format
        const feeSharePayload = {
            walletA: walletA,
            walletB: walletB,
            walletABps: walletABps,
            walletBBps: walletBBps,
            payer: creatorWallet,
            baseMint: tokenMint,
            quoteMint: "So11111111111111111111111111111111111111112" // wSOL
        };

        console.log('📤 Fee share payload:', feeSharePayload);

        const response = await fetch(`${this.baseUrl}/token-launch/fee-share/create-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify(feeSharePayload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Fee share config failed:', data);
            // Handle validation errors specifically
            if (data.error && typeof data.error === 'string') {
                throw new Error(data.error);
            } else if (Array.isArray(data)) {
                // Handle validation array errors
                const errorMessages = data.map(err => `${err.path?.join('.')}: ${err.message}`).join(', ');
                throw new Error(`Validation errors: ${errorMessages}`);
            } else {
                throw new Error('Failed to create fee share config');
            }
        }

        return {
            configKey: data.response?.configKey || data.configKey,
            transaction: data.response?.tx || data.tx,
            feeClaimerWallet,
            creatorBps,
            claimerBps
        };
    }

    async createLaunchConfig(launchWallet) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch(`${this.baseUrl}/token-launch/create-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify({ launchWallet })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create launch config');
        }

        return {
            configKey: data.response?.configKey || data.configKey,
            transaction: data.response?.tx || data.tx
        };
    }

    async createLaunchTransaction({ tokenInfo, feeShareConfig, launchWallet, initialBuyLamports }) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        // Extract IPFS hash from metadata URL
        const ipfsHash = tokenInfo.tokenMetadata ?
            tokenInfo.tokenMetadata.replace('https://ipfs.io/ipfs/', '') : null;

        // Determine which config key to use
        let configKey;
        let configTransaction = null;

        if (feeShareConfig) {
            // Use fee share config
            configKey = feeShareConfig.configKey;
            configTransaction = feeShareConfig.transaction;
        } else {
            // Create standard launch config
            const launchConfig = await this.createLaunchConfig(launchWallet);
            configKey = launchConfig.configKey;
            configTransaction = launchConfig.transaction;
        }

        // If there's a config transaction that needs signing, return it for the UI to handle
        if (configTransaction) {
            console.log('⚠️ Config transaction needs to be signed first');
            return {
                needsConfigSigning: true,
                configTransaction: configTransaction,
                configKey: configKey,
                tokenInfo: tokenInfo,
                feeShareConfig: feeShareConfig,
                launchWallet: launchWallet,
                initialBuyLamports: initialBuyLamports
            };
        }

        // Create the launch transaction payload
        const txPayload = {
            ipfs: ipfsHash,
            tokenMint: tokenInfo.tokenMint,
            wallet: launchWallet,
            configKey: configKey,
            initialBuyLamports: initialBuyLamports || 0
        };

        const response = await fetch(`${this.baseUrl}/token-launch/create-launch-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify(txPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create launch transaction');
        }

        const serializedTx = data.response?.transaction || data.transaction || data.response;

        if (!serializedTx) {
            throw new Error('No transaction returned from API');
        }

        return serializedTx;
    }

    // Create launch transaction after config is already signed
    async createLaunchTransactionAfterConfig({ tokenInfo, configKey, launchWallet, initialBuyLamports }) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        // Extract IPFS hash from metadata URL
        const ipfsHash = tokenInfo.tokenMetadata ?
            tokenInfo.tokenMetadata.replace('https://ipfs.io/ipfs/', '') : null;

        // Create the launch transaction payload
        const txPayload = {
            ipfs: ipfsHash,
            tokenMint: tokenInfo.tokenMint,
            wallet: launchWallet,
            configKey: configKey,
            initialBuyLamports: initialBuyLamports || 0
        };

        console.log('🚀 Creating launch transaction after config:', txPayload);

        const response = await fetch(`${this.baseUrl}/token-launch/create-launch-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify(txPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create launch transaction');
        }

        const serializedTx = data.response?.transaction || data.transaction || data.response;

        if (!serializedTx) {
            throw new Error('No transaction returned from API');
        }

        return serializedTx;
    }

    // Utility method to handle the complete token launch flow
    async launchTokenWithFeeSharing({
        name,
        symbol,
        description,
        image,
        socialUsername,
        socialPlatform,
        creatorFeeBps,
        feeClaimerFeeBps,
        launchWallet,
        initialBuyLamports,
        websiteLink,
        twitterLink,
        telegramLink
    }) {
        try {
            // Step 1: Create token info
            console.log('📝 Creating token info...');
            const tokenInfo = await this.createTokenInfo({
                name,
                symbol,
                description,
                image,
                websiteLink,
                twitterLink,
                telegramLink
            });

            // Step 2: Create fee share config if username provided
            let feeShareConfig = null;
            if (socialUsername) {
                console.log('🤝 Setting up fee sharing...');
                feeShareConfig = await this.createFeeShareConfig(
                    socialUsername,
                    socialPlatform,
                    creatorFeeBps,
                    feeClaimerFeeBps,
                    launchWallet,
                    tokenInfo.tokenMint
                );
            }

            // Step 3: Create launch transaction
            console.log('🚀 Creating launch transaction...');
            const launchTx = await this.createLaunchTransaction({
                tokenInfo,
                feeShareConfig,
                launchWallet,
                initialBuyLamports
            });

            return {
                tokenInfo,
                feeShareConfig,
                launchTransaction: launchTx
            };

        } catch (error) {
            console.error('Token launch preparation failed:', error);
            throw error;
        }
    }

    // Standard token launch without fee sharing
    async launchTokenStandard({
        name,
        symbol,
        description,
        image,
        launchWallet,
        initialBuyLamports,
        websiteLink,
        twitterLink,
        telegramLink
    }) {
        return this.launchTokenWithFeeSharing({
            name,
            symbol,
            description,
            image,
            socialUsername: null, // No fee sharing
            socialPlatform: null,
            creatorFeeBps: 10000, // 100% to creator
            feeClaimerFeeBps: 0,
            launchWallet,
            initialBuyLamports,
            websiteLink,
            twitterLink,
            telegramLink
        });
    }

    validateImageFile(file) {
        // Check file size (15MB = 15 * 1024 * 1024 bytes)
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size must be under 15MB');
        }

        // Check file type according to Bags API requirements
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('File must be PNG, JPG, JPEG, GIF, or WebP');
        }

        return true;
    }

    handleUploadError(status, data) {
        switch (status) {
            case 413:
                throw new Error('Image file must be under 15MB');
            case 400:
                if (data.error?.includes('file type') || data.error?.includes('Unsupported')) {
                    throw new Error('Unsupported file type. Please upload PNG, JPG, JPEG, GIF, or WebP images.');
                } else if (data.error?.includes('required')) {
                    throw new Error('Image file is required');
                } else if (data.error?.includes('Invalid image')) {
                    throw new Error('Invalid image file. Please check your file and try again.');
                } else {
                    throw new Error(data.error || 'Bad request');
                }
            case 429:
                throw new Error('Too many requests. Please wait a moment and try again.');
            case 500:
                throw new Error('Server error. Please try again later.');
            default:
                throw new Error(data.error || `Upload failed with status ${status}`);
        }
    }
}