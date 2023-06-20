// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { keccak_256, sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { HexString } from "../utils";
import { Bytes } from "../bcs";
import { MultiSecp256k1PublicKey } from "./multi_secp256k1";
import { Secp256k1PublicKey } from "./secp256k1";

/**
 * Each account stores an authentication key. Authentication key enables account owners to rotate
 * their private key(s) associated with the account without changing the address that hosts their account.
 *
 * Account addresses can be derived from AuthenticationKey
 */
export class AuthenticationKey {
  static readonly LENGTH: number = 32;

  static readonly MULTI_SECP256K1_SCHEME: number = 3;

  static readonly SECP256K1_SCHEME: number = 2;

  static readonly DERIVE_RESOURCE_ACCOUNT_SCHEME: number = 255;

  readonly bytes: Bytes;

  constructor(bytes: Bytes) {
    if (bytes.length !== AuthenticationKey.LENGTH) {
      throw new Error("Expected a byte array of length 32");
    }
    this.bytes = bytes;
  }

  /**
   * Converts a K-of-N MultiSecp256k1PublicKey to AuthenticationKey with:
   * `auth_key = sha3-256(p_1 | … | p_n | K | 0x01)`. `K` represents the K-of-N required for
   * authenticating the transaction. `0x01` is the 1-byte scheme for multisig.
   */
  static fromMultiSecp256k1PublicKey(publicKey: MultiSecp256k1PublicKey): AuthenticationKey {
    const pubKeyBytes = publicKey.toBytes();

    const bytes = new Uint8Array(pubKeyBytes.length + 1);
    bytes.set(pubKeyBytes);
    bytes.set([AuthenticationKey.MULTI_SECP256K1_SCHEME], pubKeyBytes.length);

    const hash = sha3Hash.create();
    hash.update(bytes);

    const hashBytes = hash.digest();
    for (let i = 0; i < 12; i++) {
      hashBytes[i] = 0x00;
    }

    return new AuthenticationKey(hashBytes);
  }

  static fromSecp256k1PublicKey(publicKey: Secp256k1PublicKey): AuthenticationKey {
    const pubKeyBytes = publicKey.value;

    const hash = keccak_256(pubKeyBytes.slice(-64));
    for (let i = 0; i < 12; i++) {
      hash[i] = 0x00;
    }

    return new AuthenticationKey(hash);
  }

  /**
   * Derives an account address from AuthenticationKey.
   */
  derivedAddress(): HexString {
    return HexString.fromUint8Array(this.bytes.slice(-20));
  }
}
