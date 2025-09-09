// Test script to verify fee share config format
import { BagsSDKClient } from './bags-sdk-client.js';

async function testFeeShareConfig() {
    console.log('🧪 Testing Fee Share Config Format');
    console.log('==================================');
    
    const sdk = new BagsSDKClient();
    
    // Wait for SDK to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test parameters
    const testParams = {
        username: 'elonmusk',
        platform: 'twitter',
        creatorBps: 1000,  // 10%
        claimerBps: 9000,  // 90%
        creatorWallet: '11111111111111111111111111111112', // Test wallet
        tokenMint: '22222222222222222222222222222223'     // Test token
    };
    
    console.log('📋 Test Parameters:', testParams);
    
    try {
        // This will fail at the wallet lookup stage, but we can see the format
        await sdk.createFeeShareConfig(
            testParams.username,
            testParams.platform,
            testParams.creatorBps,
            testParams.claimerBps,
            testParams.creatorWallet,
            testParams.tokenMint
        );
    } catch (error) {
        console.log('Expected error (wallet lookup will fail):', error.message);
    }
}

// Run test if this file is loaded directly
if (typeof window !== 'undefined') {
    window.testFeeShareConfig = testFeeShareConfig;
    console.log('💡 Run testFeeShareConfig() in console to test');
}