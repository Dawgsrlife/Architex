# Deployment Guide

This guide covers deploying Architex to various platforms.

## Prerequisites

- All environment variables configured
- MongoDB Atlas database set up
- API keys for Google Gemini, GitHub, ElevenLabs, and Solana

## Vercel Deployment (Recommended)

Vercel is the easiest deployment option for Next.js applications.

### Step 1: Install Vercel CLI

```bash
pnpm add -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Environment Variables

In your Vercel project settings, add all environment variables from `.env.example`:

- `MONGODB_URI`
- `GOOGLE_GEMINI_API_KEY`
- `GITHUB_TOKEN`
- `ELEVENLABS_API_KEY`
- `SOLANA_RPC_URL`
- `SOLANA_PRIVATE_KEY`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

### Step 4: Deploy

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

### Vercel Configuration

The `vercel.json` file is already configured with:
- Build and dev commands
- Environment variable references
- Function memory and timeout settings
- Region configuration

## Google Cloud Platform Deployment

### Prerequisites

- Google Cloud SDK installed
- GCP project created
- Billing enabled

### Step 1: Configure app.yaml

The `app.yaml` file is already configured for App Engine deployment.

### Step 2: Set Environment Variables

```bash
gcloud app deploy --set-env-vars MONGODB_URI="your-uri",GOOGLE_GEMINI_API_KEY="your-key"
```

Or create a `.env.yaml` file:

```yaml
env_variables:
  MONGODB_URI: "your-uri"
  GOOGLE_GEMINI_API_KEY: "your-key"
  # ... other variables
```

### Step 3: Deploy

```bash
gcloud app deploy
```

## Docker Deployment

### Step 1: Build the Image

```bash
docker build -t architex .
```

### Step 2: Run the Container

```bash
docker run -p 3000:3000 \
  -e MONGODB_URI="your-uri" \
  -e GOOGLE_GEMINI_API_KEY="your-key" \
  # ... other environment variables
  architex
```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
```

Run:

```bash
docker-compose up
```

## Environment Variables

### Required Variables

- `MONGODB_URI` - MongoDB connection string
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key
- `GITHUB_TOKEN` - GitHub personal access token

### Optional Variables

- `ELEVENLABS_API_KEY` - For text-to-speech features
- `SOLANA_RPC_URL` - For Solana blockchain integration
- `SOLANA_PRIVATE_KEY` - Solana wallet private key
- `NEXTAUTH_SECRET` - For authentication (generate with `openssl rand -base64 32`)

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test API endpoints
- [ ] Check database connection
- [ ] Test AI code generation
- [ ] Verify GitHub integration
- [ ] Test workflow functionality
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and logging
- [ ] Configure CDN for static assets (optional)

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project settings for:
- Performance monitoring
- Error tracking
- Usage statistics

### Google Cloud Monitoring

For GCP deployments:

```bash
gcloud logging read "resource.type=gae_app" --limit 50
```

## Troubleshooting

### Build Failures

1. Check Node.js version (should be 20+)
2. Verify all dependencies are installed
3. Check for TypeScript errors: `pnpm type-check`
4. Review build logs for specific errors

### Runtime Errors

1. Verify environment variables are set correctly
2. Check database connection
3. Review API key permissions
4. Check application logs

### Performance Issues

1. Enable caching for static assets
2. Optimize images using Next.js Image component
3. Implement database indexing
4. Use CDN for global distribution

## Scaling

### Vercel

Vercel automatically scales. For high traffic:
- Upgrade to Pro plan
- Enable Edge Caching
- Use Incremental Static Regeneration (ISR)

### Google Cloud

Adjust scaling in `app.yaml`:

```yaml
automatic_scaling:
  min_instances: 2
  max_instances: 20
  target_cpu_utilization: 0.65
```

## Security

- Never commit `.env.local` or secrets
- Use environment variables for all sensitive data
- Enable HTTPS (automatic on Vercel/GCP)
- Implement rate limiting for API routes
- Add authentication before production deployment
- Regularly update dependencies

## Support

For deployment issues, consult:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Google Cloud App Engine Docs](https://cloud.google.com/appengine/docs)
