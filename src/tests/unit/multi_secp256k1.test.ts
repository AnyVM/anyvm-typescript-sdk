// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
import { HexString } from "../../utils";
import { bcsToBytes, Deserializer } from "../../bcs";
import { Secp256k1PublicKey, Secp256k1Signature } from "../../moveup_types/secp256k1";
import { MultiSecp256k1PublicKey, MultiSecp256k1Signature } from "../../moveup_types/multi_secp256k1";

describe("MultiSecp256k1", () => {
  it("public key serializes to bytes correctly", async () => {
    const publicKey1 = "049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7";
    const publicKey2 = "0477599757c841cee6828a54d6176aa23c47d7c3471b99b15f4855cfdf74297a5ffd18b14aa6f625593f49d4dba83c499527e4a6dfc01c19ffe45a6adafc22fe2d";
    const publicKey3 = "049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7";

    const pubKeyMultiSig = new MultiSecp256k1PublicKey(
      [
        new Secp256k1PublicKey(new HexString(publicKey1).toUint8Array()),
        new Secp256k1PublicKey(new HexString(publicKey2).toUint8Array()),
        new Secp256k1PublicKey(new HexString(publicKey3).toUint8Array()),
      ],
      2,
    );

    expect(HexString.fromUint8Array(pubKeyMultiSig.toBytes()).noPrefix()).toEqual(
      "049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d70477599757c841cee6828a54d6176aa23c47d7c3471b99b15f4855cfdf74297a5ffd18b14aa6f625593f49d4dba83c499527e4a6dfc01c19ffe45a6adafc22fe2d049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d702",
    );
  });

  it("public key deserializes from bytes correctly", async () => {
    const publicKey1 = "049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7";
    const publicKey2 = "0477599757c841cee6828a54d6176aa23c47d7c3471b99b15f4855cfdf74297a5ffd18b14aa6f625593f49d4dba83c499527e4a6dfc01c19ffe45a6adafc22fe2d";
    const publicKey3 = "049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7";

    const pubKeyMultiSig = new MultiSecp256k1PublicKey(
      [
        new Secp256k1PublicKey(new HexString(publicKey1).toUint8Array()),
        new Secp256k1PublicKey(new HexString(publicKey2).toUint8Array()),
        new Secp256k1PublicKey(new HexString(publicKey3).toUint8Array()),
      ],
      2,
    );
    const deserialzed = MultiSecp256k1PublicKey.deserialize(new Deserializer(bcsToBytes(pubKeyMultiSig)));
    expect(HexString.fromUint8Array(deserialzed.toBytes()).noPrefix()).toEqual(
      HexString.fromUint8Array(pubKeyMultiSig.toBytes()).noPrefix(),
    );
  });

  it("signature serializes to bytes correctly", async () => {
    // eslint-disable-next-line operator-linebreak
    const sig1 =
      "e6f3ba05469b2388492397840183945d4291f0dd3989150de3248e06b4cefe0ddf6180a80a0f04c045ee8f362870cb46918478cd9b56c66076f94f3efd5a8805";
    // eslint-disable-next-line operator-linebreak
    const sig2 =
      "2ae0818b7e51b853f1e43dc4c89a1f5fabc9cb256030a908f9872f3eaeb048fb1e2b4ffd5a9d5d1caedd0c8b7d6155ed8071e913536fa5c5a64327b6f2d9a102";
    const bitmap = "c0000000";

    const multisig = new MultiSecp256k1Signature(
      [
        new Secp256k1Signature(new HexString(sig1).toUint8Array()),
        new Secp256k1Signature(new HexString(sig2).toUint8Array()),
      ],
      new HexString(bitmap).toUint8Array(),
    );

    expect(HexString.fromUint8Array(multisig.toBytes()).noPrefix()).toEqual(
      "e6f3ba05469b2388492397840183945d4291f0dd3989150de3248e06b4cefe0ddf6180a80a0f04c045ee8f362870cb46918478cd9b56c66076f94f3efd5a88052ae0818b7e51b853f1e43dc4c89a1f5fabc9cb256030a908f9872f3eaeb048fb1e2b4ffd5a9d5d1caedd0c8b7d6155ed8071e913536fa5c5a64327b6f2d9a102c0000000",
    );
  });

  it("signature deserializes from bytes correctly", async () => {
    // eslint-disable-next-line operator-linebreak
    const sig1 =
      "e6f3ba05469b2388492397840183945d4291f0dd3989150de3248e06b4cefe0ddf6180a80a0f04c045ee8f362870cb46918478cd9b56c66076f94f3efd5a8805";
    // eslint-disable-next-line operator-linebreak
    const sig2 =
      "2ae0818b7e51b853f1e43dc4c89a1f5fabc9cb256030a908f9872f3eaeb048fb1e2b4ffd5a9d5d1caedd0c8b7d6155ed8071e913536fa5c5a64327b6f2d9a102";
    const bitmap = "c0000000";

    const multisig = new MultiSecp256k1Signature(
      [
        new Secp256k1Signature(new HexString(sig1).toUint8Array()),
        new Secp256k1Signature(new HexString(sig2).toUint8Array()),
      ],
      new HexString(bitmap).toUint8Array(),
    );

    const deserialzed = MultiSecp256k1Signature.deserialize(new Deserializer(bcsToBytes(multisig)));
    expect(HexString.fromUint8Array(deserialzed.toBytes()).noPrefix()).toEqual(
      HexString.fromUint8Array(multisig.toBytes()).noPrefix(),
    );
  });

  it("creates a valid bitmap", () => {
    expect(MultiSecp256k1Signature.createBitmap([0, 2, 31])).toEqual(
      new Uint8Array([0b10100000, 0b00000000, 0b00000000, 0b00000001]),
    );
  });

  it("throws exception when creating a bitmap with wrong bits", async () => {
    expect(() => {
      MultiSecp256k1Signature.createBitmap([32]);
    }).toThrow("Invalid bit value 32.");
  });

  it("throws exception when creating a bitmap with duplicate bits", async () => {
    expect(() => {
      MultiSecp256k1Signature.createBitmap([2, 2]);
    }).toThrow("Duplicated bits detected.");
  });
});
