// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// import nacl from "tweetnacl";
import { ec } from 'elliptic';
import { ethers } from 'ethers';
import { hexToBytes, bytesToHex } from "@noble/hashes/utils";
import { keccak_256, sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { HexString, MaybeHexString, Memoize } from "../utils";
import * as Gen from "../generated/index";
import { AccountAddress, AuthenticationKey, Secp256k1PublicKey } from "../moveup_types";
import { bcsToBytes } from "../bcs";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";

export interface MoveupAccountObject {
  address?: Gen.HexEncodedBytes;
  publicKeyHex?: Gen.HexEncodedBytes;
  privateKeyHex: Gen.HexEncodedBytes;
}

let ellipticCurve = new ec('secp256k1');

/**
 * Class for creating and managing Moveup account
 */
export class MoveupAccount {
  /**
   * A private key and public key, associated with the given account
   */
  readonly signingKey: ec.KeyPair;

  /**
   * Address associated with the given account
   */
  private readonly accountAddress: HexString;

  static fromMoveupAccountObject(obj: MoveupAccountObject): MoveupAccount {
    return new MoveupAccount(HexString.ensure(obj.privateKeyHex).toUint8Array(), obj.address);
  }

  /**
   * Test derive path
   */
  static isValidPath = (path: string): boolean => {
    if (!/^m\/44'\/60'\/[0-9]+'\/[0-9]+'\/[0-9]+'+$/.test(path)) {
      return false;
    }
    return true;
  };

  /**
   * Creates new account with bip44 path and mnemonics,
   * @param path. (e.g. m/44'/60'/0'/0'/0')
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param mnemonics.
   * @returns MoveupAccount
   */
  static fromDerivePath(path: string, mnemonics: string): MoveupAccount {
    if (!MoveupAccount.isValidPath(path)) {
      throw new Error("Invalid derivation path");
    }

    const normalizeMnemonics = mnemonics
      .trim()
      .split(/\s+/)
      .map((part) => part.toLowerCase())
      .join(" ");

    const ethersWallet = ethers.Wallet.fromMnemonic(normalizeMnemonics);
    const key = ethersWallet.privateKey;

    return new MoveupAccount(hexToBytes(key.slice(-64)));
  }

  /**
   * Creates new account instance. Constructor allows passing in an address,
   * to handle account key rotation, where auth_key != public_key
   * @param privateKeyBytes  Private key from which account key pair will be generated.
   * If not specified, new key pair is going to be created.
   * @param address Account address (e.g. 0x55d08d31b5bc651f846ca2df53171e2e04943607).
   * If not specified, a new one will be generated from public key
   */
  constructor(privateKeyBytes?: Uint8Array | undefined, address?: MaybeHexString) {
    if (privateKeyBytes) {
      this.signingKey = ellipticCurve.keyFromPrivate(privateKeyBytes);
    } else {
      this.signingKey = ellipticCurve.genKeyPair();
    }
    this.accountAddress = HexString.ensure(address || this.authKey().hex());
  }

  /**
   * This is the key by which Moveup account is referenced.
   * It is the 20-byte of the keccak256 cryptographic hash
   * of the public key(s) concatenated with a signature scheme identifier byte
   * @returns Address associated with the given account
   */
  address(): HexString {
    return this.accountAddress;
  }

  /**
   * This key enables account owners to rotate their private key(s)
   * associated with the account without changing the address that hosts their account.
   * @returns Authentication key for the associated account
   */
  @Memoize()
  authKey(): HexString {
    const pubKey = new Secp256k1PublicKey(new HexString(this.signingKey.getPublic("hex")).toUint8Array());
    const authKey = AuthenticationKey.fromSecp256k1PublicKey(pubKey);
    return authKey.derivedAddress();
  }

  /**
   * Takes source address and seeds and returns the resource account address
   * @param sourceAddress Address used to derive the resource account
   * @param seed The seed bytes
   * @returns The resource account address
   */

  static getResourceAccountAddress(sourceAddress: MaybeHexString, seed: Uint8Array): HexString {
    const source = bcsToBytes(AccountAddress.fromHex(sourceAddress));

    const bytes = new Uint8Array([...source, ...seed, AuthenticationKey.DERIVE_RESOURCE_ACCOUNT_SCHEME]);

    const hash = keccak_256.create();
    hash.update(bytes);

    return HexString.fromUint8Array(hash.digest().slice(-20));
  }

  /**
   * This key is generated with Secp256k1 scheme.
   * Public key is used to check a signature of transaction, signed by given account
   * @returns The public key for the associated account
   */
  pubKey(): HexString {
    return new HexString(this.signingKey.getPublic("hex"));
  }

  /**
   * Signs specified `buffer` with account's private key
   * @param buffer A buffer to sign
   * @returns A signature HexString
   */
  signBuffer(buffer: Uint8Array): HexString {
    const bufferHash = keccak_256(buffer);
    const signatureHex = secp256k1.sign(bytesToHex(bufferHash), this.signingKey.getPrivate('hex')).toCompactHex();
    
    return new HexString(signatureHex);
  }

  /**
   * Signs specified `hexString` with account's private key
   * @param hexString A regular string or HexString to sign
   * @returns A signature HexString
   */
  signHexString(hexString: MaybeHexString): HexString {
    const toSign = HexString.ensure(hexString).toUint8Array();
    return this.signBuffer(toSign);
  }

  /**
   * Verifies the signature of the message with the public key of the account
   * @param message a signed message
   * @param signature the signature of the message
   */
  verifySignature(message: MaybeHexString, signature: MaybeHexString): boolean {
    const rawMessage = HexString.ensure(message).toUint8Array();
    const messageHash = keccak_256(rawMessage);

    return secp256k1.verify(HexString.ensure(signature).noPrefix(), bytesToHex(messageHash), this.pubKey().noPrefix());
  }

  /**
   * Derives account address, public key and private key
   * @returns MoveupAccountObject instance.
   * @example An example of the returned MoveupAccountObject object
   * ```
   * {
   *    address: "0x55d08d31b5bc651f846ca2df53171e2e04943607",
   *    publicKeyHex: "0x0415b6c738cfc1a89fc0cabc0c70251a650675d1af7a71f77d4e744aff64f102e1fd30c37fcd5ce615d5b26e962963217dadcf95ad8d85651e38c42d67013a9934",
   *    privateKeyHex: "0x47c302b78ba9209f0ff29508a076605bf7a769a8b8ce1aaa5fb2b7ef6b5e7f71"
   * }
   * ```
   */
  toPrivateKeyObject(): MoveupAccountObject {
    return {
      address: this.address().hex(),
      publicKeyHex: this.pubKey().hex(),
      privateKeyHex: this.signingKey.getPrivate("hex"),
    };
  }
}

// Returns an account address as a HexString given either an MoveupAccount or a MaybeHexString.
export function getAddressFromAccountOrAddress(accountOrAddress: MoveupAccount | MaybeHexString): HexString {
  return accountOrAddress instanceof MoveupAccount ? accountOrAddress.address() : HexString.ensure(accountOrAddress);
}
