// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
// import nacl from "tweetnacl";
import { ec } from 'elliptic';
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { bcsSerializeBool, bcsSerializeU128, bcsToBytes, Bytes } from "../../bcs";
import { HexString } from "../../utils";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";

import { TransactionBuilderSecp256k1, TransactionBuilder } from "../../transaction_builder/index";
import {
  ChainId,
  Secp256k1Signature,
  RawTransaction,
  Script,
  EntryFunction,
  StructTag,
  TransactionArgumentAddress,
  TransactionArgumentU8,
  TransactionArgumentU8Vector,
  TransactionPayloadScript,
  TransactionPayloadEntryFunction,
  TypeTagStruct,
  TransactionArgumentU16,
  TransactionArgumentU32,
  TransactionArgumentU256,
  AccountAddress,
  TypeTagBool,
} from "../../moveup_types";
import { keccak_256 } from '@noble/hashes/sha3';

const ADDRESS_1 = "0x1222";
const ADDRESS_2 = "0xdd";
const ADDRESS_3 = "0x0a550c18";
const ADDRESS_4 = "0x01";
const PRIVATE_KEY = "13aafc825347cc74fe63189ff1766b65957c94a81920c2d65ae6fbec8b71ba28";
const TXN_EXPIRE = "18446744073709551615";

function hexSignedTxn(signedTxn: Uint8Array): string {
  return bytesToHex(signedTxn);
}

let ellipticCurve = new ec('secp256k1');

function secp256k1Sign(signingMessage:Uint8Array, signingKey:ec.KeyPair) {
  const bufferHash = keccak_256(signingMessage);
  const signatureHex = secp256k1.sign(bytesToHex(bufferHash), signingKey.getPrivate('hex')).toCompactHex();
  return new Secp256k1Signature(new HexString(signatureHex).toUint8Array());
}

function sign(rawTxn: RawTransaction): Bytes {
  const privateKeyBytes = new HexString(PRIVATE_KEY).toUint8Array();
  const signingKey = ellipticCurve.keyFromPrivate(bytesToHex(privateKeyBytes));
  // const signingKey = ecgen(privateKeyBytes);
  const publicKey = signingKey.getPublic("hex");

  const txnBuilder = new TransactionBuilderSecp256k1(
    (signingMessage) => secp256k1Sign(signingMessage, signingKey),
    //new Secp256k1Signature(new HexString(ellipticCurve.sign(signingMessage, signingKey).toDER("hex").slice(-128)).toUint8Array()),
    new HexString(publicKey).toUint8Array(),
  );

  return txnBuilder.sign(rawTxn);
}

test("throws when preparing signing message with invalid payload", () => {
  expect(() => {
    // @ts-ignore
    TransactionBuilder.getSigningMessage("invalid");
  }).toThrow("Unknown transaction type.");
});

test("gets the signing message", () => {
  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::moveup_coin`,
      "transfer",
      [],
      [bcsToBytes(AccountAddress.fromHex(ADDRESS_2)), bcsSerializeU128(1)],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(new HexString(ADDRESS_3)),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const message = TransactionBuilder.getSigningMessage(rawTxn);

  expect(message instanceof Uint8Array).toBeTruthy();

  expect(HexString.fromUint8Array(message).hex()).toBe(
    "0x72d79ece70b1f2fdc106b3ca9402d885f81b116d66a857b27edb7c525bdd4ab9000000000000000000000000000000000a550c1800000000000000000200000000000000000000000000000000000012220b6d6f766575705f636f696e087472616e7366657200021400000000000000000000000000000000000000dd1001000000000000000000000000000000d0070000000000000000000000000000ffffffffffffffff04",
  );
});

test("serialize entry function payload with no type args", () => {
  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::eth`,
      "transfer",
      [],
      [bcsToBytes(AccountAddress.fromHex(ADDRESS_2)), bcsSerializeU128(1)],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(new HexString(ADDRESS_3)),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c18000000000000000002000000000000000000000000000000000000122203657468087472616e7366657200021400000000000000000000000000000000000000dd1001000000000000000000000000000000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740311361a9f55bbeffa82b3f9e8bbd38d99d2bf1cafa008f77b0d7f6b4ae9b8762633a3176dd941c5f90c7e4fd6c4d811aa2cd8f95a6d3470b6cb1455bd268e290",
  );
});

test("serialize entry function payload with type args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::coin`,
      "transfer",
      [token],
      [bcsToBytes(AccountAddress.fromHex(ADDRESS_2)), bcsSerializeU128(1)],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c18000000000000000002000000000000000000000000000000000000122204636f696e087472616e7366657201070000000000000000000000000000000000000001036574680345544800021400000000000000000000000000000000000000dd1001000000000000000000000000000000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740543ca6bdd792d06d1449ffaeefa5c4e2f714be5562beb9734e13bb51881d39724e3380e0a02d84bed0b5460e436ac3ffd9de57ff865f0528c55bf16041915619",
  );
});

test("serialize entry function payload with type args but no function args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(`${ADDRESS_1}::coin`, "fake_func", [token], []),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c18000000000000000002000000000000000000000000000000000000122204636f696e0966616b655f66756e630107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d74007080032a35202be6c704ce8526f5e4be3df79d310dcbf64672d88cc0e9174504e3ccacf61f75cd286b90d282001f67300c6ce53e516946badd400033d366f20",
  );
});

test("serialize entry function payload with generic type args and function args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`0x14::token::Token`));

  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::moveup_token`,
      "fake_typed_func",
      [token, new TypeTagBool()],
      [bcsToBytes(AccountAddress.fromHex(ADDRESS_2)), bcsSerializeBool(true)],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c1800000000000000000200000000000000000000000000000000000012220c6d6f766575705f746f6b656e0f66616b655f74797065645f66756e630207000000000000000000000000000000000000001405746f6b656e05546f6b656e0000021400000000000000000000000000000000000000dd0101d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740c66303c913d7a5bce7db6e76f3bda9c083e1d2b6abf543aa75a802d1808da5243e7b9b47004102d4f1fa68563f88d94fb1794619dd25fb9e0e005c16116c7387",
  );
});

test("serialize script payload with no type args and no function args", () => {
  const script = hexToBytes("a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102");

  const scriptPayload = new TransactionPayloadScript(new Script(script, [], []));

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    scriptPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740dfb4dc460128d4d02c81040aefacf026da6a9799738e442a14cdf2e074389c7828c8bb535cc0852dc2336141087592c68c9e3fe0f183a9d6e3f13a28fd425074",
  );
});

test("serialize script payload with type args but no function args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const script = hexToBytes("a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102");

  const scriptPayload = new TransactionPayloadScript(new Script(script, [token], []));

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    scriptPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d74066980d9ed9689349ae027ec69b3be00002aceb108070e80aa772f75adcaaad017ef0eea48bcb52484b4c216a7182383321a5068bc364e3b5804012239837683d",
  );
});

test("serialize script payload with type arg and function arg", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const argU8 = new TransactionArgumentU8(2);

  const script = hexToBytes("a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102");

  const scriptPayload = new TransactionPayloadScript(new Script(script, [token], [argU8]));
  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    scriptPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a010201070000000000000000000000000000000000000001036574680345544800010002d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7406c19602a36585eb3a44ef9298667e2b3000306f17383bc5afa3b69b17ff367a92049d240d17db1f502531b0d1dc17ac5850a3e997876d317623f8c023dd6f486",
  );
});

test("serialize script payload with one type arg and two function args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const argU8Vec = new TransactionArgumentU8Vector(bcsSerializeU128(1));
  const argAddress = new TransactionArgumentAddress(AccountAddress.fromHex("0x01"));

  const script = hexToBytes("a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102");

  const scriptPayload = new TransactionPayloadScript(new Script(script, [token], [argU8Vec, argAddress]));

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    scriptPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480002041001000000000000000000000000000000030000000000000000000000000000000000000001d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d74078041eb92d1577829ee3466f3c0ee652afe866d21cb381b514d0861502c2545003b9f539214d6ae08ad5ff2f7e972cc8bdddc00114560a7390c8f2950a0d7fb2",
  );
});

test("serialize script payload with new integer types (u16, u32, u256) as args", () => {
  const argU16 = new TransactionArgumentU16(0xf111);
  const argU32 = new TransactionArgumentU32(0xf1111111);
  const argU256 = new TransactionArgumentU256(
    BigInt("0xf111111111111111111111111111111111111111111111111111111111111111"),
  );

  const script = hexToBytes("");

  const scriptPayload = new TransactionPayloadScript(new Script(script, [], [argU16, argU32, argU256]));

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    scriptPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(4),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "000000000000000000000000000000000a550c180000000000000000000000030611f107111111f10811111111111111111111111111111111111111111111111111111111111111f1d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7401f6e8de655aba7ea70791063f8b5ce2066eb1c84a29d5fe42bb27606f1575fa67195498ac5c87ec6a1bcf8d3e1f3d22ece8d816877d59f6ef05d142fed0e8b58",
  );
});
