import { NextRequest, NextResponse } from 'next/server';
import { connections } from './connections';

// In a production app, this would connect to MongoDB as specified in the requirements
// For this implementation, we're using the in-memory store from connections.ts

export async function GET(request: NextRequest) {
  // In a real implementation, you would:
  // 1. Authenticate the user
  // 2. Query the database for the user's connections
  
  // For now, we'll return all connections (simulating an admin view)
  return NextResponse.json({ connections });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { walletAddress } = data;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Generate a user ID (in real app, this would be the authenticated user's ID)
    const userId = `user_${Math.random().toString(36).substring(2, 11)}`;
    
    // Check if connection already exists
    const existingConnection = connections.find(
      conn => conn.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (existingConnection) {
      return NextResponse.json(
        { message: 'Connection already exists', connection: existingConnection },
        { status: 200 }
      );
    }
    
    // Create new connection
    const newConnection = {
      walletAddress,
      userId,
      connectedAt: new Date(),
      removalRequest: {
        status: null,
        reason: null,
        email: null,
        requestedAt: null
      }
    };
    
    connections.push(newConnection);
    
    return NextResponse.json(
      { message: 'Connection saved successfully', connection: newConnection },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving MetaMask connection:', error);
    return NextResponse.json(
      { error: 'Failed to save connection' },
      { status: 500 }
    );
  }
}
