export interface ComponentDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  components: ComponentDefinition[];
}

const logo = (name: string) =>
  `https://cdn.simpleicons.org/${name}`;

export const COMPONENT_LIBRARY: ComponentCategory[] = [
  {
    id: "backend",
    name: "Backend",
    icon: "server",
    components: [
      { id: "fastapi", name: "FastAPI", icon: logo("fastapi"), color: "#009688" },
      { id: "express", name: "Express", icon: logo("express"), color: "#000000" },
      { id: "nodejs", name: "Node.js", icon: logo("nodedotjs"), color: "#339933" },
      { id: "django", name: "Django", icon: logo("django"), color: "#092e20" },
      { id: "flask", name: "Flask", icon: logo("flask"), color: "#000000" },
      { id: "spring", name: "Spring Boot", icon: logo("spring"), color: "#6db33f" },
      { id: "nestjs", name: "NestJS", icon: logo("nestjs"), color: "#e0234e" },
      { id: "go", name: "Go/Gin", icon: logo("go"), color: "#00add8" },
      { id: "rails", name: "Ruby on Rails", icon: logo("rubyonrails"), color: "#cc0000" },
      { id: "laravel", name: "Laravel", icon: logo("laravel"), color: "#ff2d20" },
    ],
  },
  {
    id: "frontend",
    name: "Frontend",
    icon: "palette",
    components: [
      { id: "react", name: "React", icon: logo("react"), color: "#61dafb" },
      { id: "nextjs", name: "Next.js", icon: logo("nextdotjs"), color: "#000000" },
      { id: "vue", name: "Vue", icon: logo("vuedotjs"), color: "#42b883" },
      { id: "svelte", name: "Svelte", icon: logo("svelte"), color: "#ff3e00" },
      { id: "angular", name: "Angular", icon: logo("angular"), color: "#dd0031" },
      { id: "solid", name: "Solid.js", icon: logo("solid"), color: "#2c4f7c" },
      { id: "astro", name: "Astro", icon: logo("astro"), color: "#ff5d01" },
      { id: "remix", name: "Remix", icon: logo("remix"), color: "#000000" },
      { id: "nuxt", name: "Nuxt", icon: logo("nuxtdotjs"), color: "#00dc82" },
    ],
  },
  {
    id: "database",
    name: "Database",
    icon: "database",
    components: [
      { id: "postgresql", name: "PostgreSQL", icon: logo("postgresql"), color: "#336791" },
      { id: "mysql", name: "MySQL", icon: logo("mysql"), color: "#4479a1" },
      { id: "mongodb", name: "MongoDB", icon: logo("mongodb"), color: "#47a248" },
      { id: "supabase", name: "Supabase", icon: logo("supabase"), color: "#3ecf8e" },
      { id: "firebase", name: "Firebase", icon: logo("firebase"), color: "#ffca28" },
      { id: "redis", name: "Redis", icon: logo("redis"), color: "#dc382d" },
      { id: "dynamodb", name: "DynamoDB", icon: logo("amazondynamodb"), color: "#4053d6" },
      { id: "planetscale", name: "PlanetScale", icon: logo("planetscale"), color: "#000000" },
      { id: "sqlite", name: "SQLite", icon: logo("sqlite"), color: "#003b57" },
      { id: "cockroachdb", name: "CockroachDB", icon: logo("cockroachlabs"), color: "#6933ff" },
    ],
  },
  {
    id: "hosting",
    name: "Hosting",
    icon: "cloud",
    components: [
      { id: "vercel", name: "Vercel", icon: logo("vercel"), color: "#000000" },
      { id: "netlify", name: "Netlify", icon: logo("netlify"), color: "#00c7b7" },
      { id: "aws-ec2", name: "AWS EC2", icon: logo("amazonec2"), color: "#ff9900" },
      { id: "gcp", name: "Google Cloud", icon: logo("googlecloud"), color: "#4285f4" },
      { id: "azure", name: "Azure", icon: logo("microsoftazure"), color: "#0078d4" },
      { id: "railway", name: "Railway", icon: logo("railway"), color: "#0b0d0e" },
      { id: "render", name: "Render", icon: logo("render"), color: "#46e3b7" },
      { id: "digitalocean", name: "DigitalOcean", icon: logo("digitalocean"), color: "#0080ff" },
      { id: "fly", name: "Fly.io", icon: logo("flydotio"), color: "#7b3fe4" },
      { id: "cloudflare", name: "Cloudflare", icon: logo("cloudflare"), color: "#f38020" },
    ],
  },
  {
    id: "ml",
    name: "ML/AI",
    icon: "brain",
    components: [
      { id: "openai", name: "OpenAI", icon: logo("openai"), color: "#10a37f" },
      { id: "anthropic", name: "Anthropic", icon: logo("anthropic"), color: "#d4a574" },
      { id: "huggingface", name: "Hugging Face", icon: logo("huggingface"), color: "#ffcc00" },
      { id: "tensorflow", name: "TensorFlow", icon: logo("tensorflow"), color: "#ff6f00" },
      { id: "pytorch", name: "PyTorch", icon: logo("pytorch"), color: "#ee4c2c" },
      { id: "langchain", name: "LangChain", icon: logo("langchain"), color: "#1c3c3c" },
      { id: "replicate", name: "Replicate", icon: logo("replicate"), color: "#000000" },
      { id: "together", name: "Together AI", icon: logo("togetherai"), color: "#0066ff" },
    ],
  },
  {
    id: "auth",
    name: "Authentication",
    icon: "lock",
    components: [
      { id: "auth0", name: "Auth0", icon: logo("auth0"), color: "#eb5424" },
      { id: "clerk", name: "Clerk", icon: logo("clerk"), color: "#6c47ff" },
      { id: "firebase-auth", name: "Firebase Auth", icon: logo("firebase"), color: "#ffca28" },
      { id: "supabase-auth", name: "Supabase Auth", icon: logo("supabase"), color: "#3ecf8e" },
      { id: "nextauth", name: "NextAuth.js", icon: logo("nextdotjs"), color: "#000000" },
      { id: "cognito", name: "AWS Cognito", icon: logo("amazonaws"), color: "#ff9900" },
      { id: "okta", name: "Okta", icon: logo("okta"), color: "#007dc1" },
      { id: "keycloak", name: "Keycloak", icon: logo("keycloak"), color: "#4d4d4d" },
    ],
  },
  {
    id: "cache",
    name: "Caching",
    icon: "zap",
    components: [
      { id: "redis-cache", name: "Redis Cache", icon: logo("redis"), color: "#dc382d" },
      { id: "memcached", name: "Memcached", icon: logo("memcached"), color: "#51a60e" },
      { id: "cloudflare-cdn", name: "Cloudflare CDN", icon: logo("cloudflare"), color: "#f38020" },
      { id: "cloudfront", name: "CloudFront", icon: logo("amazonaws"), color: "#ff9900" },
      { id: "fastly", name: "Fastly", icon: logo("fastly"), color: "#ff282d" },
    ],
  },
  {
    id: "queue",
    name: "Message Queue",
    icon: "mail",
    components: [
      { id: "rabbitmq", name: "RabbitMQ", icon: logo("rabbitmq"), color: "#ff6600" },
      { id: "kafka", name: "Apache Kafka", icon: logo("apachekafka"), color: "#231f20" },
      { id: "sqs", name: "AWS SQS", icon: logo("amazonsqs"), color: "#ff9900" },
      { id: "redis-pubsub", name: "Redis Pub/Sub", icon: logo("redis"), color: "#dc382d" },
      { id: "pubsub", name: "Google Pub/Sub", icon: logo("googlecloud"), color: "#4285f4" },
      { id: "nats", name: "NATS", icon: logo("nats"), color: "#27aae1" },
    ],
  },
  {
    id: "storage",
    name: "Storage",
    icon: "package",
    components: [
      { id: "s3", name: "AWS S3", icon: logo("amazons3"), color: "#569a31" },
      { id: "gcs", name: "Google Storage", icon: logo("googlecloud"), color: "#4285f4" },
      { id: "azure-blob", name: "Azure Blob", icon: logo("microsoftazure"), color: "#0078d4" },
      { id: "cloudflare-r2", name: "Cloudflare R2", icon: logo("cloudflare"), color: "#f38020" },
      { id: "supabase-storage", name: "Supabase Storage", icon: logo("supabase"), color: "#3ecf8e" },
      { id: "minio", name: "MinIO", icon: logo("minio"), color: "#c72e49" },
    ],
  },
  {
    id: "cicd",
    name: "CI/CD",
    icon: "refresh-cw",
    components: [
      { id: "github-actions", name: "GitHub Actions", icon: logo("githubactions"), color: "#2088ff" },
      { id: "gitlab-ci", name: "GitLab CI", icon: logo("gitlab"), color: "#fc6d26" },
      { id: "circleci", name: "CircleCI", icon: logo("circleci"), color: "#343434" },
      { id: "jenkins", name: "Jenkins", icon: logo("jenkins"), color: "#d24939" },
      { id: "argocd", name: "ArgoCD", icon: logo("argo"), color: "#ef7b4d" },
      { id: "terraform", name: "Terraform", icon: logo("terraform"), color: "#7b42bc" },
    ],
  },
  {
    id: "monitoring",
    name: "Monitoring",
    icon: "activity",
    components: [
      { id: "sentry", name: "Sentry", icon: logo("sentry"), color: "#362d59" },
      { id: "datadog", name: "DataDog", icon: logo("datadog"), color: "#632ca6" },
      { id: "newrelic", name: "New Relic", icon: logo("newrelic"), color: "#008c99" },
      { id: "prometheus", name: "Prometheus", icon: logo("prometheus"), color: "#e6522c" },
      { id: "grafana", name: "Grafana", icon: logo("grafana"), color: "#f46800" },
      { id: "logrocket", name: "LogRocket", icon: logo("logrocket"), color: "#764abc" },
    ],
  },
  {
    id: "search",
    name: "Search",
    icon: "search",
    components: [
      { id: "elasticsearch", name: "Elasticsearch", icon: logo("elasticsearch"), color: "#005571" },
      { id: "algolia", name: "Algolia", icon: logo("algolia"), color: "#5468ff" },
      { id: "meilisearch", name: "Meilisearch", icon: logo("meilisearch"), color: "#ff5caa" },
      { id: "typesense", name: "Typesense", icon: logo("typesense"), color: "#d32f2f" },
      { id: "opensearch", name: "OpenSearch", icon: logo("opensearch"), color: "#005eb8" },
    ],
  },
  {
    id: "payments",
    name: "Payments",
    icon: "credit-card",
    components: [
      { id: "stripe", name: "Stripe", icon: logo("stripe"), color: "#635bff" },
      { id: "paypal", name: "PayPal", icon: logo("paypal"), color: "#003087" },
      { id: "square", name: "Square", icon: logo("square"), color: "#3e4348" },
      { id: "lemonsqueezy", name: "Lemon Squeezy", icon: logo("lemonsqueezy"), color: "#ffc233" },
    ],
  },
  {
    id: "email",
    name: "Email",
    icon: "mail",
    components: [
      { id: "resend", name: "Resend", icon: logo("resend"), color: "#000000" },
      { id: "sendgrid", name: "SendGrid", icon: logo("sendgrid"), color: "#1a82e2" },
      { id: "mailgun", name: "Mailgun", icon: logo("mailgun"), color: "#f06b66" },
      { id: "postmark", name: "Postmark", icon: logo("postmark"), color: "#ffde00" },
      { id: "ses", name: "AWS SES", icon: logo("amazonaws"), color: "#ff9900" },
    ],
  },
];

export function getComponentById(id: string): ComponentDefinition | undefined {
  for (const category of COMPONENT_LIBRARY) {
    const component = category.components.find((c) => c.id === id);
    if (component) return component;
  }
  return undefined;
}

export function getCategoryById(id: string): ComponentCategory | undefined {
  return COMPONENT_LIBRARY.find((cat) => cat.id === id);
}
