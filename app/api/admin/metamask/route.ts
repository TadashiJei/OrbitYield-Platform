import { NextRequest, NextResponse } from 'next/server';
import { connections, MetaMaskConnection } from '../../metamask/connections';

// In a real application, this would require admin authentication

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    // Filter connections based on status if provided
    let filteredConnections = [...connections];
    
    if (status) {
      filteredConnections = connections.filter(
        conn => conn.removalRequest.status === status
      );
    }
    
    return NextResponse.json({ connections: filteredConnections });
  } catch (error) {
    console.error('Error getting admin MetaMask connections:', error);
    return NextResponse.json(
      { error: 'Failed to get connections' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { walletAddress, action } = data;
    
    if (!walletAddress || !action) {
      return NextResponse.json(
        { error: 'Wallet address and action are required' },
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
    
    // Update connection based on action
    if (action === 'approve') {
      connections[connectionIndex].removalRequest.status = 'approved';
      
      // In a real app, this would trigger removal of the connection
      // and notify the user that their request was approved
      
      // For demo purposes, we'll keep the connection in the array
      // In a production app, we might actually delete it or mark it as removed
    } else if (action === 'reject') {
      connections[connectionIndex].removalRequest.status = 'rejected';
      
      // In a real app, notify the user that their request was rejected
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: `Removal request ${action}d successfully`,
      connection: connections[connectionIndex]
    });
  } catch (error) {
    console.error('Error updating MetaMask connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}
