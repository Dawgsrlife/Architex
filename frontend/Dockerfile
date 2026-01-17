FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Run the development server
CMD ["pnpm", "dev"]
