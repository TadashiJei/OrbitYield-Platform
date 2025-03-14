"use client";

import { useState, useEffect, useCallback } from 'react';
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ApiPromise, WsProvider } from '@polkadot/api';

interface PolkadotIdentity {
  display?: string;
  email?: string;
  web?: string;
  twitter?: string;
  riot?: string;
}

interface PolkadotState {
  isConnected: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  api: ApiPromise | null;
  isApiReady: boolean;
  isLoadingIdentity: boolean;
  identity: PolkadotIdentity | null;
  error: Error | null;
}

const POLKADOT_WS_PROVIDER = 'wss://rpc.polkadot.io';
const APP_NAME = 'OrbitYield';

export const usePolkadot = () => {
  const [state, setState] = useState<PolkadotState>({
    isConnected: false,
    accounts: [],
    selectedAccount: null,
    api: null,
    isApiReady: false,
    isLoadingIdentity: false,
    identity: null,
    error: null
  });

  // Initialize connection to Polkadot API
  const initApi = useCallback(async () => {
    try {
      const provider = new WsProvider(POLKADOT_WS_PROVIDER);
      const api = await ApiPromise.create({ provider });
      
      setState(prev => ({
        ...prev,
        api,
        isApiReady: true
      }));
      
      return api;
    } catch (error) {
      console.error('Error initializing Polkadot API:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error))
      }));
      return null;
    }
  }, []);

  // Connect to Polkadot.js extension
  const connect = useCallback(async () => {
    try {
      const extensions = await web3Enable(APP_NAME);
      
      if (extensions.length === 0) {
        throw new Error('Polkadot.js extension not found. Please install it.');
      }
      
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create an account in the Polkadot.js extension.');
      }
      
      let api = state.api;
      if (!api) {
        api = await initApi();
      }
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        accounts: allAccounts,
        selectedAccount: allAccounts[0],
        api
      }));
      
      // Automatically fetch identity for the first account
      if (allAccounts[0]) {
        fetchIdentity(allAccounts[0].address);
      }
      
      return allAccounts;
    } catch (error) {
      console.error('Error connecting to Polkadot.js extension:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error))
      }));
      return [];
    }
  }, [initApi, state.api]);

  // Select an account
  const selectAccount = useCallback((account: InjectedAccountWithMeta) => {
    setState(prev => ({
      ...prev,
      selectedAccount: account
    }));
    
    fetchIdentity(account.address);
  }, []);

  // Fetch on-chain identity
  const fetchIdentity = useCallback(async (address: string) => {
    if (!state.api || !state.isApiReady) {
      return null;
    }
    
    setState(prev => ({
      ...prev,
      isLoadingIdentity: true,
      identity: null
    }));
    
    try {
      const identityOpt = await state.api.query.identity.identityOf(address);
      
      if (identityOpt.isSome) {
        const identity = identityOpt.unwrap();
        const info = identity.info;
        
        const display = info.display.isRaw ? info.display.asRaw.toUtf8() : '';
        const email = info.email.isRaw ? info.email.asRaw.toUtf8() : '';
        const web = info.web.isRaw ? info.web.asRaw.toUtf8() : '';
        const twitter = info.twitter.isRaw ? info.twitter.asRaw.toUtf8() : '';
        const riot = info.riot.isRaw ? info.riot.asRaw.toUtf8() : '';
        
        const identityInfo = {
          display,
          email,
          web,
          twitter,
          riot
        };
        
        setState(prev => ({
          ...prev,
          identity: identityInfo,
          isLoadingIdentity: false
        }));
        
        return identityInfo;
      } else {
        setState(prev => ({
          ...prev,
          identity: null,
          isLoadingIdentity: false
        }));
        
        return null;
      }
    } catch (error) {
      console.error('Error fetching identity:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoadingIdentity: false
      }));
      
      return null;
    }
  }, [state.api, state.isApiReady]);

  // Sign a message with the selected account
  const signMessage = useCallback(async (message: string) => {
    if (!state.selectedAccount) {
      throw new Error('No account selected');
    }
    
    try {
      const injector = await web3FromSource(state.selectedAccount.meta.source);
      const signRaw = injector?.signer?.signRaw;
      
      if (!signRaw) {
        throw new Error('Signing not supported by this extension');
      }
      
      const { signature } = await signRaw({
        address: state.selectedAccount.address,
        data: message,
        type: 'bytes'
      });
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }, [state.selectedAccount]);

  // Initialize API connection on component mount
  useEffect(() => {
    initApi().catch(console.error);
    
    // Cleanup on unmount
    return () => {
      if (state.api) {
        state.api.disconnect();
      }
    };
  }, [initApi, state.api]);

  return {
    ...state,
    connect,
    selectAccount,
    fetchIdentity,
    signMessage
  };
};
