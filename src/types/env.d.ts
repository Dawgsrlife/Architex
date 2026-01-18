declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      GOOGLE_GEMINI_API_KEY: string;
      GITHUB_TOKEN: string;
      GITHUB_OWNER: string;
      ELEVENLABS_API_KEY: string;
      SOLANA_RPC_URL: string;
      SOLANA_PRIVATE_KEY: string;
      SOLANA_PAYMENT_ADDRESS: string;
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_APP_NAME: string;
      REDIS_URL: string;
    }
  }

  var mongoose: {
    conn: typeof import("mongoose") | null;
    promise: Promise<typeof import("mongoose")> | null;
  };
}

export {};
