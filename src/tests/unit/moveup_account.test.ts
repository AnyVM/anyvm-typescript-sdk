// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { MoveupAccount, MoveupAccountObject, getAddressFromAccountOrAddress } from "../../account";
import { HexString } from "../../utils";

const moveupAccountObject: MoveupAccountObject = {
  address: "0xdaa27e14c3c801389746ca06f4729c24c9802990",
  privateKeyHex:
    // eslint-disable-next-line max-len
    "0x13aafc825347cc74fe63189ff1766b65957c94a81920c2d65ae6fbec8b71ba28",
  publicKeyHex: "0x049d623f9c5ef8302f4c1455e05cdefb6c5bc5d44dde7248528ab634707fe24c87a220acec3450e1811cff011785f265fa634498781f2519000b7b4b864d1f79d7",
};

const mnemonic = "shoot island position soft burden budget tooth cruel issue economy destroy above";

test("generates random accounts", () => {
  const a1 = new MoveupAccount();
  const a2 = new MoveupAccount();
  expect(a1.authKey()).not.toBe(a2.authKey());
  expect(a1.address().hex()).not.toBe(a2.address().hex());
});

test("generates derive path accounts", () => {
  const address = "0x8f348f300873fd5da36950b2ac75a26584584fee";
  const a1 = MoveupAccount.fromDerivePath("m/44'/60'/0'/0'/0'", mnemonic);
  expect(a1.address().hex()).toBe(address);
});

test("generates derive path accounts", () => {
  expect(() => {
    MoveupAccount.fromDerivePath("", mnemonic);
  }).toThrow(new Error("Invalid derivation path"));
});

test("accepts custom address", () => {
  const address = "0x777";
  const a1 = new MoveupAccount(undefined, address);
  expect(a1.address().hex()).toBe(address);
});

test("Deserializes from MoveupAccountObject", () => {
  const a1 = MoveupAccount.fromMoveupAccountObject(moveupAccountObject);
  expect(a1.address().hex()).toBe(moveupAccountObject.address);
  expect(a1.pubKey().hex()).toBe(moveupAccountObject.publicKeyHex);
});

test("Deserializes from MoveupAccountObject without address", () => {
  const privateKeyObject = { privateKeyHex: moveupAccountObject.privateKeyHex };
  const a1 = MoveupAccount.fromMoveupAccountObject(privateKeyObject);
  expect(a1.address().hex()).toBe(moveupAccountObject.address);
  expect(a1.pubKey().hex()).toBe(moveupAccountObject.publicKeyHex);
});

test("Serializes/Deserializes", () => {
  const a1 = new MoveupAccount();
  const a2 = MoveupAccount.fromMoveupAccountObject(a1.toPrivateKeyObject());
  expect(a1.authKey().hex()).toBe(a2.authKey().hex());
  expect(a1.address().hex()).toBe(a2.address().hex());
});

test("Signs Strings", () => {
  const a1 = MoveupAccount.fromMoveupAccountObject(moveupAccountObject);
  expect(a1.signHexString("0x7777").hex()).toBe(
    // eslint-disable-next-line max-len
    "0x9e7b52594a02fd3a01ac381cfae8a50d2413ae7acd2b6dbcc5235d978186599d219119c2d8534d9f18b33b0a7311a58fa468d5dd775d46c83b8501b46fb1c773",
  );
});

test("Gets the resource account address", () => {
  const sourceAddress = "0xca843279e3427144cead5e4d5999a3d0";
  const seed = new Uint8Array([1]);

  expect(MoveupAccount.getResourceAccountAddress(sourceAddress, seed).hex()).toBe(
    "0xcba10a3ad62d835442c344f2564dc500824c5ee8",
  );
});

test("Test getAddressFromAccountOrAddress", () => {
  const account = MoveupAccount.fromMoveupAccountObject(moveupAccountObject);
  expect(getAddressFromAccountOrAddress(moveupAccountObject.address!).toString()).toBe(moveupAccountObject.address);
  expect(getAddressFromAccountOrAddress(HexString.ensure(moveupAccountObject.address!)).toString()).toBe(
    moveupAccountObject.address,
  );
  expect(getAddressFromAccountOrAddress(account).toString()).toBe(moveupAccountObject.address);
});
