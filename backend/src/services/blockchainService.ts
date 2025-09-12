import { ethers } from 'ethers';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
}

export interface MedicalRecordHash {
  patientId: string;
  recordId: string;
  hash: string;
  timestamp: number;
  transactionHash: string;
}

/**
 * Blockchain Service for Polygon Amoy Testnet
 * Provides secure, immutable storage for medical record hashes
 * Uses Polygon for low-cost, fast transactions
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.initializeWallet();
  }

  /**
   * Initialize wallet connection if private key is provided
   */
  private initializeWallet(): void {
    try {
      if (config.blockchain.privateKey && config.blockchain.privateKey !== '') {
        this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
        logger.info('Blockchain wallet initialized successfully');
      } else {
        logger.warn('No private key provided - blockchain writes disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize blockchain wallet:', error);
    }
  }

  /**
   * Check blockchain connectivity
   */
  async checkConnection(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      this.isConnected = true;
      logger.info(`Connected to Polygon Amoy (Chain ID: ${network.chainId}, Block: ${blockNumber})`);
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error('Blockchain connection failed:', error);
      return false;
    }
  }

  /**
   * Get current network info
   */
  async getNetworkInfo(): Promise<{
    chainId: bigint;
    name: string;
    blockNumber: number;
    gasPrice: bigint;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = (await this.provider.getFeeData()).gasPrice || BigInt(0);

      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        gasPrice
      };
    } catch (error) {
      logger.error('Failed to get network info:', error);
      throw new Error('Unable to fetch network information');
    }
  }

  /**
   * Store medical record hash on blockchain
   * Creates an immutable record of the medical data hash
   */
  async storeMedicalRecordHash(
    patientId: string,
    recordId: string,
    dataHash: string
  ): Promise<MedicalRecordHash> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized - cannot write to blockchain');
    }

    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Blockchain not connected');
      }
    }

    try {
      // Create metadata for the transaction
      const metadata = {
        patientId,
        recordId,
        dataHash,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Encode metadata as transaction data
      const encodedData = ethers.toUtf8Bytes(JSON.stringify(metadata));

      // Prepare transaction with dynamic gas estimation
      const transaction = {
        to: '0x0000000000000000000000000000000000000000', // Null address for data storage
        value: 0,
        data: ethers.hexlify(encodedData)
      };

      // Estimate gas for this specific transaction
      const estimatedGas = await this.provider.estimateGas(transaction);
      // Add 20% buffer for safety
      const gasLimit = estimatedGas + (estimatedGas * BigInt(20) / BigInt(100));
      
      // Add gas limit to transaction
      const finalTransaction = {
        ...transaction,
        gasLimit: gasLimit
      };

      // Send transaction
      logger.info(`Storing medical record hash on blockchain for patient ${patientId}`);
      const txResponse = await this.wallet.sendTransaction(finalTransaction);
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      
      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      logger.info(`Medical record hash stored on blockchain: ${receipt.hash}`);

      return {
        patientId,
        recordId,
        hash: dataHash,
        timestamp: metadata.timestamp,
        transactionHash: receipt.hash
      };

    } catch (error) {
      logger.error('Failed to store medical record hash on blockchain:', error);
      throw new Error(`Blockchain storage failed: ${error}`);
    }
  }

  /**
   * Get medical record hash from transaction
   * Simplified retrieval for testing
   */
  async getMedicalRecordHash(transactionHash: string): Promise<string | null> {
    try {
      const record = await this.verifyMedicalRecordHash(transactionHash);
      return record ? record.hash : null;
    } catch (error) {
      logger.error('Failed to get medical record hash:', error);
      return null;
    }
  }

  /**
   * Verify medical record hash on blockchain
   * Retrieves and validates stored hash from transaction
   */
  async verifyMedicalRecordHash(transactionHash: string): Promise<MedicalRecordHash | null> {
    try {
      const transaction = await this.provider.getTransaction(transactionHash);
      
      if (!transaction || !transaction.data) {
        return null;
      }

      // Decode the stored data
      const decodedData = ethers.toUtf8String(transaction.data);
      const metadata = JSON.parse(decodedData);

      return {
        patientId: metadata.patientId,
        recordId: metadata.recordId,
        hash: metadata.dataHash,
        timestamp: metadata.timestamp,
        transactionHash
      };

    } catch (error) {
      logger.error('Failed to verify medical record hash:', error);
      return null;
    }
  }

  /**
   * Get wallet balance (POL tokens)
   */
  async getWalletBalance(): Promise<string> {
    if (!this.wallet) {
      return '0';
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get wallet balance:', error);
      return '0';
    }
  }

  /**
   * Get estimated gas cost for storing a medical record
   */
  async estimateStorageCost(): Promise<{
    gasLimit: number;
    gasPrice: string;
    estimatedCost: string;
    costInUSD: string; // Estimated cost in USD (POL is essentially free on testnet)
  }> {
    try {
      const gasPrice = (await this.provider.getFeeData()).gasPrice || BigInt(config.blockchain.gasPrice);
      
      // Create a sample transaction to estimate gas
      const sampleData = {
        patientId: 'sample-patient',
        recordId: 'sample-record',
        dataHash: '0x1234567890abcdef',
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      const encodedData = ethers.toUtf8Bytes(JSON.stringify(sampleData));
      const sampleTransaction = {
        to: '0x0000000000000000000000000000000000000000',
        value: 0,
        data: ethers.hexlify(encodedData)
      };
      
      // Get actual gas estimate
      const estimatedGas = await this.provider.estimateGas(sampleTransaction);
      const gasLimit = Number(estimatedGas + (estimatedGas * BigInt(20) / BigInt(100))); // Add 20% buffer
      
      const estimatedCost = ethers.formatEther(gasPrice * BigInt(gasLimit));

      return {
        gasLimit,
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost,
        costInUSD: '0.000001' // Essentially free on testnet
      };
    } catch (error) {
      logger.error('Failed to estimate storage cost:', error);
      throw new Error('Unable to estimate transaction cost');
    }
  }

  /**
   * Generate a secure hash for medical record data
   */
  generateDataHash(medicalData: any): string {
    const dataString = JSON.stringify(medicalData, Object.keys(medicalData).sort());
    return ethers.keccak256(ethers.toUtf8Bytes(dataString));
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    network: string;
    rpcUrl: string;
    walletConnected: boolean;
    walletAddress?: string;
  } {
    return {
      connected: this.isConnected,
      network: config.blockchain.network,
      rpcUrl: config.blockchain.rpcUrl,
      walletConnected: !!this.wallet,
      ...(this.wallet && { walletAddress: this.wallet.address })
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Initialize connection check
blockchainService.checkConnection().catch(error => {
  logger.warn('Initial blockchain connection check failed:', error);
});
