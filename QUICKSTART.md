# Quick Start

Setup and configuration guide.

## Prerequisites

- Node.js 20 or higher
- pnpm 10.28.0 or higher
- MongoDB Atlas account (free tier works)
- Google Gemini API key (free tier available)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Dawgsrlife/Architex.git
cd Architex
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Required for basic functionality
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/architex?retryWrites=true&w=majority
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here

# Optional (can be added later)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_solana_private_key_here
```

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting API Keys

### MongoDB Atlas (Required)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password

### Google Gemini API (Required)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key

### GitHub Token (Required)

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:user`
4. Copy the token

### ElevenLabs (Optional)

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Create an account
3. Go to Profile → API Keys
4. Copy your API key

### Solana (Optional)

For Solana integration:
1. Install Phantom wallet or similar
2. Create a wallet
3. Export the private key (keep it secure!)
4. Use a Solana RPC URL (free from Alchemy, QuickNode, etc.)

## Verify Installation

### Test the Application

1. Visit http://localhost:3000
2. Click "Get Started" to go to the workflow builder
3. Try creating a workflow with React Flow
4. Visit the Dashboard to see the interface

### Test AI Code Generation

```bash
curl -X POST http://localhost:3000/api/ai/generate-code \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a React button component", "language": "typescript"}'
```

### Test GitHub Integration

```bash
curl http://localhost:3000/api/github/repos
```

## Common Issues

### Port 3000 Already in Use

Use a different port:

```bash
PORT=3001 pnpm dev
```

### MongoDB Connection Error

- Check your connection string
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify your database password is correct

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

## Next Steps

1. **Customize the UI**: Edit components in `src/components/`
2. **Add Features**: Create new pages in `src/app/`
3. **Configure Database**: Add more models in `src/lib/models/`
4. **Deploy**: Follow the [DEPLOYMENT.md](DEPLOYMENT.md) guide

## Development Tips

### Hot Reload

The development server supports hot reload. Changes to your code will automatically refresh the browser.

### TypeScript

Run type checking:

```bash
pnpm type-check
```

### Linting

Run ESLint:

```bash
pnpm lint
```

### Building

Test production build:

```bash
pnpm build
pnpm start
```

## Project Structure

```
architex/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities and integrations
│   ├── stores/           # Zustand state management
│   └── types/            # TypeScript types
├── public/               # Static files
└── ...config files
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Google Gemini AI Docs](https://ai.google.dev/docs)

## Getting Help

- Check [API.md](API.md) for API documentation
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Open an issue on GitHub for bugs or questions

## What's Next?

- Explore the workflow builder at `/workflow`
- Check out the dashboard at `/dashboard`
- Try the AI code generation API
- Customize the application to your needs
