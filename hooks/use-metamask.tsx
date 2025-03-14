"use client";

import { useState, useEffect, useCallback } from 'react';

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  error: Error | null;
  isLoading: boolean;
  isMetaMaskInstalled: boolean;
}

export const useMetaMask = () => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    chainId: null,
    error: null,
    isLoading: true,
    isMetaMaskInstalled: false,
  });

  const saveConnection = useCallback(async (address: string) => {
    try {
      const response = await fetch('/api/metamask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save MetaMask connection');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error saving MetaMask connection:", error);
      throw error;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: new Error('MetaMask is not installed'),
        isLoading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      
      if (accounts && accounts.length > 0) {
        // Save connection to backend
        await saveConnection(accounts[0]);
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          account: accounts[0],
          chainId,
          isLoading: false,
          error: null
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
      console.error('Error connecting to MetaMask:', error);
    }
  }, [saveConnection]);

  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      account: null
    }));
    // Note: MetaMask doesn't have a disconnect method
    // The user must disconnect through the MetaMask extension
  }, []);

  const checkConnection = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        isMetaMaskInstalled: false,
        isLoading: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isMetaMaskInstalled: true
    }));

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts && accounts.length > 0) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          account: accounts[0],
          chainId,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      console.error('Error checking MetaMask connection:', error);
    }
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setState(prev => ({
        ...prev,
        isConnected: false,
        account: null
      }));
    } else {
      // Account changed
      setState(prev => ({
        ...prev,
        account: accounts[0]
      }));
      
      // Save the new connection
      saveConnection(accounts[0]).catch(console.error);
    }
  }, [saveConnection]);

  const handleChainChanged = useCallback((chainId: string) => {
    setState(prev => ({
      ...prev,
      chainId
    }));
    
    // Recommended by MetaMask: reload the page when chain changes
    window.location.reload();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const { ethereum } = window as Window;
    
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      
      // Initial check for existing connection
      checkConnection();
      
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    } else {
      setState(prev => ({
        ...prev,
        isMetaMaskInstalled: false,
        isLoading: false
      }));
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
    ...state,
    connect,
    disconnect,
    checkConnection
  };
};
