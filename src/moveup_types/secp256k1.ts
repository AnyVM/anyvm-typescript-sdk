// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Bytes, Deserializer, Serializer } from "../bcs";

export class Secp256k1PublicKey {
  static readonly LENGTH: number = 65;

  readonly value: Bytes;

  constructor(value: Bytes) {
    if (value.length !== Secp256k1PublicKey.LENGTH) {
      throw new Error(`Secp256k1PublicKey length should be ${Secp256k1PublicKey.LENGTH}`);
    }
    this.value = value;
  }

  toBytes(): Bytes {
    return this.value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.value);
  }

  static deserialize(deserializer: Deserializer): Secp256k1PublicKey {
    const value = deserializer.deserializeBytes();
    return new Secp256k1PublicKey(value);
  }
}

export class Secp256k1Signature {
  static readonly LENGTH = 64;

  constructor(public readonly value: Bytes) {
    if (value.length !== Secp256k1Signature.LENGTH) {
      throw new Error(`Secp256k1Signature length should be ${Secp256k1Signature.LENGTH}`);
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.value);
  }

  static deserialize(deserializer: Deserializer): Secp256k1Signature {
    const value = deserializer.deserializeBytes();
    return new Secp256k1Signature(value);
  }
}
