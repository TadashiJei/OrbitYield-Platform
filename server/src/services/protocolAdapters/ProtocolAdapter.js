/**
 * Protocol Adapter Interface
 * 
 * This abstract class defines the standard interface for all protocol adapters.
 * Specific protocol adapters must extend this class and implement its methods.
 */
class ProtocolAdapter {
  /**
   * Constructor
   * @param {Object} config - Configuration for the adapter
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'BaseAdapter';
    this.supportedChains = [];
  }

  /**
   * Validates if the adapter supports a specific chain
   * @param {string} chainId - Chain ID to validate
   * @returns {boolean} - True if chain is supported, false otherwise
   */
  supportsChain(chainId) {
    return this.supportedChains.includes(chainId);
  }

  /**
   * Gets yield opportunities from the protocol
   * Must be implemented by child classes
   * @param {string} chainId - Chain ID to query
   * @returns {Promise<Array>} - Array of yield opportunities
   */
  async getYieldOpportunities(chainId) {
    throw new Error('Method getYieldOpportunities must be implemented by child class');
  }

  /**
   * Gets APY data for a specific yield opportunity
   * Must be implemented by child classes
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Promise<Object>} - APY data
   */
  async getApyData(opportunity) {
    throw new Error('Method getApyData must be implemented by child class');
  }

  /**
   * Gets TVL (Total Value Locked) for a specific yield opportunity
   * Must be implemented by child classes
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Promise<number>} - TVL in USD
   */
  async getTvl(opportunity) {
    throw new Error('Method getTvl must be implemented by child class');
  }

  /**
   * Deposits assets into a yield opportunity
   * Must be implemented by child classes
   * @param {Object} opportunity - Yield opportunity object
   * @param {Object} params - Deposit parameters
   * @returns {Promise<Object>} - Transaction data
   */
  async deposit(opportunity, params) {
    throw new Error('Method deposit must be implemented by child class');
  }

  /**
   * Withdraws assets from a yield opportunity
   * Must be implemented by child classes
   * @param {Object} investment - Investment object
   * @param {Object} params - Withdrawal parameters
   * @returns {Promise<Object>} - Transaction data
   */
  async withdraw(investment, params) {
    throw new Error('Method withdraw must be implemented by child class');
  }

  /**
   * Harvests yield from an investment
   * Must be implemented by child classes
   * @param {Object} investment - Investment object
   * @returns {Promise<Object>} - Harvest transaction data
   */
  async harvest(investment) {
    throw new Error('Method harvest must be implemented by child class');
  }

  /**
   * Compounds yield from an investment
   * Must be implemented by child classes
   * @param {Object} investment - Investment object
   * @returns {Promise<Object>} - Compound transaction data
   */
  async compound(investment) {
    throw new Error('Method compound must be implemented by child class');
  }

  /**
   * Gets current balance of an investment
   * Must be implemented by child classes
   * @param {Object} investment - Investment object
   * @returns {Promise<Object>} - Balance data (amount as string, amountUsd as number)
   */
  async getBalance(investment) {
    throw new Error('Method getBalance must be implemented by child class');
  }

  /**
   * Gets claimable rewards for an investment
   * Must be implemented by child classes
   * @param {Object} investment - Investment object
   * @returns {Promise<Array>} - Array of reward tokens and amounts
   */
  async getClaimableRewards(investment) {
    throw new Error('Method getClaimableRewards must be implemented by child class');
  }

  /**
   * Validates an investment address
   * @param {Object} opportunity - Yield opportunity object
   * @param {string} address - Address to validate
   * @returns {Promise<boolean>} - True if address is valid for this protocol
   */
  async validateAddress(opportunity, address) {
    throw new Error('Method validateAddress must be implemented by child class');
  }

  /**
   * Gets transaction status
   * @param {string} chainId - Chain ID
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} - Transaction status
   */
  async getTransactionStatus(chainId, txHash) {
    throw new Error('Method getTransactionStatus must be implemented by child class');
  }

  /**
   * Gets gas cost estimate for a transaction
   * @param {string} chainId - Chain ID
   * @param {string} methodName - Contract method name
   * @param {Array} params - Method parameters
   * @returns {Promise<Object>} - Gas estimate data
   */
  async estimateGas(chainId, methodName, params) {
    throw new Error('Method estimateGas must be implemented by child class');
  }
}

module.exports = ProtocolAdapter;
