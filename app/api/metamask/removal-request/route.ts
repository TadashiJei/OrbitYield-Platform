import { NextRequest, NextResponse } from 'next/server';

// Referencing the connections from the shared module
// In a real app, this would be stored in a database
import { connections, MetaMaskConnection } from '../../metamask/connections';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { walletAddress, reason, email } = data;
    
    if (!walletAddress || !email) {
      return NextResponse.json(
        { error: 'Wallet address and email are required' },
        { status: 400 }
      );
    }
    
    // Find the connection
    const connectionIndex = connections.findIndex(
      (conn: MetaMaskConnection) => conn.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (connectionIndex === -1) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Update the connection with removal request
    connections[connectionIndex].removalRequest = {
      status: 'pending',
      reason: reason || 'No reason provided',
      email,
      requestedAt: new Date()
    };
    
    // In a real app, send email notifications here
    // sendEmailToAdmin(connections[connectionIndex]);
    // sendEmailToUser(email, walletAddress);
    
    return NextResponse.json(
      { 
        message: 'Removal request submitted successfully',
        connection: connections[connectionIndex]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting removal request:', error);
    return NextResponse.json(
      { error: 'Failed to submit removal request' },
      { status: 500 }
    );
  }
}
