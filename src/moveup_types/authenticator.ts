// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */
import { AccountAddress } from "./account_address";
import { Serializer, Deserializer, Seq, deserializeVector, serializeVector } from "../bcs";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1";
import { MultiSecp256k1PublicKey, MultiSecp256k1Signature } from "./multi_secp256k1";

export abstract class TransactionAuthenticator {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionAuthenticator {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case 3:
        return TransactionAuthenticatorSecp256k1.load(deserializer);
      case 4:
        return TransactionAuthenticatorMultiSecp256k1.load(deserializer);
      case 2:
        return TransactionAuthenticatorMultiAgent.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TransactionAuthenticator: ${index}`);
    }
  }
}

export class TransactionAuthenticatorSecp256k1 extends TransactionAuthenticator {
  /**
   * An authenticator for single signature.
   *
   * @param public_key Client's public key.
   * @param signature Signature of a raw transaction.
   * for details about generating a signature.
   */
  constructor(public readonly public_key: Secp256k1PublicKey, public readonly signature: Secp256k1Signature) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(3);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorSecp256k1 {
    const public_key = Secp256k1PublicKey.deserialize(deserializer);
    const signature = Secp256k1Signature.deserialize(deserializer);
    return new TransactionAuthenticatorSecp256k1(public_key, signature);
  }
}

export class TransactionAuthenticatorMultiSecp256k1 extends TransactionAuthenticator {
  /**
   * An authenticator for multiple signatures.
   *
   * @param public_key
   * @param signature
   *
   */
  constructor(public readonly public_key: MultiSecp256k1PublicKey, public readonly signature: MultiSecp256k1Signature) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(4);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorMultiSecp256k1 {
    const public_key = MultiSecp256k1PublicKey.deserialize(deserializer);
    const signature = MultiSecp256k1Signature.deserialize(deserializer);
    return new TransactionAuthenticatorMultiSecp256k1(public_key, signature);
  }
}

export class TransactionAuthenticatorMultiAgent extends TransactionAuthenticator {
  constructor(
    public readonly sender: AccountAuthenticator,
    public readonly secondary_signer_addresses: Seq<AccountAddress>,
    public readonly secondary_signers: Seq<AccountAuthenticator>,
  ) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(2);
    this.sender.serialize(serializer);
    serializeVector<AccountAddress>(this.secondary_signer_addresses, serializer);
    serializeVector<AccountAuthenticator>(this.secondary_signers, serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorMultiAgent {
    const sender = AccountAuthenticator.deserialize(deserializer);
    const secondary_signer_addresses = deserializeVector(deserializer, AccountAddress);
    const secondary_signers = deserializeVector(deserializer, AccountAuthenticator);
    return new TransactionAuthenticatorMultiAgent(sender, secondary_signer_addresses, secondary_signers);
  }
}

export abstract class AccountAuthenticator {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): AccountAuthenticator {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case 3:
        return AccountAuthenticatorSecp256k1.load(deserializer);
      case 4:
        return AccountAuthenticatorMultiSecp256k1.load(deserializer);
      default:
        throw new Error(`Unknown variant index for AccountAuthenticator: ${index}`);
    }
  }
}

export class AccountAuthenticatorSecp256k1 extends AccountAuthenticator {
  constructor(public readonly public_key: Secp256k1PublicKey, public readonly signature: Secp256k1Signature) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(3);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorSecp256k1 {
    const public_key = Secp256k1PublicKey.deserialize(deserializer);
    const signature = Secp256k1Signature.deserialize(deserializer);
    return new AccountAuthenticatorSecp256k1(public_key, signature);
  }
}

export class AccountAuthenticatorMultiSecp256k1 extends AccountAuthenticator {
  constructor(public readonly public_key: MultiSecp256k1PublicKey, public readonly signature: MultiSecp256k1Signature) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(4);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorMultiSecp256k1 {
    const public_key = MultiSecp256k1PublicKey.deserialize(deserializer);
    const signature = MultiSecp256k1Signature.deserialize(deserializer);
    return new AccountAuthenticatorMultiSecp256k1(public_key, signature);
  }
}
