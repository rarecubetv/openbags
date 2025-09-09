# Design Document

## Overview

The Bags SDK project cleanup will transform the current development-focused codebase into a production-ready open source toolkit. The design focuses on maintaining both CLI and web UI functionality while ensuring security, documentation quality, and ease of use for open source contributors.

## Architecture

### Project Structure
The cleaned project will maintain a dual-architecture approach:

```
bags-sdk-toolkit/
├── cli/                    # CLI-focused components
│   ├── index.js           # Main CLI SDK
│   ├── dev.js             # Interactive development mode
│   ├── examples.js        # CLI examples
│   └── test.js            # CLI tests
├── ui/                    # Web UI components
│   ├── index.html         # Main UI
│   ├── app.js             # Application logic
│   ├── bags-sdk-client.js # Browser SDK wrapper
│   ├── server.js          # Express server
│   └── package.json       # UI dependencies
├── docs/                  # Documentation
│   ├── CLI.md             # CLI documentation
│   ├── UI.md              # UI documentation
│   └── API.md             # API reference
├── .env.example           # Environment template
├── package.json           # Main dependencies
└── README.md              # Main documentation
```

### Component Separation
- **CLI Components**: Self-contained command-line tools for programmatic use
- **UI Components**: Modern web interface for visual token creation
- **Shared Components**: Common utilities and SDK wrappers
- **Documentation**: Comprehensive guides for both approaches

## Components and Interfaces

### CLI Interface
The CLI interface provides programmatic access to token creation:

```javascript
// Main functions
export async function launchTokenWithSharedFees(params)
export async function launchTokenStandard(params)
export async function getFeeShareWallet(twitterUsername)

// Interactive mode
export async function devMode()
```

### Web UI Interface
The web UI provides a browser-based interface:

```javascript
class BagsTokenLauncher {
    async connectWallet()
    async uploadImage()
    async createToken()
    async setupFeeSharing()
}
```

### Configuration Management
Environment configuration will be standardized:

```javascript
// Required environment variables
BAGS_API_KEY=your_api_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PRIVATE_KEY=your_private_key_here

// Optional variables
HELIUS_API_KEY=your_helius_key_here
PORT=3003
```

## Data Models

### Token Configuration
```javascript
interface TokenConfig {
    name: string;
    symbol: string;
    description: string;
    image: File | string;
    initialBuySOL?: number;
    socialLinks?: {
        telegram?: string;
        twitter?: string;
        website?: string;
    };
}
```

### Fee Sharing Configuration
```javascript
interface FeeShareConfig {
    creatorFeeBps: number;    // Basis points (100 = 1%)
    feeClaimerFeeBps: number; // Basis points
    feeClaimerHandle: string; // Twitter username
    platform: 'twitter';     // Currently only Twitter supported
}
```

### Launch Result
```javascript
interface LaunchResult {
    tokenMint: string;
    signature: string;
    tokenMetadata: string;
    feeShareWallet?: string;
    feeSplit?: {
        creator: number;
        feeClaimer: number;
    };
}
```

## Error Handling

### CLI Error Handling
- Comprehensive error messages with actionable guidance
- Graceful handling of network failures and API errors
- Input validation with clear feedback
- Retry mechanisms for transient failures

### UI Error Handling
- User-friendly error messages in the interface
- Visual feedback for loading states and errors
- Automatic retry for failed operations
- Clear guidance for wallet connection issues

### Security Error Handling
- Never expose private keys in error messages
- Sanitize all user inputs
- Validate environment configuration
- Secure handling of API keys

## Testing Strategy

### Unit Testing
- Test core SDK functions with mocked dependencies
- Validate fee calculation logic
- Test error handling scenarios
- Verify input validation

### Integration Testing
- Test wallet connection flows
- Validate token creation end-to-end (on testnet)
- Test fee sharing configuration
- Verify UI interactions

### Security Testing
- Ensure no sensitive data leakage
- Validate input sanitization
- Test environment variable handling
- Verify wallet security practices

### Documentation Testing
- Validate all code examples work
- Test installation instructions
- Verify quick start guide accuracy
- Check API documentation completeness

## Security Considerations

### Environment Security
- All sensitive data moved to environment variables
- .env.example contains only placeholder values
- .gitignore prevents committing sensitive files
- Clear documentation on security best practices

### Wallet Security
- Client-side signing only (no private key transmission)
- Clear warnings about using test wallets for development
- Secure connection requirements for production
- Proper error handling without exposing keys

### API Security
- API keys loaded from environment only
- Rate limiting considerations documented
- Secure HTTPS connections required
- Input validation and sanitization

## Documentation Strategy

### README Enhancement
- Clear project description and purpose
- Quick start guide (5-minute setup)
- Feature overview with screenshots
- Installation and configuration steps
- Usage examples for both CLI and UI

### API Documentation
- Complete function reference
- Parameter descriptions and types
- Return value specifications
- Error handling documentation
- Code examples for each function

### User Guides
- CLI usage guide with examples
- UI usage guide with screenshots
- Troubleshooting common issues
- Best practices and security guidelines

### Developer Documentation
- Contributing guidelines
- Code structure explanation
- Development setup instructions
- Testing procedures

## Deployment Considerations

### Package Distribution
- NPM package for CLI components
- Standalone UI that can be hosted anywhere
- Docker support for containerized deployment
- Clear deployment instructions

### Environment Setup
- Development vs production configurations
- Environment variable documentation
- Network configuration options
- Performance optimization guidelines

### Monitoring and Logging
- Structured logging for debugging
- Error tracking and reporting
- Performance monitoring capabilities
- User analytics (privacy-respecting)

## Migration Strategy

### File Organization
1. Create new directory structure
2. Move files to appropriate locations
3. Update import paths and references
4. Remove duplicate or unnecessary files

### Documentation Updates
1. Rewrite README with open source focus
2. Create separate CLI and UI documentation
3. Update API documentation
4. Add contributing guidelines

### Security Cleanup
1. Remove all hardcoded credentials
2. Update .env.example with placeholders
3. Enhance .gitignore for security
4. Add security documentation

### Testing and Validation
1. Test both CLI and UI functionality
2. Validate documentation accuracy
3. Ensure no sensitive data remains
4. Verify open source compliance