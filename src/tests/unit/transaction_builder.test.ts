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
  const signatureHex = secp256k1.sign(bytesToHex(signingMessage), signingKey.getPrivate('hex')).toCompactHex();
  return new Secp256k1Signature(new HexString(signatureHex).toUint8Array());
}

function sign(rawTxn: RawTransaction): Bytes {
  const privateKeyBytes = new HexString(PRIVATE_KEY).toUint8Array();
  const signingKey = ellipticCurve.keyFromPrivate(bytesToHex(privateKeyBytes));
  const publicKey = signingKey.getPublic("hex");

  const txnBuilder = new TransactionBuilderSecp256k1(
    (signingMessage) => secp256k1Sign(signingMessage, signingKey),
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
    "0x3f3d229e64baab58ac091e177625c90b24387b6640898655e89a57c68e8b1472",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba764000000000000000002000000000000000000000000000000000000122203657468087472616e7366657200020700000000000000000000000000000000000000dd0401000000000000000000000000000000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf4023ed9f43c464a7931084d5e20df048cdcf8f3b39062fd057588e6350fc6ed76406c81d316042614780b1d718b20fce8fc8e146e0df74df5325b54ccf1702d6dc",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba764000000000000000002000000000000000000000000000000000000122204636f696e087472616e7366657201070000000000000000000000000000000000000001036574680345544800020700000000000000000000000000000000000000dd0401000000000000000000000000000000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40313361f3b522212b14ae8c9cb18be810d502d2131e9aa3db6b24e97e011a5aaa1c11277d289fa7f981480252ee2867d1261f78eaff7a628d5272e1c6556cfe0e",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000200000000000000000000000000000000000012220c6d6f766575705f746f6b656e0f66616b655f74797065645f66756e630207000000000000000000000000000000000000001405746f6b656e05546f6b656e0000020700000000000000000000000000000000000000dd0601d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40ee7a8ef4ab3f179678ae8a16fb8204d8f24fff30f435e9836f65a22cf077bfcd290c95205a619cd6effb2459613a21e7475665df1d582207a18a3144af228e32",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40deb162c719f3e3114b2b2cbe65110f495193dea42cc09455b80b83c48abab77149c2f32585ce285bcf51fb1eaa326fdb87d6001e6e82b04b9ebb35f004b7fa86",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480000d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40aacc560fcd87f620ee6200f1f32fb4c963a6106e6bd0c628982eb238cfedf04d03e79a4e998b5e76f3b9c59905dfefbb8679bb9a6f81e86b3b74da565682a64f",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a010201070000000000000000000000000000000000000001036574680345544800010002d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf4020fbbfcb878d4ba3bd4ccb717fd22efe73d13159a8c1dcb1f0cfcb07ab6214265c03893edb7503a39471381fcee59106d11bcbacc741c32a79ea6a6c08f90a6d",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba76400000000000000000026a11ceb0b030000000105000100000000050601000000000000000600000000000000001a01020107000000000000000000000000000000000000000103657468034554480002041001000000000000000000000000000000030000000000000000000000000000000000000001d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40ea74fc4fe1e2ab74c771f721a144d8e6098ead66f1d4538dcdbb853f9cf7258d21f34b108e3527d7fc5037a7feff0858a0c9e88f661c65fc56c06b758e5415b4",
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
    "8cc297afb3bc498d30decbbb0cd440013c8ba7640000000000000000000000030611f107111111f10811111111111111111111111111111111111111111111111111111111111111f1d0070000000000000000000000000000471b47acc5a7000004000000000000000341044cbc25bd6c7abe68b2ee3539183df9537897ffbb86f7d0936f54b7247638a02cfcf0b5fd693d4627d33ab818afce5262a96944a844a9bb3bca46153eff152fbf40f6f988de19245131000b223cee6277d77562c384d21ca4672d1b936834f6469f7af950ed7cdb9fe7bf71f9b4e82e317ed240c1ddd4e492f4a832af949a47d426",
  );
});
