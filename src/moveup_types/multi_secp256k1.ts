// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-bitwise */
import { Bytes, Deserializer, Seq, Serializer, Uint8 } from "../bcs";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1";

/**
 * MultiSecp256k1 currently supports at most 32 signatures.
 */
const MAX_SIGNATURES_SUPPORTED = 32;

export class MultiSecp256k1PublicKey {
  /**
   * Public key for a K-of-N multisig transaction. A K-of-N multisig transaction means that for such a
   * transaction to be executed, at least K out of the N authorized signers have signed the transaction
   * and passed the check conducted by the chain.
   *
   * @param public_keys A list of public keys
   * @param threshold At least "threshold" signatures must be valid
   */
  constructor(public readonly public_keys: Seq<Secp256k1PublicKey>, public readonly threshold: Uint8) {
    if (threshold > MAX_SIGNATURES_SUPPORTED) {
      throw new Error(`"threshold" cannot be larger than ${MAX_SIGNATURES_SUPPORTED}`);
    }
  }

  /**
   * Converts a MultiSecp256k1PublicKey into bytes with: bytes = p1_bytes | ... | pn_bytes | threshold
   */
  toBytes(): Bytes {
    const bytes = new Uint8Array(this.public_keys.length * Secp256k1PublicKey.LENGTH + 1);
    this.public_keys.forEach((k: Secp256k1PublicKey, i: number) => {
      bytes.set(k.value, i * Secp256k1PublicKey.LENGTH);
    });

    bytes[this.public_keys.length * Secp256k1PublicKey.LENGTH] = this.threshold;

    return bytes;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toBytes());
  }

  static deserialize(deserializer: Deserializer): MultiSecp256k1PublicKey {
    const bytes = deserializer.deserializeBytes();
    const threshold = bytes[bytes.length - 1];

    const keys: Seq<Secp256k1PublicKey> = [];

    for (let i = 0; i < bytes.length - 1; i += Secp256k1PublicKey.LENGTH) {
      const begin = i;
      keys.push(new Secp256k1PublicKey(bytes.subarray(begin, begin + Secp256k1PublicKey.LENGTH)));
    }
    return new MultiSecp256k1PublicKey(keys, threshold);
  }
}

export class MultiSecp256k1Signature {
  static BITMAP_LEN: Uint8 = 4;

  /**
   * Signature for a K-of-N multisig transaction.
   *
   * @param signatures A list of Secp256k1 signatures
   * @param bitmap 4 bytes, at most 32 signatures are supported. If Nth bit value is `1`, the Nth
   * signature should be provided in `signatures`. Bits are read from left to right
   */
  constructor(public readonly signatures: Seq<Secp256k1Signature>, public readonly bitmap: Uint8Array) {
    if (bitmap.length !== MultiSecp256k1Signature.BITMAP_LEN) {
      throw new Error(`"bitmap" length should be ${MultiSecp256k1Signature.BITMAP_LEN}`);
    }
  }

  /**
   * Converts a MultiSecp256k1Signature into bytes with `bytes = s1_bytes | ... | sn_bytes | bitmap`
   */
  toBytes(): Bytes {
    const bytes = new Uint8Array(this.signatures.length * Secp256k1Signature.LENGTH + MultiSecp256k1Signature.BITMAP_LEN);
    this.signatures.forEach((k: Secp256k1Signature, i: number) => {
      bytes.set(k.value, i * Secp256k1Signature.LENGTH);
    });

    bytes.set(this.bitmap, this.signatures.length * Secp256k1Signature.LENGTH);

    return bytes;
  }

  /**
   * Helper method to create a bitmap out of the specified bit positions
   * @param bits The bitmap positions that should be set. A position starts at index 0.
   * Valid position should range between 0 and 31.
   * @example
   * Here's an example of valid `bits`
   * ```
   * [0, 2, 31]
   * ```
   * `[0, 2, 31]` means the 1st, 3rd and 32nd bits should be set in the bitmap.
   * The result bitmap should be 0b1010000000000000000000000000001
   *
   * @returns bitmap that is 32bit long
   */
  static createBitmap(bits: Seq<Uint8>): Uint8Array {
    // Bits are read from left to right. e.g. 0b10000000 represents the first bit is set in one byte.
    // The decimal value of 0b10000000 is 128.
    const firstBitInByte = 128;
    const bitmap = new Uint8Array([0, 0, 0, 0]);

    // Check if duplicates exist in bits
    const dupCheckSet = new Set();

    bits.forEach((bit: number) => {
      if (bit >= MAX_SIGNATURES_SUPPORTED) {
        throw new Error(`Invalid bit value ${bit}.`);
      }

      if (dupCheckSet.has(bit)) {
        throw new Error("Duplicated bits detected.");
      }

      dupCheckSet.add(bit);

      const byteOffset = Math.floor(bit / 8);

      let byte = bitmap[byteOffset];

      byte |= firstBitInByte >> bit % 8;

      bitmap[byteOffset] = byte;
    });

    return bitmap;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toBytes());
  }

  static deserialize(deserializer: Deserializer): MultiSecp256k1Signature {
    const bytes = deserializer.deserializeBytes();
    const bitmap = bytes.subarray(bytes.length - 4);

    const sigs: Seq<Secp256k1Signature> = [];

    for (let i = 0; i < bytes.length - bitmap.length; i += Secp256k1Signature.LENGTH) {
      const begin = i;
      sigs.push(new Secp256k1Signature(bytes.subarray(begin, begin + Secp256k1Signature.LENGTH)));
    }
    return new MultiSecp256k1Signature(sigs, bitmap);
  }
}
