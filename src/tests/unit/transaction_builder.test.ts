// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
// import nacl from "tweetnacl";
import { ec } from 'elliptic';
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { bcsSerializeU128, Bytes } from "../../bcs";
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
import { NODE_URL } from './test_helper.test';
import { MoveupClient } from '../../providers/moveup_client';
import { EntryFunctionArgumentAddress, EntryFunctionArgumentBool, EntryFunctionArgumentU128 } from '../../moveup_types/transaction';

const ADDRESS_1 = "0x1222";
const ADDRESS_2 = "0xdd";
const ADDRESS_3 = "0x8cc297afb3bc498d30decbbb0cd440013c8ba764";
const ADDRESS_4 = "0x01";
const PRIVATE_KEY = "a82294560064b71bb78c00313fe5f9ddbf85bba5185b15d60a1b1c8b27c9028f";
const TXN_EXPIRE = "184467440737095";

function hexSignedTxn(signedTxn: Uint8Array): string {
  return bytesToHex(signedTxn);
}

let ellipticCurve = new ec('secp256k1');

function secp256k1Sign(signingMessage:Uint8Array, signingKey:ec.KeyPair) {
  // const bufferHash = keccak_256(signingMessage);
  // const signatureHex = secp256k1.sign(bytesToHex(bufferHash), signingKey.getPrivate('hex')).toCompactHex();
  const signatureHex = secp256k1.sign(bytesToHex(signingMessage), signingKey.getPrivate('hex')).toCompactHex();
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
    TransactionBuilder.getEip712SigningMessage("invalid");
  }).toThrow("Unknown transaction type.");
});

test("gets the signing message", () => {
  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::moveup_coin`,
      "transfer",
      [],
      [new EntryFunctionArgumentAddress(AccountAddress.fromHex(ADDRESS_2)), new EntryFunctionArgumentU128(BigInt(1))],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(new HexString(ADDRESS_3)),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(BigInt(4)),
  );

  const message = TransactionBuilder.getEip712SigningMessage(rawTxn);

  expect(message instanceof Uint8Array).toBeTruthy();

  expect(HexString.fromUint8Array(message).hex()).toBe(
    "0x912bc6194b81eb79d9aba943453a25b0c06ac95caf756091e88b06d247462c1f",
  );
});

test("serialize entry function payload with no type args", () => {
  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::eth`,
      "transfer",
      [],
      [new EntryFunctionArgumentAddress(AccountAddress.fromHex(ADDRESS_2)), new EntryFunctionArgumentU128(BigInt(1))],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(new HexString(ADDRESS_3)),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba764000000000000000002000000000000000000000000000000000000122203657468087472616e7366657200020700000000000000000000000000000000000000dd0401000000000000000000000000000000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40417e0be0f8792841e848c76b3f891a7dcaac79ad37a5d4b96e0a60b58481902f2d521ec742e6ced61af4a356e3ce9a425dc4eaafec19cd7af655d22fe5883116",
  );
});

test("serialize entry function payload with type args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`${ADDRESS_4}::eth::ETH`));

  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::coin`,
      "transfer",
      [token],
      [new EntryFunctionArgumentAddress(AccountAddress.fromHex(ADDRESS_2)), new EntryFunctionArgumentU128(BigInt(1))],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba764000000000000000002000000000000000000000000000000000000122204636f696e087472616e7366657201070000000000000000000000000000000000000001036574680345544800020700000000000000000000000000000000000000dd0401000000000000000000000000000000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf408f84e54c85fad47e1613faef4ef988af6206d88694b7bf4432640e1d6bf6f8a5363cf4b5ba176de81b82cce1f0d93b98f75919503d3d58c94c2f78ac07d2a05b",
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
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba764000000000000000002000000000000000000000000000000000000122204636f696e0966616b655f66756e630107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf405551f41afae1483d3171515ed011566b1275698cd53586f0bdb227d7cb40ab0d6c92e1e41a28d25b64d576b6adec982e77a234fdf34c9b7daa634f5d0e7599f6",
  );
});

test("serialize entry function payload with generic type args and function args", () => {
  const token = new TypeTagStruct(StructTag.fromString(`0x14::token::Token`));

  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      `${ADDRESS_1}::moveup_token`,
      "fake_typed_func",
      [token, new TypeTagBool()],
      [new EntryFunctionArgumentAddress(AccountAddress.fromHex(ADDRESS_2)), new EntryFunctionArgumentBool(true)],
    ),
  );

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    entryFunctionPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000200000000000000000000000000000000000012220c6d6f766575705f746f6b656e0f66616b655f74797065645f66756e630207000000000000000000000000000000000000001405746f6b656e05546f6b656e0000020700000000000000000000000000000000000000dd0601d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40005c6656339aa2ee2cb80e738612f3843059641d4b8a219f375913aff66ab83604834e4263993407985de1f02d18a68e332324c25eb49ef3b9d2abde7381fff1",
  );
});

test("serialize script payload with no type args and no function args", async () => {
  const script = hexToBytes("a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102");

  const scriptPayload = new TransactionPayloadScript(new Script(script, [], []));

  const rawTxn = new RawTransaction(
    AccountAddress.fromHex(ADDRESS_3),
    BigInt(0),
    scriptPayload,
    BigInt(2000),
    BigInt(0),
    BigInt(TXN_EXPIRE),
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40591a1ee79a348546ba430e421275a03f2fbdf01e1eeadf40bcbcf34b062477ae1386b1f494769f5fee7f34b76fc42771fd9806e71fca8b591938e7c8bbc50dd7",
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
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40c4d94cbf46665f21f627a336fbd7443598fd0298537b6750a108b0263476c98321d9e612eba71fa0390c8d67c90256367e5440eb58511dbe2f561f06553e2ce9",
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
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a010201070000000000000000000000000000000000000001036574680345544800010002d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40c4cdd5a29b9a6915b464333adf985494b949b3d1189d90cef6acae93dd10713a01a1d335e6c05c4ceba3d86a7848245dda0ac3795e350545e059b8d895bfb776",
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
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480002041001000000000000000000000000000000030000000000000000000000000000000000000001d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40d0d41235577a1cb17050e9c4cdc8ad084916e26f1ec118753063f4d32ce888eb75e7f71841036454f2b38cc8580f3148a373a3ed64f6eaf9445b697999a8b0f2",
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
    new ChainId(BigInt(4)),
  );

  const signedTxn = sign(rawTxn);

  expect(hexSignedTxn(signedTxn)).toBe(
    "8cc297afb3bc498d30decbbb0cd440013c8ba7640000000000000000000000030611f107111111f10811111111111111111111111111111111111111111111111111111111111111f1d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40c4395235ba3ad4fe0c0bd3a97f9ba32cb14b878979b85b9a2fc67dee75c60a4a16dc86041d7096e19b9fa65a8dd34d9da3cda0a51dd22f81ee6a30e332eedce8",
  );
});
