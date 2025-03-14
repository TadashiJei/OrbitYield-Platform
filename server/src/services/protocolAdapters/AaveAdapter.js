const axios = require('axios');
const { ethers } = require('ethers');
const ProtocolAdapter = require('./ProtocolAdapter');
const logger = require('../../config/logger');
const apyCalculationService = require('../../utils/apyCalculationService');

// Aave contract ABIs (simplified versions)
const lendingPoolABI = [
  "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
  "function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))"
];

const aTokenABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function UNDERLYING_ASSET_ADDRESS() external view returns (address)"
];

const chainProviders = {
  '1': 'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY', // Ethereum
  '137': 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY', // Polygon
  '43114': 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
  '10': 'https://opt-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY', // Optimism
  '42161': 'https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY' // Arbitrum
};

// Aave lending pool addresses for different chains
const lendingPoolAddresses = {
  '1': '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Ethereum Mainnet v2
  '137': '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf', // Polygon v2
  '43114': '0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C', // Avalanche v2
  '10': '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Optimism v3
  '42161': '0x794a61358D6845594F94dc1DB02A252b5b4814aD' // Arbitrum v3
};

// API endpoints for Aave data
const aaveApiEndpoints = {
  reserves: 'https://aave-api-v2.aave.com/data/reserves',
  userReserves: 'https://aave-api-v2.aave.com/data/user-reserves'
};

/**
 * Aave Protocol Adapter
 * Provides integration with Aave lending protocol
 */
class AaveAdapter extends ProtocolAdapter {
  /**
   * Constructor
   * @param {Object} config - Configuration for the adapter
   */
  constructor(config = {}) {
    super(config);
    this.name = 'AaveAdapter';
    this.supportedChains = ['1', '137', '43114', '10', '42161']; // Ethereum, Polygon, Avalanche, Optimism, Arbitrum
    this.aaveVersion = config.version || 'v2';
  }

  /**
   * Gets a provider for the specified chain
   * @param {string} chainId - Chain ID
   * @returns {ethers.providers.JsonRpcProvider} - Provider for the chain
   * @private
   */
  _getProvider(chainId) {
    if (!this.supportsChain(chainId)) {
      throw new Error(`Chain ${chainId} not supported by Aave adapter`);
    }

    const providerUrl = chainProviders[chainId];
    return new ethers.providers.JsonRpcProvider(providerUrl);
  }

  /**
   * Gets the lending pool contract for a specific chain
   * @param {string} chainId - Chain ID
   * @returns {ethers.Contract} - Lending pool contract
   * @private
   */
  _getLendingPoolContract(chainId) {
    const provider = this._getProvider(chainId);
    const lendingPoolAddress = lendingPoolAddresses[chainId];
    
    return new ethers.Contract(lendingPoolAddress, lendingPoolABI, provider);
  }

  /**
   * Gets an aToken contract instance
   * @param {string} chainId - Chain ID
   * @param {string} aTokenAddress - aToken address
   * @returns {ethers.Contract} - aToken contract
   * @private
   */
  _getATokenContract(chainId, aTokenAddress) {
    const provider = this._getProvider(chainId);
    return new ethers.Contract(aTokenAddress, aTokenABI, provider);
  }

  /**
   * Fetches reserve data from Aave API
   * @param {string} chainId - Chain ID
   * @returns {Promise<Array>} - Array of reserve data
   * @private
   */
  async _fetchReserveData(chainId) {
    try {
      const response = await axios.get(`${aaveApiEndpoints.reserves}?chainId=${chainId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Aave reserve data for chain ${chainId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets yield opportunities from Aave
   * @param {string} chainId - Chain ID to query
   * @returns {Promise<Array>} - Array of yield opportunities
   */
  async getYieldOpportunities(chainId) {
    try {
      if (!this.supportsChain(chainId)) {
        return [];
      }

      const reserveData = await this._fetchReserveData(chainId);
      const lendingPool = this._getLendingPoolContract(chainId);
      
      const opportunities = [];
      
      for (const reserve of reserveData) {
        // Skip reserves that are not active for supply
        if (!reserve.isActive || !reserve.isFrozen) {
          continue;
        }
        
        // Get on-chain data for verification
        const onChainReserveData = await lendingPool.getReserveData(reserve.underlyingAsset);
        
        // Create yield opportunity object
        const opportunity = {
          name: `Aave ${reserve.name} Supply`,
          asset: reserve.underlyingAsset,
          assetName: reserve.name,
          assetSymbol: reserve.symbol,
          assetDecimals: reserve.decimals,
          assetAddress: reserve.underlyingAsset,
          chainId,
          apy: {
            current: parseFloat(reserve.liquidityRate) / 1e25, // Convert from ray (1e27) to percentage
            min7d: 0,
            max7d: 0,
            mean7d: 0
          },
          tvlUsd: parseFloat(reserve.totalLiquidity) * parseFloat(reserve.priceInUsd),
          riskLevel: 'low', // Aave is generally considered low risk
          strategyType: 'lending',
          implementationDetails: {
            contractAddress: lendingPoolAddresses[chainId],
            approvalAddress: lendingPoolAddresses[chainId],
            adapter: this.name,
            methodName: 'deposit',
            withdrawMethodName: 'withdraw',
            aTokenAddress: onChainReserveData.aTokenAddress,
            extraData: {
              version: this.aaveVersion,
              reserveId: reserve.id,
              usageAsCollateralEnabled: reserve.usageAsCollateralEnabled,
              stableBorrowRateEnabled: reserve.stableBorrowRateEnabled,
              variableBorrowRate: reserve.variableBorrowRate,
              stableBorrowRate: reserve.stableBorrowRate
            }
          },
          depositFee: 0, // Aave doesn't charge deposit fees
          withdrawalFee: 0, // Aave doesn't charge withdrawal fees
          harvestable: false, // Interest accrues automatically in aToken balance
          compoundable: true, // Interest automatically compounds
          autocompounding: true,
          tags: ['lending', 'supply', 'aave', this.aaveVersion],
          liquidityProfile: {
            lockTime: 0, // No lock time for Aave deposits
            withdrawalWindow: 'anytime',
            unlockTime: null
          },
          status: 'active'
        };
        
        opportunities.push(opportunity);
      }
      
      return opportunities;
    } catch (error) {
      logger.error(`Error getting Aave yield opportunities for chain ${chainId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets APY data for a specific Aave opportunity
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Promise<Object>} - APY data
   */
  async getApyData(opportunity) {
    try {
      const { chainId, asset } = opportunity;
      
      // Fetch the latest reserve data
      const reserveData = await this._fetchReserveData(chainId);
      const reserveInfo = reserveData.find(r => r.underlyingAsset.toLowerCase() === asset.toLowerCase());
      
      if (!reserveInfo) {
        throw new Error(`Reserve data not found for asset ${asset} on chain ${chainId}`);
      }
      
      // Calculate APY from the liquidity rate
      const currentApy = parseFloat(reserveInfo.liquidityRate) / 1e25; // Convert from ray (1e27) to percentage
      
      // Calculate APY stats based on historical data (if available)
      // In a real implementation, you would fetch historical data from an API or database
      
      return {
        current: currentApy,
        min7d: currentApy * 0.9, // Approximate based on current rate
        max7d: currentApy * 1.1,
        mean7d: currentApy,
        min30d: currentApy * 0.85,
        max30d: currentApy * 1.15,
        mean30d: currentApy
      };
    } catch (error) {
      logger.error(`Error getting Aave APY data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets TVL for a specific Aave opportunity
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Promise<number>} - TVL in USD
   */
  async getTvl(opportunity) {
    try {
      const { chainId, asset } = opportunity;
      
      // Fetch the latest reserve data
      const reserveData = await this._fetchReserveData(chainId);
      const reserveInfo = reserveData.find(r => r.underlyingAsset.toLowerCase() === asset.toLowerCase());
      
      if (!reserveInfo) {
        throw new Error(`Reserve data not found for asset ${asset} on chain ${chainId}`);
      }
      
      // Calculate TVL from totalLiquidity and price
      return parseFloat(reserveInfo.totalLiquidity) * parseFloat(reserveInfo.priceInUsd);
    } catch (error) {
      logger.error(`Error getting Aave TVL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deposits assets into an Aave lending pool
   * @param {Object} opportunity - Yield opportunity object
   * @param {Object} params - Deposit parameters
   * @returns {Promise<Object>} - Transaction data
   */
  async deposit(opportunity, params) {
    try {
      const { chainId, asset, implementationDetails } = opportunity;
      const { amount, userAddress, privateKey, gasPrice, gasLimit } = params;
      
      // Initialize provider and signer
      const provider = this._getProvider(chainId);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Get lending pool contract with signer
      const lendingPool = new ethers.Contract(
        implementationDetails.contractAddress,
        lendingPoolABI,
        wallet
      );
      
      // For ERC20 tokens, we need to approve the lending pool first
      const tokenContract = new ethers.Contract(
        asset,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)"
        ],
        wallet
      );
      
      // Check if approval is needed
      const allowance = await tokenContract.allowance(userAddress, implementationDetails.contractAddress);
      if (allowance.lt(amount)) {
        const approvalTx = await tokenContract.approve(
          implementationDetails.contractAddress,
          ethers.constants.MaxUint256,
          { gasPrice, gasLimit: gasLimit || 100000 }
        );
        await approvalTx.wait();
        logger.info(`Approved Aave lending pool for asset ${opportunity.assetSymbol}`);
      }
      
      // Deposit into the lending pool
      const depositTx = await lendingPool.deposit(
        asset,
        amount,
        userAddress, // onBehalfOf
        0, // referralCode
        { gasPrice, gasLimit: gasLimit || 250000 }
      );
      
      // Wait for transaction to be mined
      const receipt = await depositTx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        aTokenAddress: implementationDetails.aTokenAddress
      };
    } catch (error) {
      logger.error(`Error depositing to Aave: ${error.message}`);
      throw error;
    }
  }

  /**
   * Withdraws assets from an Aave lending pool
   * @param {Object} investment - Investment object
   * @param {Object} params - Withdrawal parameters
   * @returns {Promise<Object>} - Transaction data
   */
  async withdraw(investment, params) {
    try {
      const { opportunity, walletAddress } = investment;
      const { amount, privateKey, gasPrice, gasLimit } = params;
      const { chainId, asset, implementationDetails } = opportunity;
      
      // Initialize provider and signer
      const provider = this._getProvider(chainId);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Get lending pool contract with signer
      const lendingPool = new ethers.Contract(
        implementationDetails.contractAddress,
        lendingPoolABI,
        wallet
      );
      
      // Withdraw from the lending pool
      const withdrawTx = await lendingPool.withdraw(
        asset,
        amount, // Use ethers.constants.MaxUint256 to withdraw all
        walletAddress, // to
        { gasPrice, gasLimit: gasLimit || 250000 }
      );
      
      // Wait for transaction to be mined
      const receipt = await withdrawTx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      logger.error(`Error withdrawing from Aave: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets current balance of an Aave investment
   * @param {Object} investment - Investment object
   * @returns {Promise<Object>} - Balance data
   */
  async getBalance(investment) {
    try {
      const { opportunity, walletAddress } = investment;
      const { chainId, implementationDetails } = opportunity;
      
      // Get aToken contract
      const aTokenContract = this._getATokenContract(chainId, implementationDetails.aTokenAddress);
      
      // Get balance in aTokens
      const balance = await aTokenContract.balanceOf(walletAddress);
      
      // Fetch price data to convert to USD
      const reserveData = await this._fetchReserveData(chainId);
      const reserveInfo = reserveData.find(r => 
        r.aTokenAddress.toLowerCase() === implementationDetails.aTokenAddress.toLowerCase()
      );
      
      if (!reserveInfo) {
        throw new Error(`Reserve info not found for aToken ${implementationDetails.aTokenAddress}`);
      }
      
      // Calculate USD value
      const balanceDecimal = ethers.utils.formatUnits(balance, opportunity.assetDecimals);
      const balanceUsd = parseFloat(balanceDecimal) * parseFloat(reserveInfo.priceInUsd);
      
      return {
        amount: balance.toString(),
        amountFormatted: balanceDecimal,
        amountUsd: balanceUsd
      };
    } catch (error) {
      logger.error(`Error getting Aave investment balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Harvests yield from an Aave investment (not applicable as interest accrues automatically)
   * @param {Object} investment - Investment object
   * @returns {Promise<Object>} - Harvest transaction data
   */
  async harvest(investment) {
    try {
      // For Aave, harvesting is not necessary since interest accrues automatically in the aToken balance
      logger.info(`Harvest not needed for Aave as interest accrues automatically`);
      return {
        status: 'not_applicable',
        message: 'Aave interest accrues automatically in aToken balance, no harvest needed'
      };
    } catch (error) {
      logger.error(`Error in Aave harvest operation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compounds yield for an Aave investment (not applicable as interest compounds automatically)
   * @param {Object} investment - Investment object
   * @returns {Promise<Object>} - Compound transaction data
   */
  async compound(investment) {
    try {
      // For Aave, compounding is not necessary since interest compounds automatically
      logger.info(`Compounding not needed for Aave as interest compounds automatically`);
      return {
        status: 'not_applicable',
        message: 'Aave interest compounds automatically, no manual compounding needed'
      };
    } catch (error) {
      logger.error(`Error in Aave compound operation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets transaction status
   * @param {string} chainId - Chain ID
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} - Transaction status
   */
  async getTransactionStatus(chainId, txHash) {
    try {
      const provider = this._getProvider(chainId);
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        return { status: 'not_found' };
      }
      
      if (!tx.blockNumber) {
        return { status: 'pending' };
      }
      
      const receipt = await provider.getTransactionReceipt(txHash);
      
      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: tx.confirmations
      };
    } catch (error) {
      logger.error(`Error getting transaction status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates an investment address
   * @param {Object} opportunity - Yield opportunity object
   * @param {string} address - Address to validate
   * @returns {Promise<boolean>} - True if address is valid for this protocol
   */
  async validateAddress(opportunity, address) {
    try {
      // Check if address is a valid Ethereum address
      return ethers.utils.isAddress(address);
    } catch (error) {
      logger.error(`Error validating address: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets gas cost estimate for a transaction
   * @param {string} chainId - Chain ID
   * @param {string} methodName - Contract method name
   * @param {Array} params - Method parameters
   * @returns {Promise<Object>} - Gas estimate data
   */
  async estimateGas(chainId, methodName, params) {
    try {
      const provider = this._getProvider(chainId);
      const lendingPool = this._getLendingPoolContract(chainId);
      
      let gasEstimate;
      
      switch (methodName) {
        case 'deposit':
          gasEstimate = await lendingPool.estimateGas.deposit(
            params.asset, 
            params.amount, 
            params.onBehalfOf || params.userAddress, 
            params.referralCode || 0
          );
          break;
        case 'withdraw':
          gasEstimate = await lendingPool.estimateGas.withdraw(
            params.asset,
            params.amount,
            params.to || params.userAddress
          );
          break;
        default:
          throw new Error(`Method ${methodName} not supported for gas estimation`);
      }
      
      // Get current gas price
      const gasPrice = await provider.getGasPrice();
      
      // Calculate cost in ETH
      const costWei = gasEstimate.mul(gasPrice);
      const costEth = ethers.utils.formatEther(costWei);
      
      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        costWei: costWei.toString(),
        costEth
      };
    } catch (error) {
      logger.error(`Error estimating gas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AaveAdapter;
