# Features Documentation

## Overview

Architex is a comprehensive full-stack application that combines AI-powered code generation with visual workflow management, blockchain payments, and enterprise-grade integrations.

## Core Features

### 1. AI Code Generation (Google Gemini)

**Capabilities:**
- Natural language to code conversion
- Multiple programming language support
- Context-aware code generation
- Architecture suggestions
- Code improvement recommendations

**Usage:**
```typescript
import { generateCode } from '@/lib/integrations/gemini';

const result = await generateCode({
  prompt: 'Create a user authentication system',
  context: 'Using Next.js and MongoDB',
  language: 'typescript'
});
```

**API Endpoint:**
- `POST /api/ai/generate-code`

### 2. Visual Workflow Builder (React Flow)

**Capabilities:**
- Drag-and-drop node-based interface
- Custom node types
- Real-time workflow editing
- Minimap and controls
- Save/load workflows

**Components:**
- Interactive canvas
- Node connections
- Background grid
- Zoom controls
- Export functionality

**Location:** `/workflow`

### 3. GitHub Integration

**Capabilities:**
- Repository management
- File creation and updates
- Content retrieval
- Repository listing
- Authenticated API access

**Functions:**
```typescript
import { getUserRepos, createRepo, createOrUpdateFile } from '@/lib/integrations/github';

// List repositories
const repos = await getUserRepos();

// Create new repository
await createRepo('my-project', 'Project description');

// Create/update file
await createOrUpdateFile('owner', 'repo', 'path/file.ts', 'content', 'commit message');
```

### 4. Solana Blockchain Integration

**Capabilities:**
- Cryptocurrency payments
- Transaction logging
- Wallet balance checking
- Transaction history
- Address validation

**Functions:**
```typescript
import { createPayment, getBalance, validateSolanaAddress } from '@/lib/integrations/solana';

// Create payment
const result = await createPayment({
  amount: 0.1,
  recipientAddress: 'SolanaAddress...',
  memo: 'Payment description'
});

// Check balance
const balance = await getBalance('SolanaAddress...');
```

### 5. Text-to-Speech (ElevenLabs)

**Capabilities:**
- High-quality voice synthesis
- Multiple voice options
- Custom voice selection
- Voice-to-architecture features (planned)

**Functions:**
```typescript
import { textToSpeech, getVoices } from '@/lib/integrations/elevenlabs';

// Convert text to speech
const audioBuffer = await textToSpeech({
  text: 'Hello, welcome to Architex',
  voiceId: '21m00Tcm4TlvDq8ikWAM'
});

// Get available voices
const voices = await getVoices();
```

### 6. Database Management (MongoDB + Mongoose)

**Models:**

#### User Model
```typescript
{
  email: string;
  name: string;
  role: 'free' | 'pro' | 'enterprise';
  membershipExpiry?: Date;
  solanaWallet?: string;
  credits: number;
}
```

#### Project Model
```typescript
{
  name: string;
  description: string;
  userId: string;
  repository?: string;
  status: 'active' | 'archived' | 'draft';
  workflows: ObjectId[];
}
```

#### Workflow Model
```typescript
{
  name: string;
  description: string;
  projectId: ObjectId;
  nodes: any[];
  edges: any[];
  aiGeneratedCode?: string;
  status: 'draft' | 'active' | 'completed';
}
```

### 7. State Management (Zustand)

**App Store:**
```typescript
import { useAppStore } from '@/stores/appStore';

function MyComponent() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const currentProject = useAppStore((state) => state.currentProject);
  const theme = useAppStore((state) => state.theme);
}
```

**Features:**
- User management
- Project selection
- Theme management
- Credit tracking
- Persistent storage

### 8. Data Fetching (TanStack Query)

**Configuration:**
- Automatic caching
- Background refetching
- Stale time: 60 seconds
- Window focus refetch disabled

**Usage:**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['repos'],
  queryFn: () => fetch('/api/github/repos').then(r => r.json())
});
```

### 9. Form Handling (React Hook Form + Zod)

**Features:**
- Type-safe form validation
- Schema-based validation
- Error handling
- Field-level validation

**Example:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

### 10. UI Components (Shadcn/ui)

**Available Components:**
- Button
- Dialog
- Dropdown Menu
- Tabs
- Toast/Sonner
- Select
- Checkbox
- Avatar
- Alert Dialog
- Label
- Separator

**Theming:**
- Light/Dark mode support
- Custom color schemes
- CSS variables
- Tailwind integration

### 11. Animations (GSAP)

**Capabilities:**
- Smooth transitions
- Complex animations
- Timeline control
- ScrollTrigger integration
- Performance optimized

**Usage:**
```typescript
import gsap from 'gsap';

gsap.to('.element', {
  x: 100,
  duration: 1,
  ease: 'power2.out'
});
```

## Advanced Features

### Membership System

**Tiers:**
- **Free**: 100 credits, basic features
- **Pro**: Unlimited credits, advanced features
- **Enterprise**: Custom solutions, priority support

**Credit System:**
- AI code generation: 1 credit
- Workflow save: 1 credit
- TTS conversion: 2 credits

### Background Jobs

**Infrastructure:**
- Redis-based queue (when configured)
- Async job processing
- Job status tracking
- Retry mechanisms

### Security Features

**Best Practices:**
- Environment variable protection
- API key encryption
- Secure database connections
- HTTPS enforcement
- Input validation
- XSS protection

### Performance Optimizations

**Next.js Features:**
- Turbopack for faster builds
- Image optimization
- Route prefetching
- Static generation
- Server-side rendering
- Edge runtime support

**TailwindCSS 4:**
- JIT compilation
- Minimal CSS output
- PostCSS optimization
- Custom utilities

## Deployment Features

**Vercel:**
- One-click deployment
- Automatic HTTPS
- Edge network
- Analytics integration
- Environment management

**Google Cloud:**
- App Engine support
- Auto-scaling
- Load balancing
- Cloud monitoring
- Stackdriver logging

**Docker:**
- Multi-stage builds
- Optimized image size
- Production-ready
- Environment flexibility

## API Features

**RESTful Endpoints:**
- `/api/ai/generate-code` - AI code generation
- `/api/github/repos` - GitHub integration
- `/api/payment/create` - Solana payments
- `/api/workflow/save` - Workflow management

**Response Format:**
- JSON responses
- Standard HTTP codes
- Error messages
- Consistent structure

## Developer Experience

**TypeScript:**
- Full type safety
- IntelliSense support
- Compile-time checks
- Type inference

**Development Tools:**
- Hot module replacement
- Fast refresh
- Error overlay
- Source maps
- Dev server (Turbopack)

**Code Quality:**
- ESLint configuration
- TypeScript strict mode
- Prettier (recommended)
- Git hooks (recommended)

## Future Features (Roadmap)

- [ ] Authentication system (NextAuth)
- [ ] Real-time collaboration
- [ ] Code versioning
- [ ] Team management
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Custom AI model training
- [ ] Advanced workflow templates
- [ ] Integration marketplace
- [ ] Multi-language support

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Mobile Support

- Responsive design
- Touch-friendly interface
- Mobile-optimized workflows
- Progressive Web App (PWA) ready

## Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators

## Monitoring & Analytics

**Supported Platforms:**
- Vercel Analytics
- Google Analytics (integration ready)
- Sentry (error tracking ready)
- LogRocket (session replay ready)

## Documentation

- API documentation (API.md)
- Deployment guide (DEPLOYMENT.md)
- Contributing guidelines (CONTRIBUTING.md)
- Quick start guide (QUICKSTART.md)
- This features document

## Support

For feature requests or issues:
1. Check existing documentation
2. Search GitHub issues
3. Open a new issue with detailed description
4. Contribute via pull request

---

Last updated: January 2024
Version: 0.1.0
