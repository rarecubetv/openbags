# OpenBags - Bags Token Launcher

A modern web interface for creating Solana tokens with fee sharing capabilities using the Bags SDK.

## Features

- **Wallet Integration**: Connect with Phantom wallet
- **Token Creation**: Launch tokens with custom metadata and images
- **Fee Sharing**: Split trading fees with Twitter influencers
- **Drag & Drop**: Upload token images easily
- **Mobile Responsive**: Works on all devices

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd bags-token-launcher
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your BAGS_API_KEY
   ```

3. **Start the app**
   ```bash
   npm start
   ```

4. **Open browser**
   ```
   http://localhost:3003
   ```

## Environment Variables

Create a `.env` file with:

```bash
BAGS_API_KEY=your_bags_api_key_here
HELIUS_API_KEY=your_helius_key_here  # Optional, for better RPC performance
PORT=3003                            # Optional, defaults to 3003
```

## Usage

1. **Connect Wallet** - Click "Connect Wallet" to connect your Phantom wallet
2. **Upload Image** - Drag & drop your token image (PNG, JPG, GIF up to 10MB)
3. **Configure Token** - Enter name, symbol, description, and social links
4. **Set Fee Sharing** - Optional: Enter Twitter username and adjust fee split
5. **Launch Token** - Review details and sign the transaction

## Fee Sharing

Configure fee splits between you and Twitter influencers:
- **90/10**: 90% to influencer, 10% to creator
- **50/50**: Equal split
- **80/20**: 80% to creator, 20% to influencer
- **Custom**: Set any percentage split

## Development

```bash
npm run dev    # Start development server
npm test       # Run tests
```

## File Structure

```
├── index.html          # Main UI
├── app.js             # Application logic
├── bags-sdk-client.js # Bags SDK wrapper
├── server.js          # Express server
└── package.json       # Dependencies
```

## Security

- All wallet signing happens client-side
- API keys are loaded server-side only
- No private keys are stored or transmitted
- Use HTTPS in production

## License

MIT

---

Built by [rarecube.tv](https://rarecube.tv)
