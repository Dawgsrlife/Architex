# Architex

Full-stack application with separated React frontend and Python FastAPI backend for architecture generation and code development workflows.

## Features

- Next.js 16+ with React 19 and TypeScript 5.9
- TailwindCSS 4 for responsive UI
- GSAP 3.13 for animations
- Zustand for state management
- TanStack Query v5 for data fetching and caching
- React Hook Form with Zod validation
- Shadcn/ui component library
- React Flow for workflow visualization
- MongoDB Atlas with async Motor driver
- Google Gemini AI for code generation
- GitHub API integration
- Python FastAPI backend
- GitHub OAuth authentication
- Async background job processing

## Prerequisites

- Node.js 20+
- pnpm 10.28.0+
- MongoDB Atlas account
- Google Gemini API key
- GitHub token
- ElevenLabs API key (optional)
- Solana wallet (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Dawgsrlife/Architex.git
cd Architex
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials.

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
architex/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── workflow/     # Workflow builder
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/           # Shadcn/ui components
│   │   └── providers.tsx # App providers
│   ├── lib/              # Utilities and integrations
│   │   ├── db/           # Database connection
│   │   ├── models/       # Mongoose models
│   │   ├── integrations/ # External API integrations
│   │   └── utils.ts      # Utility functions
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── .env.example          # Environment variables template
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Environment Variables

See `.env.example` for all required environment variables:

- `MONGODB_URI` - MongoDB Atlas connection string
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key
- `GITHUB_TOKEN` - GitHub personal access token
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `SOLANA_PRIVATE_KEY` - Solana wallet private key
- `NEXTAUTH_SECRET` - NextAuth secret key

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
pnpm add -g vercel
```

2. Deploy:
```bash
vercel
```

### Google Cloud Deployment

1. Install Google Cloud SDK
2. Configure app.yaml with your settings
3. Deploy:
```bash
gcloud app deploy
```

### Docker Deployment

```bash
docker build -t architex .
docker run -p 3000:3000 architex
```

## API Routes

- `POST /api/ai/generate-code` - Generate code with AI
- `GET /api/github/repos` - Get GitHub repositories
- `POST /api/payment/create` - Create Solana payment
- `GET /api/workflow/save` - Get workflows
- `POST /api/workflow/save` - Save workflow

## Key Features

### AI Code Generation
Use Google Gemini AI to generate code from natural language descriptions.

### Workflow Builder
Visual workflow builder using React Flow for creating and managing architecture diagrams.

### GitHub Integration
Seamlessly integrate with GitHub to manage repositories and deploy code.

### Solana Payments
Built-in support for cryptocurrency payments using Solana blockchain.

### Membership System
Meta Ads-style membership management with different tiers (free, pro, enterprise).

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
```

## Contributing

Contributions are welcome. Please submit a Pull Request.

## License

MIT License

---

Built with Next.js, React, Python, and TypeScript
