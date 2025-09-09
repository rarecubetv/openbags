import dotenv from "dotenv";
dotenv.config({ quiet: true });

import { BagsSDK } from "@bagsfm/bags-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

// Test configuration
const BAGS_API_KEY = process.env.BAGS_API_KEY;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

if (!BAGS_API_KEY) {
    console.error("❌ BAGS_API_KEY is required in .env file");
    process.exit(1);
}

const connection = new Connection(SOLANA_RPC_URL);
const sdk = new BagsSDK(BAGS_API_KEY, connection, "processed");

/**
 * Test SDK connection and basic functionality
 */
async function testSDKConnection() {
    console.log("🧪 Testing SDK Connection...\n");
    
    try {
        // Test 1: Check if SDK initializes properly
        console.log("✅ SDK initialized successfully");
        console.log("🔗 RPC URL:", SOLANA_RPC_URL);
        console.log("🔑 API Key:", BAGS_API_KEY.substring(0, 20) + "...");
        
        // Test 2: Test connection to Solana network
        const slot = await connection.getSlot();
        console.log("✅ Solana connection successful, current slot:", slot);
        
        // Test 3: Test SDK state methods
        const sdkConnection = sdk.state.getConnection();
        const commitment = sdk.state.getCommitment();
        console.log("✅ SDK state methods working");
        console.log("📊 Commitment level:", commitment);
        
        return true;
        
    } catch (error) {
        console.error("❌ SDK connection test failed:", error.message);
        return false;
    }
}

/**
 * Test fee share wallet lookup functionality
 */
async function testFeeShareWalletLookup() {
    console.log("\n🧪 Testing Fee Share Wallet Lookup...\n");
    
    const testUsernames = [
        "elonmusk",
        "jack", 
        "sundarpichai",
        "nonexistentuser12345" // This should fail
    ];
    
    for (const username of testUsernames) {
        try {
            console.log(`🔍 Looking up wallet for @${username}...`);
            const wallet = await sdk.state.getLaunchWalletForTwitterUsername(username);
            console.log(`✅ Found wallet for @${username}: ${wallet.toString()}`);
            
            // Validate it's a proper PublicKey
            if (wallet instanceof PublicKey) {
                console.log(`✅ Valid PublicKey format`);
            } else {
                console.log(`⚠️  Unexpected wallet format:`, typeof wallet);
            }
            
        } catch (error) {
            console.log(`❌ Failed to find wallet for @${username}: ${error.message}`);
        }
        
        console.log(""); // Empty line for readability
    }
}

/**
 * Test token info creation (without actually creating)
 */
async function testTokenInfoCreation() {
    console.log("🧪 Testing Token Info Creation Process...\n");
    
    try {
        // Test creating a blob from URL (simulating image upload)
        const imageUrl = "https://img.freepik.com/premium-vector/white-abstract-vactor-background-design_665257-153.jpg";
        console.log("📥 Fetching test image from URL...");
        
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        
        const imageBlob = await imageResponse.blob();
        console.log("✅ Image fetched successfully");
        console.log("📊 Image size:", imageBlob.size, "bytes");
        console.log("📊 Image type:", imageBlob.type);
        
        // Test the parameters that would be passed to createTokenInfoAndMetadata
        const tokenParams = {
            image: imageBlob,
            name: "Test Token",
            symbol: "TEST",
            description: "A test token for SDK validation",
            telegram: "https://t.me/testtoken",
            twitter: "https://twitter.com/testtoken",
            website: "https://testtoken.com",
        };
        
        console.log("✅ Token parameters prepared:");
        console.log("📝 Name:", tokenParams.name);
        console.log("🏷️  Symbol:", tokenParams.symbol);
        console.log("📄 Description:", tokenParams.description);
        console.log("🔗 Links:", {
            telegram: tokenParams.telegram,
            twitter: tokenParams.twitter,
            website: tokenParams.website
        });
        
        console.log("ℹ️  Token info creation test completed (no actual token created)");
        
    } catch (error) {
        console.error("❌ Token info creation test failed:", error.message);
    }
}

/**
 * Test fee share config parameters
 */
async function testFeeShareConfigParams() {
    console.log("\n🧪 Testing Fee Share Config Parameters...\n");
    
    try {
        // Test different fee split scenarios
        const scenarios = [
            { name: "90/10 Split", creatorBps: 1000, claimerBps: 9000 },
            { name: "50/50 Split", creatorBps: 5000, claimerBps: 5000 },
            { name: "80/20 Split", creatorBps: 8000, claimerBps: 2000 },
            { name: "95/5 Split", creatorBps: 9500, claimerBps: 500 },
        ];
        
        for (const scenario of scenarios) {
            console.log(`📊 Testing ${scenario.name}:`);
            console.log(`   Creator: ${scenario.creatorBps / 100}% (${scenario.creatorBps} bps)`);
            console.log(`   Claimer: ${scenario.claimerBps / 100}% (${scenario.claimerBps} bps)`);
            console.log(`   Total: ${(scenario.creatorBps + scenario.claimerBps) / 100}%`);
            
            // Validate total is 100%
            if (scenario.creatorBps + scenario.claimerBps === 10000) {
                console.log("   ✅ Valid fee split (totals 100%)");
            } else {
                console.log("   ❌ Invalid fee split (does not total 100%)");
            }
            console.log("");
        }
        
        // Test wSOL mint address
        const wsolMint = "So11111111111111111111111111111111111111112";
        try {
            const wsolPublicKey = new PublicKey(wsolMint);
            console.log("✅ wSOL mint address is valid:", wsolPublicKey.toString());
        } catch (error) {
            console.log("❌ wSOL mint address is invalid:", error.message);
        }
        
    } catch (error) {
        console.error("❌ Fee share config test failed:", error.message);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log("🚀 Starting Bags SDK Tests\n");
    console.log("=" .repeat(60));
    
    const connectionSuccess = await testSDKConnection();
    
    if (connectionSuccess) {
        await testFeeShareWalletLookup();
        await testTokenInfoCreation();
        await testFeeShareConfigParams();
    } else {
        console.log("⚠️  Skipping other tests due to connection failure");
    }
    
    console.log("=" .repeat(60));
    console.log("🎉 Tests completed!");
    console.log("\nNext steps:");
    console.log("1. Copy .env.example to .env and fill in your credentials");
    console.log("2. Run 'npm install' to install dependencies");
    console.log("3. Run 'npm start' to launch a test token");
    console.log("4. Run 'node examples.js' to see different fee sharing examples");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}