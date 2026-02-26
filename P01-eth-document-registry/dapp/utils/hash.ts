import { ethers } from 'ethers';

/**
 * Utilidades para calcular hashes de archivos
 */

export class HashUtils {
  /**
   * Calcula el hash SHA-256 de un archivo
   * @param file El archivo a hashear
   * @returns Promise con el hash en formato hex (0x...)
   */
  static async sha256(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      console.log(`📄 SHA-256 de ${file.name}: 0x${hashHex}`);
      return `0x${hashHex}`;
    } catch (error) {
      console.error('❌ Error calculando SHA-256:', error);
      throw new Error(`Failed to calculate SHA-256: ${error}`);
    }
  }

  /**
   * Calcula el hash Keccak256 de un archivo (para EVM)
   * @param file El archivo a hashear
   * @returns Promise con el hash Keccak256
   */
  static async keccak256(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const hash = ethers.keccak256(bytes);
      console.log(`📄 Keccak256 de ${file.name}: ${hash}`);
      return hash;
    } catch (error) {
      console.error('❌ Error calculando Keccak256:', error);
      throw new Error(`Failed to calculate Keccak256: ${error}`);
    }
  }

  /**
   * Obtiene información del archivo (nombre, tamaño, tipo)
   */
  static getFileInfo(file: File): {
    name: string;
    size: string;
    type: string;
  } {
    return {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type || 'unknown',
    };
  }

  /**
   * Formatea un hash para mostrarlo en la UI
   */
  static formatHash(hash: string, length: number = 10): string {
    if (hash.length <= length * 2) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  }
}
