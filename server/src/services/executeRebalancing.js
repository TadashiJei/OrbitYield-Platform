/**
 * Execute a rebalancing operation
 * @param {string} operationId - Operation ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated operation
 */
async function executeRebalancingOperation(operationId, userId) {
  try {
    // Get operation and verify ownership
    const operation = await this.getOperationById(operationId, userId);
    
    if (operation.status !== 'executing') {
      await operation.updateStatus('executing');
    }
    
    // Get strategy to access execution parameters
    const strategy = await this.getStrategyById(operation.strategy, userId);
    
    logger.info(`Executing rebalancing operation ${operationId}`);
    
    // Send notification if enabled
    if (strategy.notifications.enabled && strategy.notifications.events.started) {
      await notificationService.createNotification({
        user: userId,
        title: 'Rebalancing Started',
        message: `Rebalancing operation for "${strategy.name}" has started.`,
        type: 'rebalance_started',
        importance: 'medium',
        metadata: {
          strategyId: strategy._id,
          operationId: operation._id
        }
      });
      
      // Record notification sent
      await operation.recordNotification('started', ['inApp']);
    }
    
    // Initialize performance tracking
    const startTime = Date.now();
    const performance = {
      portfolioValueBefore: operation.currentAllocation.reduce((sum, item) => sum + (item.amountUsd || 0), 0),
      portfolioValueAfter: 0,
      totalGasCost: 0,
      totalGasCostUsd: 0,
      totalSlippage: 0,
      executionTime: 0,
      successRate: 0,
      estimatedSavings: 0
    };
    
    // Track transaction success/failure
    let successfulTransactions = 0;
    let failedTransactions = 0;
    
    // Execute each transaction
    for (let i = 0; i < operation.transactions.length; i++) {
      const tx = operation.transactions[i];
      
      try {
        // Get protocol adapters as needed
        let sourceAdapter, targetAdapter;
        
        if (tx.fromProtocol) {
          sourceAdapter = await ProtocolAdapterManager.getAdapter(tx.fromProtocol, tx.fromChain);
        }
        
        if (tx.toProtocol) {
          targetAdapter = await ProtocolAdapterManager.getAdapter(tx.toProtocol, tx.toChain);
        }
        
        // Update transaction status to executing
        await operation.updateTransactionStatus(i, 'executing');
        
        // Execute transaction based on type
        let result;
        switch (tx.type) {
          case 'swap':
            // Execute swap using the appropriate adapter
            if (sourceAdapter && sourceAdapter.executeSwap) {
              result = await sourceAdapter.executeSwap({
                fromAsset: tx.fromAsset,
                toAsset: tx.toAsset,
                amount: tx.fromAmount,
                maxSlippage: strategy.executionParams.maxSlippage,
                user: userId
              });
            } else {
              // If no adapter available, simulate the swap for demo purposes
              result = {
                success: true,
                txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
                toAmount: tx.toAmount,
                gas: {
                  gasUsed: '200000',
                  gasPrice: '50000000000',
                  gasCost: '0.01',
                  gasCostUsd: 30
                },
                slippage: 0.002
              };
            }
            break;
            
          case 'deposit':
            // Execute deposit using the appropriate adapter
            if (targetAdapter && targetAdapter.executeDeposit) {
              result = await targetAdapter.executeDeposit({
                asset: tx.toAsset,
                amount: tx.toAmount,
                user: userId
              });
            } else {
              // Simulate deposit for demo purposes
              result = {
                success: true,
                txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
                gas: {
                  gasUsed: '150000',
                  gasPrice: '50000000000',
                  gasCost: '0.0075',
                  gasCostUsd: 22.5
                }
              };
            }
            break;
            
          case 'withdrawal':
            // Execute withdrawal using the appropriate adapter
            if (sourceAdapter && sourceAdapter.executeWithdrawal) {
              result = await sourceAdapter.executeWithdrawal({
                asset: tx.fromAsset,
                amount: tx.fromAmount,
                user: userId
              });
            } else {
              // Simulate withdrawal for demo purposes
              result = {
                success: true,
                txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
                gas: {
                  gasUsed: '150000',
                  gasPrice: '50000000000',
                  gasCost: '0.0075',
                  gasCostUsd: 22.5
                }
              };
            }
            break;
            
          default:
            throw new Error(`Unsupported transaction type: ${tx.type}`);
        }
        
        // Update transaction with result
        if (result.success) {
          // Update gas and performance metrics
          performance.totalGasCost += parseFloat(result.gas.gasCost || 0);
          performance.totalGasCostUsd += result.gas.gasCostUsd || 0;
          
          if (result.slippage) {
            performance.totalSlippage += result.slippage;
          }
          
          // Mark transaction as completed
          await operation.updateTransactionStatus(i, 'completed', {
            txHash: result.txHash,
            gas: result.gas,
            slippage: {
              expected: tx.slippage?.expected || 0,
              actual: result.slippage || 0
            }
          });
          
          successfulTransactions++;
        } else {
          // Handle failure
          await operation.updateTransactionStatus(i, 'failed', {
            error: {
              code: result.errorCode || 'EXECUTION_FAILED',
              message: result.errorMessage || 'Transaction execution failed'
            }
          });
          
          failedTransactions++;
        }
      } catch (error) {
        logger.error(`Error executing transaction ${i}: ${error.message}`);
        
        // Mark transaction as failed
        await operation.updateTransactionStatus(i, 'failed', {
          error: {
            code: 'EXECUTION_ERROR',
            message: error.message
          }
        });
        
        failedTransactions++;
      }
    }
    
    // Calculate final performance metrics
    performance.executionTime = (Date.now() - startTime) / 1000; // in seconds
    performance.successRate = operation.transactions.length > 0 
      ? (successfulTransactions / operation.transactions.length) * 100
      : 0;
    
    // Calculate achieved allocation (this would require actual balance queries in production)
    const achievedAllocation = operation.targetAllocation.map(target => ({
      ...target,
      percentage: target.percentage, // In a real system, this would be calculated from actual balances
      amountUsd: target.amountUsd // In a real system, this would be calculated from actual balances
    }));
    
    performance.portfolioValueAfter = achievedAllocation.reduce((sum, item) => sum + (item.amountUsd || 0), 0);
    
    // Determine final operation status
    let finalStatus;
    if (failedTransactions === 0) {
      finalStatus = 'completed';
    } else if (successfulTransactions === 0) {
      finalStatus = 'failed';
    } else {
      finalStatus = 'partial';
    }
    
    // Update operation with final status and performance metrics
    await operation.updateStatus(finalStatus, {
      performance,
      achievedAllocation
    });
    
    // Send notification if enabled
    if (strategy.notifications.enabled && strategy.notifications.events.completed) {
      await notificationService.createNotification({
        user: userId,
        title: `Rebalancing ${finalStatus === 'completed' ? 'Completed' : finalStatus === 'partial' ? 'Partially Completed' : 'Failed'}`,
        message: `Rebalancing operation for "${strategy.name}" has ${finalStatus === 'completed' ? 'been completed' : finalStatus === 'partial' ? 'been partially completed' : 'failed'}.`,
        type: `rebalance_${finalStatus}`,
        importance: finalStatus === 'failed' ? 'high' : 'medium',
        metadata: {
          strategyId: strategy._id,
          operationId: operation._id,
          successRate: performance.successRate
        }
      });
      
      // Record notification sent
      await operation.recordNotification(finalStatus, ['inApp']);
    }
    
    // Record this rebalance completion in the strategy
    await strategy.recordRebalance(finalStatus, {
      operationId: operation._id,
      performance
    });
    
    // Create transaction records for accounting purposes
    if (successfulTransactions > 0) {
      const successfulTxs = operation.transactions.filter(tx => tx.status === 'completed');
      
      for (const tx of successfulTxs) {
        await Transaction.create({
          user: userId,
          type: 'rebalance',
          subType: tx.type,
          status: 'completed',
          amount: tx.fromAmount,
          amountUsd: tx.fromAmountUsd,
          asset: tx.fromAsset,
          toAmount: tx.toAmount,
          toAmountUsd: tx.toAmountUsd,
          toAsset: tx.toAsset,
          txHash: tx.txHash,
          chainId: tx.fromChain,
          protocol: tx.fromProtocol,
          toProtocol: tx.toProtocol,
          metadata: {
            operationId: operation._id,
            strategyId: strategy._id,
            rebalanceType: strategy.type,
            gas: tx.gas,
            slippage: tx.slippage
          },
          createdAt: new Date()
        });
      }
    }
    
    logger.info(`Completed rebalancing operation ${operationId} with status ${finalStatus}`);
    
    return operation;
  } catch (error) {
    logger.error(`Error executing rebalancing operation: ${error.message}`);
    throw error;
  }
}
