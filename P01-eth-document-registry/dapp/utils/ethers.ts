import { ethers } from 'ethers';

/**
 * Utilidades criptográficas usando Ethers.js v6
 */

export class EthersUtils {
  /**
   * Crea una instancia de Wallet a partir de una clave privada
   */
  static createWallet(privateKey: string, rpcUrl: string): ethers.Wallet {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Calcula el hash Keccak256 de un contenido
   */
  static hashKeccak256(data: string | Uint8Array): string {
    return ethers.keccak256(typeof data === 'string' ? ethers.toUtf8Bytes(data) : data);
  }

  /**
   * Firma un mensaje usando la wallet
   * @param message El mensaje a firmar (generalmente un hash)
   * @param wallet La wallet para firmar
   * @returns La firma
   */
  static async signMessage(message: string, wallet: ethers.Wallet): Promise<string> {
    try {
      // Si el mensaje es un hash (comienza con 0x), usarlo directamente
      // Si no, crear un hash Keccak256
      let messageToSign = message;
      if (!message.startsWith('0x') || message.length !== 66) {
        messageToSign = this.hashKeccak256(message);
      }

      const signature = await wallet.signMessage(ethers.getBytes(messageToSign));
      console.log('✅ Mensaje firmado:', { message: messageToSign, signature });
      return signature;
    } catch (error) {
      console.error('❌ Error al firmar mensaje:', error);
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  /**
   * Verifica una firma
   * @param message El mensaje que fue firmado
   * @param signature La firma a verificar
   * @param signer La dirección que supuestamente firmó
   * @returns true si la firma es válida
   */
  static verifySignature(
    message: string,
    signature: string,
    signer: string
  ): boolean {
    try {
      const recovered = ethers.verifyMessage(message, signature);
      return recovered.toLowerCase() === signer.toLowerCase();
    } catch (error) {
      console.error('❌ Error al verificar firma:', error);
      return false;
    }
  }

  /**
   * Obtiene la dirección de una firma
   */
  static recoverAddress(message: string, signature: string): string {
    try {
      return ethers.verifyMessage(message, signature);
    } catch (error) {
      console.error('❌ Error al recuperar dirección:', error);
      return '';
    }
  }
}
