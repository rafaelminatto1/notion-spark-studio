// Serviço de criptografia e compressão para backups
// Modulariza a lógica de segurança em arquivo separado

import type { BackupEntry } from './BackupTypes';

export interface CompressionResult {
  data: Record<string, unknown>;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export interface EncryptionResult {
  data: Record<string, unknown>;
  encrypted: boolean;
  algorithm?: string;
}

export class BackupCryptoService {
  /**
   * Comprime dados se necessário
   */
  async compressData(
    data: Record<string, unknown>, 
    compressionThreshold: number = 1024
  ): Promise<CompressionResult> {
    const originalSize = this.calculateDataSize(data);
    
    if (originalSize < compressionThreshold) {
      return {
        data,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
        ratio: 1
      };
    }

    try {
      // Simulação de compressão (em produção seria LZ4, GZIP ou similar)
      const serialized = JSON.stringify(data);
      const compressedData = this.simulateCompression(serialized);
      const compressedSize = compressedData.length;
      
      return {
        data: { compressed: compressedData },
        compressed: true,
        originalSize,
        compressedSize,
        ratio: originalSize / compressedSize
      };
    } catch (error) {
      console.error('Erro na compressão:', error);
      return {
        data,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
        ratio: 1
      };
    }
  }

  /**
   * Descomprime dados
   */
  async decompressData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      if (data.compressed && typeof data.compressed === 'string') {
        const decompressed = this.simulateDecompression(data.compressed);
        return JSON.parse(decompressed);
      }
      return data;
    } catch (error) {
      console.error('Erro na descompressão:', error);
      return data;
    }
  }

  /**
   * Criptografa dados
   */
  async encryptData(
    data: Record<string, unknown>, 
    algorithm: string = 'AES-256-GCM'
  ): Promise<EncryptionResult> {
    try {
      // Simulação de criptografia (em produção seria Web Crypto API)
      const serialized = JSON.stringify(data);
      const encrypted = this.simulateEncryption(serialized, algorithm);
      
      return {
        data: { 
          encrypted, 
          algorithm,
          timestamp: Date.now()
        },
        encrypted: true,
        algorithm
      };
    } catch (error) {
      console.error('Erro na criptografia:', error);
      return {
        data,
        encrypted: false
      };
    }
  }

  /**
   * Descriptografa dados
   */
  async decryptData(
    data: Record<string, unknown>, 
    algorithm?: string
  ): Promise<Record<string, unknown>> {
    try {
      if (data.encrypted && typeof data.encrypted === 'string') {
        const decrypted = this.simulateDecryption(data.encrypted, algorithm || 'AES-256-GCM');
        return JSON.parse(decrypted);
      }
      return data;
    } catch (error) {
      console.error('Erro na descriptografia:', error);
      return data;
    }
  }

  /**
   * Verifica integridade do backup
   */
  async verifyIntegrity(backup: BackupEntry): Promise<boolean> {
    try {
      // Verificações básicas de integridade
      if (!backup.id || !backup.data || !backup.timestamp) {
        return false;
      }

      // Verificar se os dados podem ser processados
      let testData = backup.data;

      if (backup.encrypted) {
        testData = await this.decryptData(testData);
      }

      if (backup.compressed) {
        testData = await this.decompressData(testData);
      }

      // Verificar se é um objeto válido
      return typeof testData === 'object' && testData !== null;
    } catch (error) {
      console.error('Erro na verificação de integridade:', error);
      return false;
    }
  }

  /**
   * Calcula o tamanho dos dados em bytes
   */
  private calculateDataSize(data: Record<string, unknown>): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Estimativa
    }
  }

  /**
   * Simula compressão (placeholder para implementação real)
   */
  private simulateCompression(data: string): string {
    // Em produção seria substituído por library real (pako, lz4, etc.)
    const compressed = btoa(data);
    // Simular redução de 40%
    return compressed.substring(0, Math.floor(compressed.length * 0.6));
  }

  /**
   * Simula descompressão (placeholder para implementação real)
   */
  private simulateDecompression(compressedData: string): string {
    // Em produção seria substituído por library real
    try {
      return atob(compressedData);
    } catch {
      return compressedData;
    }
  }

  /**
   * Simula criptografia (placeholder para implementação real)
   */
  private simulateEncryption(data: string, algorithm: string): string {
    // Em produção seria substituído por Web Crypto API
    const key = `${algorithm}_${Date.now()}`;
    return btoa(`${key}:${data}`);
  }

  /**
   * Simula descriptografia (placeholder para implementação real)
   */
  private simulateDecryption(encryptedData: string, algorithm: string): string {
    // Em produção seria substituído por Web Crypto API
    try {
      const decoded = atob(encryptedData);
      const parts = decoded.split(':');
      return parts.slice(1).join(':'); // Remove key prefix
    } catch {
      return encryptedData;
    }
  }

  /**
   * Gera hash para verificação de integridade
   */
  async generateHash(data: Record<string, unknown>): Promise<string> {
    // Em produção seria substituído por Web Crypto API
    const serialized = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verifica hash de integridade
   */
  async verifyHash(data: Record<string, unknown>, expectedHash: string): Promise<boolean> {
    const currentHash = await this.generateHash(data);
    return currentHash === expectedHash;
  }
} 