# Getting Started Checklist

Use this checklist to set up Architex for the first time.

## Prerequisites ✓

- [ ] Node.js 20+ installed
- [ ] pnpm 10.28.0+ installed (`npm install -g pnpm`)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Setup Steps

### 1. Clone & Install

- [ ] Clone the repository
  ```bash
  git clone https://github.com/Dawgsrlife/Architex.git
  cd Architex
  ```

- [ ] Install dependencies
  ```bash
  pnpm install
  ```

### 2. Environment Setup

- [ ] Copy environment template
  ```bash
  cp .env.example .env.local
  ```

- [ ] Create MongoDB Atlas account (free tier)
  - [ ] Visit https://www.mongodb.com/cloud/atlas
  - [ ] Create cluster
  - [ ] Get connection string
  - [ ] Add to `MONGODB_URI` in `.env.local`

- [ ] Get Google Gemini API key (required)
  - [ ] Visit https://makersuite.google.com/app/apikey
  - [ ] Create API key
  - [ ] Add to `GOOGLE_GEMINI_API_KEY` in `.env.local`

- [ ] Get GitHub token (required)
  - [ ] Visit https://github.com/settings/tokens
  - [ ] Generate token with `repo` and `read:user` scopes
  - [ ] Add to `GITHUB_TOKEN` in `.env.local`

- [ ] Get ElevenLabs API key (optional)
  - [ ] Visit https://elevenlabs.io/
  - [ ] Create account and get API key
  - [ ] Add to `ELEVENLABS_API_KEY` in `.env.local`

- [ ] Setup Solana (optional)
  - [ ] Get RPC URL from Alchemy or QuickNode
  - [ ] Add to `SOLANA_RPC_URL` in `.env.local`
  - [ ] Add private key to `SOLANA_PRIVATE_KEY` in `.env.local`

### 3. First Run

- [ ] Start development server
  ```bash
  pnpm dev
  ```

- [ ] Open http://localhost:3000 in browser

- [ ] Verify home page loads

### 4. Test Features

- [ ] Navigate to `/workflow`
  - [ ] Verify React Flow loads
  - [ ] Try dragging nodes
  - [ ] Check connections work

- [ ] Navigate to `/dashboard`
  - [ ] Verify UI components render
  - [ ] Check cards display

- [ ] Test API endpoints
  ```bash
  # Test AI code generation
  curl -X POST http://localhost:3000/api/ai/generate-code \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Create a React button", "language": "typescript"}'
  
  # Test GitHub repos
  curl http://localhost:3000/api/github/repos
  ```

### 5. Customization (Optional)

- [ ] Update app metadata in `src/app/layout.tsx`
- [ ] Customize theme in `tailwind.config.ts`
- [ ] Modify home page in `src/app/page.tsx`
- [ ] Add your own pages in `src/app/`

### 6. Build Verification

- [ ] Run type check
  ```bash
  pnpm type-check
  ```

- [ ] Run linter
  ```bash
  pnpm lint
  ```

- [ ] Build for production
  ```bash
  pnpm build
  ```

- [ ] Test production build
  ```bash
  pnpm start
  ```

### 7. Version Control

- [ ] Create your own branch
  ```bash
  git checkout -b feature/my-feature
  ```

- [ ] Make changes
- [ ] Commit changes
  ```bash
  git add .
  git commit -m "feat: add my feature"
  ```

### 8. Deployment (Choose One)

#### Vercel (Recommended)
- [ ] Install Vercel CLI: `pnpm add -g vercel`
- [ ] Login: `vercel login`
- [ ] Deploy: `vercel`
- [ ] Add environment variables in Vercel dashboard
- [ ] Deploy to production: `vercel --prod`

#### Google Cloud
- [ ] Install Google Cloud SDK
- [ ] Configure project: `gcloud init`
- [ ] Deploy: `gcloud app deploy`

#### Docker
- [ ] Build image: `docker build -t architex .`
- [ ] Run container: `docker run -p 3000:3000 architex`

### 9. Post-Deployment

- [ ] Verify deployment works
- [ ] Test all features in production
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring
- [ ] Configure analytics

## Troubleshooting

### Common Issues

**Port 3000 already in use**
```bash
PORT=3001 pnpm dev
```

**MongoDB connection error**
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Check username/password

**Build errors**
```bash
rm -rf .next node_modules/.cache
pnpm install
pnpm build
```

**TypeScript errors**
```bash
pnpm type-check
```

### Getting Help

- [ ] Check documentation in root directory
- [ ] Read PROJECT_SUMMARY.md
- [ ] Check QUICKSTART.md
- [ ] Search GitHub issues
- [ ] Open new issue with details

## Resources

- [ ] Read README.md
- [ ] Review API.md for API documentation
- [ ] Check FEATURES.md for all features
- [ ] See DEPLOYMENT.md for deployment details
- [ ] Read CONTRIBUTING.md before contributing

## Next Steps

Once everything is working:

1. **Explore the codebase**
   - Look at components in `src/components/`
   - Check integrations in `src/lib/integrations/`
   - Review models in `src/lib/models/`

2. **Add features**
   - Create new pages
   - Add new API routes
   - Implement new integrations

3. **Customize design**
   - Modify Tailwind theme
   - Update components
   - Add animations with GSAP

4. **Deploy to production**
   - Choose deployment platform
   - Configure environment variables
   - Test thoroughly

5. **Monitor and maintain**
   - Set up error tracking
   - Monitor performance
   - Update dependencies regularly

## Completion

- [ ] All required environment variables set
- [ ] Application runs locally
- [ ] All features tested
- [ ] Build succeeds
- [ ] Ready for development/deployment

---

**Congratulations!** 🎉 Your Architex setup is complete!

For questions or issues, please refer to the documentation or open an issue on GitHub.
