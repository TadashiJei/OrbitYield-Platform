// This file serves as a shared data store for MetaMask connections
// In a real application, this would be replaced with a database connection

export interface MetaMaskConnection {
  walletAddress: string;
  userId: string;
  connectedAt: Date;
  removalRequest: {
    status: 'pending' | 'approved' | 'rejected' | null;
    reason: string | null;
    email: string | null;
    requestedAt: Date | null;
  };
}

// Temporary in-memory store for connections
// This will reset when the server restarts - would use a real DB in production
export const connections: MetaMaskConnection[] = [];
