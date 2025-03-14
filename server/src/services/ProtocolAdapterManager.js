const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const ProtocolAdapter = require('./protocolAdapters/ProtocolAdapter');
const Protocol = require('../models/Protocol');

/**
 * Protocol Adapter Manager
 * 
 * Manages loading and providing access to protocol adapters
 */
class ProtocolAdapterManager {
  constructor() {
    this.adapters = new Map();
    this.adapterInstances = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the adapter manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing Protocol Adapter Manager');
      await this.loadAdapters();
      this.initialized = true;
      logger.info(`Protocol Adapter Manager initialized with ${this.adapters.size} adapters`);
    } catch (error) {
      logger.error(`Error initializing Protocol Adapter Manager: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load adapter modules from the protocolAdapters directory
   * @returns {Promise<void>}
   */
  async loadAdapters() {
    try {
      const adapterDir = path.join(__dirname, 'protocolAdapters');
      
      // Check if directory exists
      if (!fs.existsSync(adapterDir)) {
        logger.warn(`Adapter directory ${adapterDir} does not exist`);
        return;
      }
      
      // Get all files in adapter directory
      const files = fs.readdirSync(adapterDir);
      
      // Filter for JS files that aren't the base adapter
      const adapterFiles = files.filter(file => {
        return file.endsWith('.js') && file !== 'ProtocolAdapter.js';
      });
      
      // Load each adapter module
      for (const file of adapterFiles) {
        try {
          const adapterPath = path.join(adapterDir, file);
          const AdapterClass = require(adapterPath);
          
          // Validate that it's a proper adapter class
          if (typeof AdapterClass === 'function' && 
              AdapterClass.prototype instanceof ProtocolAdapter) {
            
            // Create a temporary instance to get the adapter name
            const tempInstance = new AdapterClass();
            const adapterName = tempInstance.name;
            
            // Store the adapter class (not instance)
            this.adapters.set(adapterName, AdapterClass);
            logger.info(`Loaded protocol adapter: ${adapterName}`);
          } else {
            logger.warn(`File ${file} does not export a valid Protocol Adapter class`);
          }
        } catch (err) {
          logger.error(`Error loading adapter ${file}: ${err.message}`);
        }
      }
    } catch (error) {
      logger.error(`Error loading protocol adapters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get an adapter instance for a protocol
   * @param {Object} protocol - Protocol object from database
   * @returns {ProtocolAdapter} - Protocol adapter instance
   */
  getAdapterForProtocol(protocol) {
    if (!this.initialized) {
      throw new Error('Protocol Adapter Manager not initialized');
    }

    try {
      const adapterName = protocol.implementationDetails.adapter;
      
      // Check if we already have an instance for this protocol
      const instanceKey = `${adapterName}-${protocol._id}`;
      if (this.adapterInstances.has(instanceKey)) {
        return this.adapterInstances.get(instanceKey);
      }
      
      // Get the adapter class
      const AdapterClass = this.adapters.get(adapterName);
      if (!AdapterClass) {
        throw new Error(`Adapter not found for protocol ${protocol.name}: ${adapterName}`);
      }
      
      // Create a new instance with the protocol's config
      const adapter = new AdapterClass(protocol.implementationDetails.config);
      
      // Cache the instance
      this.adapterInstances.set(instanceKey, adapter);
      
      return adapter;
    } catch (error) {
      logger.error(`Error getting adapter for protocol ${protocol.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get an adapter by name
   * @param {string} adapterName - Name of the adapter
   * @param {Object} config - Configuration for the adapter
   * @returns {ProtocolAdapter} - Protocol adapter instance
   */
  getAdapterByName(adapterName, config = {}) {
    if (!this.initialized) {
      throw new Error('Protocol Adapter Manager not initialized');
    }

    try {
      // Get the adapter class
      const AdapterClass = this.adapters.get(adapterName);
      if (!AdapterClass) {
        throw new Error(`Adapter not found: ${adapterName}`);
      }
      
      // Create a new instance with the provided config
      return new AdapterClass(config);
    } catch (error) {
      logger.error(`Error getting adapter by name ${adapterName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all available adapter names
   * @returns {Array<string>} - Array of adapter names
   */
  getAvailableAdapters() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if an adapter is available
   * @param {string} adapterName - Name of the adapter
   * @returns {boolean} - True if adapter is available
   */
  hasAdapter(adapterName) {
    return this.adapters.has(adapterName);
  }

  /**
   * Get adapters that support a specific chain
   * @param {string} chainId - Chain ID
   * @returns {Promise<Array>} - Array of adapters that support the chain
   */
  async getAdaptersForChain(chainId) {
    if (!this.initialized) {
      throw new Error('Protocol Adapter Manager not initialized');
    }

    try {
      const supportedAdapters = [];
      
      for (const [adapterName, AdapterClass] of this.adapters.entries()) {
        const adapter = new AdapterClass();
        if (adapter.supportsChain(chainId)) {
          supportedAdapters.push(adapterName);
        }
      }
      
      return supportedAdapters;
    } catch (error) {
      logger.error(`Error getting adapters for chain ${chainId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get protocols for a specific chain
   * @param {string} chainId - Chain ID
   * @returns {Promise<Array>} - Array of protocols for the chain
   */
  async getProtocolsForChain(chainId) {
    try {
      return await Protocol.findByChainId(chainId);
    } catch (error) {
      logger.error(`Error getting protocols for chain ${chainId}: ${error.message}`);
      throw error;
    }
  }
}

// Create and export a singleton instance
const adapterManager = new ProtocolAdapterManager();
module.exports = adapterManager;
