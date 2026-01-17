import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export interface PaymentRequest {
  amount: number; // in SOL
  recipientAddress: string;
  memo?: string;
}

export interface PaymentResult {
  signature: string;
  status: "success" | "failed";
  amount: number;
  timestamp: Date;
}

function getKeyPairFromPrivateKey(): Keypair | null {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    console.error("SOLANA_PRIVATE_KEY not set");
    return null;
  }

  try {
    // Decode base58 private key
    const decoded = Uint8Array.from(
      privateKey.split('').map(c => c.charCodeAt(0))
    );
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    console.error("Error decoding Solana private key:", error);
    return null;
  }
}

export async function createPayment(
  request: PaymentRequest
): Promise<PaymentResult> {
  try {
    const payer = getKeyPairFromPrivateKey();
    if (!payer) {
      throw new Error("Invalid Solana keypair configuration");
    }

    const recipientPubKey = new PublicKey(request.recipientAddress);
    const lamports = request.amount * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipientPubKey,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      payer,
    ]);

    return {
      signature,
      status: "success",
      amount: request.amount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error creating Solana payment:", error);
    return {
      signature: "",
      status: "failed",
      amount: request.amount,
      timestamp: new Date(),
    };
  }
}

export async function getBalance(address: string): Promise<number> {
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error getting Solana balance:", error);
    throw new Error("Failed to get Solana balance");
  }
}

export async function getTransactionHistory(
  address: string,
  limit: number = 10
) {
  try {
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    });

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        return {
          signature: sig.signature,
          timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : null,
          status: sig.err ? "failed" : "success",
        };
      })
    );

    return transactions;
  } catch (error) {
    console.error("Error getting transaction history:", error);
    throw new Error("Failed to get transaction history");
  }
}

export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
