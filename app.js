// Bags SDK UI Application
import { BagsSDKClient } from './bags-sdk-client.js';

class BagsTokenLauncher {
    constructor() {
        this.wallet = null;
        this.isConnected = false;
        this.selectedSocial = 'twitter'; // Only Twitter supported now
        this.sdk = new BagsSDKClient();
        this.solPrice = 0; // Cache SOL price
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupImageUpload();
        this.setupFeeSlider();
        await this.checkWalletConnection();
        
        // Test bs58 library
        this.testBS58();
    }

    testBS58() {
        try {
            if (typeof bs58 !== 'undefined') {
                // Test with a simple base58 string
                const testString = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';
                const decoded = bs58.decode(testString);
                console.log('✅ bs58 library working correctly');
                return true;
            } else {
                console.error('❌ bs58 library not loaded');
                return false;
            }
        } catch (error) {
            console.error('❌ bs58 library error:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Wallet connection
        document.getElementById('connectWalletBtn').addEventListener('click', () => this.toggleWallet());
        
        // More options toggle
        document.getElementById('moreOptionsBtn').addEventListener('click', () => this.toggleMoreOptions());
        
        // Username input for fee sharing
        document.getElementById('socialUsername').addEventListener('input', (e) => this.handleUsernameInput(e));
        
        // Initial buy input for cost calculation
        document.getElementById('initialBuy').addEventListener('input', (e) => this.handleInitialBuyInput(e));
        
        // Form submission
        document.getElementById('tokenForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        
        // Remove image button
        document.getElementById('removeImage').addEventListener('click', () => this.removeImage());
    }

    setupImageUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('tokenImage');
        const uploadContent = document.getElementById('uploadContent');
        const imagePreview = document.getElementById('imagePreview');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => this.handleImageUpload(e.target.files[0]));

        // Drag and drop with validation
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                // Let handleImageUpload do the validation
                this.handleImageUpload(file);
            }
        });
    }

    setupFeeSlider() {
        const slider = document.getElementById('feeSlider');
        const yourPercent = document.getElementById('yourPercent');
        const theirPercent = document.getElementById('theirPercent');
        const yourPercentDisplay = document.getElementById('yourPercentDisplay');
        const theirPercentDisplay = document.getElementById('theirPercentDisplay');

        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            yourPercent.textContent = value;
            theirPercent.textContent = 100 - value;
            if (yourPercentDisplay) yourPercentDisplay.textContent = value;
            if (theirPercentDisplay) theirPercentDisplay.textContent = 100 - value;
            this.updateFeeShareInfo();
        });
    }

    async checkWalletConnection() {
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: true });
                if (response.publicKey) {
                    await this.setConnectedWallet(response.publicKey.toString(), 'phantom');
                }
            } catch (error) {
                console.log('No trusted connection found');
            }
        }
    }

    async toggleWallet() {
        if (this.isConnected) {
            this.disconnectWallet();
        } else {
            await this.connectWallet();
        }
    }

    async connectWallet() {
        const connectBtn = document.getElementById('connectWalletBtn');
        
        try {
            if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
                connectBtn.textContent = 'Connecting...';
                connectBtn.disabled = true;

                const response = await window.solana.connect();
                await this.setConnectedWallet(response.publicKey.toString(), 'phantom');
            } else {
                this.showError('No Solana wallet detected. Please install Phantom wallet.');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showError('Failed to connect wallet. Please try again.');
        } finally {
            connectBtn.disabled = false;
        }
    }

    async setConnectedWallet(publicKey, walletType) {
        this.wallet = publicKey;
        this.isConnected = true;

        // Update UI
        const connectBtn = document.getElementById('connectWalletBtn');
        const launchBtn = document.getElementById('launchBtn');
        const launchBtnText = document.getElementById('launchBtnText');
        const walletBalance = document.getElementById('walletBalance');

        // Update wallet button to show connected state
        connectBtn.textContent = `${this.formatAddress(publicKey)} ✓`;
        connectBtn.className = 'bg-bags-green hover:bg-green-400 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-black';
        
        // Enable launch button
        launchBtn.disabled = false;
        launchBtnText.textContent = 'Create Coin';
        
        // Show wallet balance
        walletBalance.classList.remove('hidden');
        walletBalance.classList.add('flex');
        
        // Show balance display in form
        const walletBalanceDisplay = document.getElementById('walletBalanceDisplay');
        if (walletBalanceDisplay) {
            walletBalanceDisplay.classList.remove('hidden');
            walletBalanceDisplay.classList.add('flex');
        }

        // Load wallet balance
        await this.updateWalletBalance(publicKey);

        // Save to localStorage
        localStorage.setItem('connectedWallet', publicKey);
        localStorage.setItem('walletType', walletType);
    }

    disconnectWallet() {
        this.wallet = null;
        this.isConnected = false;

        // Update UI
        const connectBtn = document.getElementById('connectWalletBtn');
        const launchBtn = document.getElementById('launchBtn');
        const launchBtnText = document.getElementById('launchBtnText');
        const walletBalance = document.getElementById('walletBalance');

        connectBtn.textContent = 'Connect Wallet';
        connectBtn.className = 'bg-bags-blue hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition-all duration-200';
        
        launchBtn.disabled = true;
        launchBtnText.textContent = 'Connect Wallet';
        
        walletBalance.classList.add('hidden');
        walletBalance.classList.remove('flex');
        
        // Hide balance display in form
        const walletBalanceDisplay = document.getElementById('walletBalanceDisplay');
        if (walletBalanceDisplay) {
            walletBalanceDisplay.classList.add('hidden');
            walletBalanceDisplay.classList.remove('flex');
        }

        // Clear localStorage
        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('walletType');
    }

    async updateWalletBalance(walletAddress) {
        const balanceAmount = document.getElementById('balanceAmount');
        const balanceUsd = document.getElementById('balanceUsd');

        try {
            balanceAmount.textContent = 'Loading...';
            
            // Use the SDK client's RPC URL (Helius if configured)
            const rpcUrl = this.sdk.getRpcUrl();
            console.log('🔗 Using RPC:', rpcUrl.includes('helius') ? 'Helius' : 'Default');
            const connection = new solanaWeb3.Connection(rpcUrl);
            const balance = await connection.getBalance(new solanaWeb3.PublicKey(walletAddress));
            const sol = balance / solanaWeb3.LAMPORTS_PER_SOL;
            
            // Update header balance
            if (balanceAmount) balanceAmount.textContent = `${sol.toFixed(3)} SOL`;
            
            // Update form balance display
            const balanceDisplay = document.getElementById('balanceDisplay');
            if (balanceDisplay) balanceDisplay.textContent = `${sol.toFixed(9)} SOL`;

            // Fetch SOL price
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                const data = await response.json();
                const solPrice = data.solana?.usd || 0;
                const usdValue = sol * solPrice;
                if (balanceUsd) balanceUsd.textContent = `$${usdValue.toFixed(2)}`;
                
                // Update form USD display
                const formUsdValue = document.getElementById('usdValue');
                if (formUsdValue) formUsdValue.textContent = `$${usdValue.toFixed(2)}`;
            } catch (error) {
                balanceUsd.textContent = '$--';
            }
        } catch (error) {
            console.error('Failed to load wallet balance:', error);
            if (balanceAmount) balanceAmount.textContent = '-- SOL';
            if (balanceUsd) balanceUsd.textContent = '$--';
            
            // Also update form balance display
            const balanceDisplay = document.getElementById('balanceDisplay');
            const usdValue = document.getElementById('usdValue');
            if (balanceDisplay) balanceDisplay.textContent = '-- SOL';
            if (usdValue) usdValue.textContent = '$--';
        }
    }

    // Twitter is the only supported platform now

    handleUsernameInput(e) {
        const rawInput = e.target.value.trim();
        const feeSplitControls = document.getElementById('feeSplitControls');
        const feeShareInfo = document.getElementById('feeShareInfo');
        
        // Clean the username - remove @ symbol and any URLs
        const cleanUsername = this.cleanUsername(rawInput);
        
        // Update the input with cleaned username if it was changed
        if (cleanUsername !== rawInput && cleanUsername !== '') {
            e.target.value = cleanUsername;
        }
        
        // Validate username format
        const validation = this.validateUsername(cleanUsername);
        
        if (cleanUsername.length > 0) {
            if (validation.isValid) {
                // Show fee sharing controls
                feeSplitControls.classList.remove('hidden');
                feeShareInfo.classList.remove('hidden');
                this.clearUsernameError();
                this.updateFeeShareInfo();
            } else {
                // Show error, hide controls
                feeSplitControls.classList.add('hidden');
                feeShareInfo.classList.add('hidden');
                this.showUsernameError(validation.error);
            }
        } else {
            // Empty username - hide everything
            feeSplitControls.classList.add('hidden');
            feeShareInfo.classList.add('hidden');
            this.clearUsernameError();
        }
    }

    cleanUsername(input) {
        if (!input) return '';
        
        // Remove @ symbol if present
        let cleaned = input.replace(/^@+/, '');
        
        // Extract username from Twitter URLs
        const twitterUrlMatch = cleaned.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
        if (twitterUrlMatch) {
            cleaned = twitterUrlMatch[1];
        }
        
        // Remove any remaining URL parts
        cleaned = cleaned.replace(/^https?:\/\//, '');
        cleaned = cleaned.replace(/\/.*$/, '');
        
        return cleaned;
    }

    validateUsername(username) {
        if (!username) {
            return { isValid: true, error: null }; // Empty is valid (optional)
        }
        
        // Twitter username rules:
        // - 1-15 characters
        // - Only letters, numbers, and underscores
        // - Cannot be all numbers
        const twitterUsernameRegex = /^[a-zA-Z0-9_]{1,15}$/;
        const allNumbersRegex = /^\d+$/;
        
        if (!twitterUsernameRegex.test(username)) {
            return {
                isValid: false,
                error: 'Username must be 1-15 characters and contain only letters, numbers, and underscores'
            };
        }
        
        if (allNumbersRegex.test(username)) {
            return {
                isValid: false,
                error: 'Username cannot be all numbers'
            };
        }
        
        return { isValid: true, error: null };
    }

    showUsernameError(error) {
        let errorElement = document.getElementById('usernameError');
        if (!errorElement) {
            // Create error element
            errorElement = document.createElement('div');
            errorElement.id = 'usernameError';
            errorElement.className = 'text-red-400 text-sm mt-1';
            
            const usernameInput = document.getElementById('socialUsername');
            usernameInput.parentNode.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = error;
        errorElement.classList.remove('hidden');
        
        // Add error styling to input
        const usernameInput = document.getElementById('socialUsername');
        usernameInput.classList.add('border-red-500');
        usernameInput.classList.remove('border-bags-border');
    }

    clearUsernameError() {
        const errorElement = document.getElementById('usernameError');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        
        // Remove error styling from input
        const usernameInput = document.getElementById('socialUsername');
        usernameInput.classList.remove('border-red-500');
        usernameInput.classList.add('border-bags-border');
    }

    updateFeeShareInfo() {
        const infoElement = document.getElementById('feeShareInfo').querySelector('p');
        const theirPercent = document.getElementById('theirPercent').textContent;
        const yourPercent = document.getElementById('yourPercent').textContent;

        if (infoElement) {
            infoElement.innerHTML = `The Twitter user above will be able to claim <span class="text-white font-medium">${theirPercent}%</span> of the fees generated by this coin, you will receive the remaining <span class="text-white font-medium">${yourPercent}%</span>`;
        }
    }

    toggleMoreOptions() {
        const moreOptions = document.getElementById('moreOptions');
        const moreOptionsBtn = document.getElementById('moreOptionsBtn');
        const arrow = moreOptionsBtn.querySelector('svg');
        
        if (moreOptions.classList.contains('hidden')) {
            moreOptions.classList.remove('hidden');
            arrow.style.transform = 'rotate(180deg)';
        } else {
            moreOptions.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }

    handleInitialBuyInput(e) {
        const initialBuyValue = parseFloat(e.target.value) || 0;
        const costBreakdown = document.getElementById('costBreakdown');
        
        if (initialBuyValue > 0) {
            // Show cost breakdown
            costBreakdown.classList.remove('hidden');
            this.updateCostBreakdown(initialBuyValue);
        } else {
            // Hide cost breakdown
            costBreakdown.classList.add('hidden');
        }
    }

    updateCostBreakdown(initialBuy) {
        const transactionFee = 0.05; // Estimated transaction fees
        const totalCost = initialBuy + transactionFee;
        
        // Update display elements
        document.getElementById('initialBuyAmount').textContent = `${initialBuy.toFixed(3)} SOL`;
        document.getElementById('totalCostSOL').textContent = `${totalCost.toFixed(3)} SOL`;
        
        // Update USD value if we have SOL price
        this.updateCostUSD(totalCost);
    }

    async updateCostUSD(totalCostSOL) {
        const totalCostUSD = document.getElementById('totalCostUSD');
        
        // Use cached price if available, otherwise fetch
        if (this.solPrice > 0) {
            const usdValue = totalCostSOL * this.solPrice;
            totalCostUSD.textContent = `$${usdValue.toFixed(2)}`;
        } else {
            try {
                // Get current SOL price
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                const data = await response.json();
                this.solPrice = data.solana?.usd || 0;
                
                if (this.solPrice > 0) {
                    const usdValue = totalCostSOL * this.solPrice;
                    totalCostUSD.textContent = `$${usdValue.toFixed(2)}`;
                } else {
                    totalCostUSD.textContent = '$--';
                }
            } catch (error) {
                console.warn('Could not fetch SOL price for cost calculation:', error);
                totalCostUSD.textContent = '$--';
            }
        }
    }

    updateCostBreakdownUSD(totalCostSOL) {
        const totalCostUSD = document.getElementById('totalCostUSD');
        
        if (this.solPrice > 0) {
            const usdValue = totalCostSOL * this.solPrice;
            totalCostUSD.textContent = `$${usdValue.toFixed(2)}`;
        } else {
            totalCostUSD.textContent = '$--';
        }
    }

    handleImageUpload(file) {
        if (!file) return;

        try {
            // Validate file according to Bags API requirements
            this.validateImageFile(file);

            const uploadContent = document.getElementById('uploadContent');
            const imagePreviewContainer = document.getElementById('imagePreviewContainer');
            const imagePreview = document.getElementById('imagePreview');
            const imageInfo = document.getElementById('imageInfo');

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imageInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
                imagePreviewContainer.classList.remove('hidden');
                uploadContent.classList.add('hidden');
            };
            reader.readAsDataURL(file);

            // Store file for later use
            this.selectedImage = file;
            
            console.log(`✅ Image validated: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        } catch (error) {
            this.showError(error.message);
            // Reset file input
            document.getElementById('tokenImage').value = '';
        }
    }

    removeImage() {
        const uploadContent = document.getElementById('uploadContent');
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        const fileInput = document.getElementById('tokenImage');

        imagePreviewContainer.classList.add('hidden');
        uploadContent.classList.remove('hidden');
        fileInput.value = '';
        this.selectedImage = null;
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

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.isConnected) {
            this.showError('Please connect your wallet first');
            return;
        }

        await this.launchToken();
    }

    async launchToken() {
        const launchBtn = document.getElementById('launchBtn');
        const launchBtnText = document.getElementById('launchBtnText');
        const launchSpinner = document.getElementById('launchSpinner');

        // Show loading state
        launchBtn.disabled = true;
        launchBtnText.textContent = 'Creating Token...';
        launchSpinner.classList.remove('hidden');

        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Validate required fields
            if (!formData.name || !formData.symbol) {
                throw new Error('Token name and symbol are required');
            }

            // Step 1: Create token info and metadata
            this.updateLaunchStatus('Creating token metadata...');
            const tokenInfo = await this.sdk.createTokenInfo(formData);

            // Step 2: Handle fee sharing if username provided
            let feeShareConfig = null;
            if (formData.socialUsername) {
                this.updateLaunchStatus('Setting up fee sharing...');
                feeShareConfig = await this.sdk.createFeeShareConfig(
                    formData.socialUsername,
                    this.selectedSocial,
                    formData.creatorFeeBps,
                    formData.feeClaimerFeeBps,
                    this.wallet,
                    tokenInfo.tokenMint
                );
            }

            // Step 3: Create launch transaction (may need config signing first)
            this.updateLaunchStatus('Preparing launch transaction...');
            const launchResult = await this.sdk.createLaunchTransaction({
                tokenInfo,
                feeShareConfig,
                launchWallet: this.wallet,
                initialBuyLamports: formData.initialBuyLamports
            });

            let signature;

            // Check if we need to sign a config transaction first
            if (launchResult.needsConfigSigning) {
                this.updateLaunchStatus('Please sign the configuration transaction first...');
                console.log('🔐 Signing config transaction first');
                
                // Sign the config transaction
                await this.signAndSendTransaction(launchResult.configTransaction);
                
                // Now create the actual launch transaction
                this.updateLaunchStatus('Creating launch transaction...');
                const launchTx = await this.sdk.createLaunchTransactionAfterConfig({
                    tokenInfo: launchResult.tokenInfo,
                    configKey: launchResult.configKey,
                    launchWallet: launchResult.launchWallet,
                    initialBuyLamports: launchResult.initialBuyLamports
                });
                
                // Sign the launch transaction
                this.updateLaunchStatus('Please sign the launch transaction...');
                signature = await this.signAndSendTransaction(launchTx);
            } else {
                // Single transaction flow
                this.updateLaunchStatus('Please sign the transaction in your wallet...');
                signature = await this.signAndSendTransaction(launchResult);
            }

            // Success!
            this.showSuccess({
                tokenMint: tokenInfo.tokenMint,
                signature,
                tokenMetadata: tokenInfo.tokenMetadata,
                feeSharing: feeShareConfig ? {
                    username: formData.socialUsername,
                    platform: this.selectedSocial,
                    creatorPercent: formData.creatorFeeBps / 100,
                    claimerPercent: formData.feeClaimerFeeBps / 100
                } : null
            });

        } catch (error) {
            console.error('Token launch failed:', error);
            this.showError(error.message);
        } finally {
            // Reset button state
            launchBtn.disabled = false;
            launchBtnText.textContent = 'Create Token';
            launchSpinner.classList.add('hidden');
        }
    }

    collectFormData() {
        // Get fee split percentages, with fallback to defaults if elements are hidden
        const yourPercentElement = document.getElementById('yourPercent');
        const theirPercentElement = document.getElementById('theirPercent');
        
        const yourPercent = yourPercentElement ? parseInt(yourPercentElement.textContent) || 10 : 10;
        const theirPercent = theirPercentElement ? parseInt(theirPercentElement.textContent) || 90 : 90;
        const initialBuy = parseFloat(document.getElementById('initialBuy').value) || 0;
        
        // Clean and validate username
        const rawUsername = document.getElementById('socialUsername').value.trim();
        const cleanUsername = this.cleanUsername(rawUsername);
        const usernameValidation = this.validateUsername(cleanUsername);
        
        if (cleanUsername && !usernameValidation.isValid) {
            throw new Error(`Invalid username: ${usernameValidation.error}`);
        }

        console.log('📊 Form data debug:', {
            yourPercent,
            theirPercent,
            creatorFeeBps: yourPercent * 100,
            feeClaimerFeeBps: theirPercent * 100,
            socialUsername: cleanUsername
        });

        return {
            name: document.getElementById('tokenName').value.trim(),
            symbol: document.getElementById('tokenSymbol').value.trim(),
            description: document.getElementById('tokenDescription').value.trim(),
            image: this.selectedImage,
            socialUsername: cleanUsername,
            websiteLink: document.getElementById('websiteLink').value.trim(),
            twitterLink: document.getElementById('twitterLink').value.trim(),
            telegramLink: document.getElementById('telegramLink').value.trim(),
            creatorFeeBps: yourPercent * 100,
            feeClaimerFeeBps: theirPercent * 100,
            initialBuyLamports: Math.floor(initialBuy * solanaWeb3.LAMPORTS_PER_SOL)
        };
    }

    async signAndSendTransaction(serializedTx) {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not found');
        }

        try {
            console.log('🔐 Signing transaction...');
            
            // Check if bs58 is available
            if (typeof bs58 === 'undefined') {
                throw new Error('Required library not loaded. Please refresh the page and try again.');
            }
            
            // Decode the serialized transaction
            console.log('📦 Decoding transaction with bs58...');
            const txBuffer = bs58.decode(serializedTx);
            const transaction = solanaWeb3.VersionedTransaction.deserialize(txBuffer);

            // Sign the transaction
            const signedTx = await window.solana.signTransaction(transaction);
            console.log('✅ Transaction signed');

            // Send the transaction using configured RPC
            const rpcUrl = this.sdk.getRpcUrl();
            const connection = new solanaWeb3.Connection(rpcUrl);
            
            console.log('📡 Sending transaction...');
            const signature = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: true,
                maxRetries: 3
            });
            
            console.log('📨 Transaction sent:', signature);

            // Confirm the transaction
            console.log('⏳ Confirming transaction...');
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            console.log('✅ Transaction confirmed:', signature);
            return signature;
        } catch (error) {
            console.error('❌ Transaction error:', error);
            if (error.message.includes('User rejected')) {
                throw new Error('Transaction was rejected by user');
            }
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient SOL balance for transaction fees');
            }
            throw error;
        }
    }

    updateLaunchStatus(message) {
        const launchBtnText = document.getElementById('launchBtnText');
        launchBtnText.textContent = message;
    }

    showUploadProgress(show = true) {
        const uploadArea = document.getElementById('uploadArea');
        if (show) {
            uploadArea.classList.add('opacity-50', 'pointer-events-none');
            // Could add a spinner here
        } else {
            uploadArea.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    async testConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        const originalText = testBtn.textContent;
        
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        try {
            const isConnected = await this.sdk.testConnection();
            if (isConnected) {
                this.showSuccess({ message: 'Connection test successful!' });
            } else {
                this.showError('Connection test failed');
            }
        } catch (error) {
            this.showError(`Connection test failed: ${error.message}`);
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    showSuccess(data) {
        this.showModal('success', data);
    }

    showError(message) {
        this.showModal('error', { message });
    }

    showModal(type, data) {
        const modal = document.getElementById('resultsModal');
        const content = document.getElementById('resultsContent');

        if (type === 'success') {
            content.innerHTML = `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h4 class="text-xl font-bold text-green-400">Token Created Successfully!</h4>
                    ${data.tokenMint ? `
                        <div class="space-y-3 text-left">
                            <div class="p-4 bg-white/5 rounded-lg">
                                <p class="text-sm text-gray-400">Token Mint</p>
                                <p class="font-mono text-sm break-all">${data.tokenMint}</p>
                            </div>
                            ${data.signature ? `
                                <div class="p-4 bg-white/5 rounded-lg">
                                    <p class="text-sm text-gray-400">Transaction Signature</p>
                                    <p class="font-mono text-sm break-all">${data.signature}</p>
                                </div>
                            ` : ''}
                            ${data.feeSharing ? `
                                <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p class="text-sm text-blue-400 font-medium">Fee Sharing Active</p>
                                    <p class="text-sm text-gray-300">@${data.feeSharing.username} on ${data.feeSharing.platform}</p>
                                    <p class="text-sm text-gray-300">Split: ${data.feeSharing.creatorPercent}% / ${data.feeSharing.claimerPercent}%</p>
                                </div>
                            ` : ''}
                            <div class="flex space-x-3">
                                <a href="https://bags.fm/${data.tokenMint}" target="_blank" 
                                   class="flex-1 bg-bags-purple hover:bg-purple-600 text-center py-3 rounded-lg font-medium transition-colors">
                                    View on Bags.fm
                                </a>
                                <a href="https://solscan.io/tx/${data.signature}" target="_blank" 
                                   class="flex-1 bg-white/10 hover:bg-white/20 text-center py-3 rounded-lg font-medium transition-colors">
                                    View Transaction
                                </a>
                            </div>
                        </div>
                    ` : `<p class="text-green-300">${data.message}</p>`}
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h4 class="text-xl font-bold text-red-400">Error</h4>
                    <p class="text-red-300">${data.message}</p>
                </div>
            `;
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('resultsModal').classList.add('hidden');
    }

    formatAddress(address) {
        if (!address || address.length < 8) return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BagsTokenLauncher();
});