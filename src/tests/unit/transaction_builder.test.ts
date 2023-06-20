// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
// import nacl from "tweetnacl";
import { ec } from 'elliptic';
import { ecsign } from 'ethereumjs-util';
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { bcsSerializeUint64, bcsToBytes, Bytes } from "../../bcs";
import { HexString } from "../../utils";

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
  // console.log('buffer is : ', bytesToHex(signingMessage));
    const bufferHash = keccak_256(signingMessage);
    // console.log('bufferHash is : ', bytesToHex(bufferHash));
    // console.log('primary key is : ', signingKey.getPrivate('hex'));
    const { v, r, s } = ecsign(Buffer.from(bufferHash), Buffer.from(hexToBytes(signingKey.getPrivate('hex'))));

    const signatureBuffer = Buffer.concat([
      r,
      s,
      Buffer.from([v])
    ]);

    const signatureHex = signatureBuffer.toString('hex').slice(0,128);
    // console.log('signature is : ', signatureHex);
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

test("serialize entry function payload with no type args", () => {
  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::eth`,
      "transfer",
      [],
      [bcsToBytes(AccountAddress.fromHex(ADDRESS_2)), bcsSerializeUint64(1)],
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
    "000000000000000000000000000000000a550c18000000000000000002000000000000000000000000000000000000122203657468087472616e7366657200021400000000000000000000000000000000000000dd080100000000000000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740c1e63a82bf54cfb3aa0bc7966845b1b17dd1456b7909d71cfeff1aba755a9e6f6be013db5e143d2e104a372ec02676ff5be95a7a274168b136750b22182f159a",
  );
});

test("serialize entry function payload with type args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::coin`,
      "transfer",
      [token],
      [bcsToBytes(AccountAddress.fromHex(ADDRESS_2)), bcsSerializeUint64(1)],
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
    "000000000000000000000000000000000a550c18000000000000000002000000000000000000000000000000000000122204636f696e087472616e7366657201070000000000000000000000000000000000000001036574680345544800021400000000000000000000000000000000000000dd080100000000000000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740bdc367977540e7aa499073ec2a6af8f4c64eb85a3d09e9c542c6f166589e0a796bbd0236c89150fa4828685378187d7f6b87a4c514a2bafba4e6946a86bf2cd9",
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
    "000000000000000000000000000000000a550c18000000000000000002000000000000000000000000000000000000122204636f696e0966616b655f66756e630107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d74092c869ff79caa5cd89282492ff89f1fc1c34d10c8b8f6c13ca5b9ad5abaec98a445d2c02b2e84119342e47f526104d4916e12de8fc2ddbe8d6857e922df1c853",
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
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7407c7ce1f1884a93ba1ad071936c0cc709b81daa9b96edec06416cc35210d254b75546252cb0bb78204e4bb81bc50b78f6c0aab654daf98ee8f94b97dd9ddc2063",
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
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740c8f45c5b6c7ec41fbc06ecdbb00ff0f2d2c4b6a1d0ac3571de7e65e5abc71935266bbc86f7ee9f2c7fd854a37f856701c76d355d4ab9aa4b0c8188a1a0576a2b",
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
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a010201070000000000000000000000000000000000000001036574680345544800010002d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7408716198afd610b68786e1782ad9a89b4654127dceb0e219d675d695ba8da1dd66114d7109060daeb896decef16f11210a807aa77fd2b5a70f6e5e34dfd4328bf",
  );
});

test("serialize script payload with one type arg and two function args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const argU8Vec = new TransactionArgumentU8Vector(bcsSerializeUint64(1));
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
    "000000000000000000000000000000000a550c1800000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102010700000000000000000000000000000000000000010365746803455448000204080100000000000000030000000000000000000000000000000000000001d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740c692a7fe3cf3b8f763aafaf9472754c25b9fb9f02e01075fae4effab6a058f0874b8bbf713d6b9691b9c0b2f1dc8b775138bd8ce5d478e800defd3ac848c50a8",
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
    "000000000000000000000000000000000a550c180000000000000000000000030611f107111111f10811111111111111111111111111111111111111111111111111111111111111f1d0070000000000000000000000000000ffffffffffffffff040341049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d740907d108adb44dace6338c47e6d63b21b765ad4244ffd7077c0fdb3f80a4103cf162e1874a311164bee0767001a16a16247902287dc318a33f2124f0bf65c9da8",
  );
});
