// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { HexString } from "../utils";
import {
  TypeTag,
  TypeTagBool,
  TypeTagU8,
  TypeTagU16,
  TypeTagU32,
  TypeTagU64,
  TypeTagU128,
  TypeTagU256,
  TypeTagAddress,
  AccountAddress,
  TypeTagVector,
  TypeTagStruct,
  TransactionArgument,
  TransactionArgumentBool,
  TransactionArgumentU16,
  TransactionArgumentU32,
  TransactionArgumentU64,
  TransactionArgumentU128,
  TransactionArgumentU256,
  TransactionArgumentAddress,
  TransactionArgumentU8,
  TransactionArgumentU8Vector,
} from "../moveup_types";
import { 
  EntryFunctionArgument,
  EntryFunctionArgumentBool,
  EntryFunctionArgumentU16,
  EntryFunctionArgumentU32,
  EntryFunctionArgumentU64,
  EntryFunctionArgumentU128,
  EntryFunctionArgumentU256,
  EntryFunctionArgumentAddress,
  EntryFunctionArgumentU8,
  EntryFunctionArgumentBcsBytes,
  EntryFunctionArgumentVector,
  EntryFunctionArgumentStruct,
  EntryFunctionArgumentString,
  StructType,
  EntryFunctionArgumentOption,
  EntryFunctionArgumentFixedPoint32,
  EntryFunctionArgumentFixedPoint64,
  EntryFunctionArgumentObject,
 } from "../moveup_types/transaction";
import { Serializer } from "../bcs";

function assertType(val: any, types: string[] | string, message?: string) {
  if (!types?.includes(typeof val)) {
    throw new Error(
      message || `Invalid arg: ${val} type should be ${types instanceof Array ? types.join(" or ") : types}`,
    );
  }
}

export function ensureBoolean(val: boolean | string): boolean {
  assertType(val, ["boolean", "string"]);
  if (typeof val === "boolean") {
    return val;
  }

  if (val === "true") {
    return true;
  }
  if (val === "false") {
    return false;
  }

  throw new Error("Invalid boolean string.");
}

export function ensureNumber(val: number | string): number {
  assertType(val, ["number", "string"]);
  if (typeof val === "number") {
    return val;
  }

  const res = Number.parseInt(val, 10);
  if (Number.isNaN(res)) {
    throw new Error("Invalid number string.");
  }

  return res;
}

export function ensureBigInt(val: number | bigint | string): bigint {
  assertType(val, ["number", "bigint", "string"]);
  return BigInt(val);
}

export function serializeArg(argVal: any, argType: TypeTag, serializer: Serializer) {
  if (argType instanceof TypeTagBool) {
    serializer.serializeBool(ensureBoolean(argVal));
    return;
  }
  if (argType instanceof TypeTagU8) {
    serializer.serializeU8(ensureNumber(argVal));
    return;
  }
  if (argType instanceof TypeTagU16) {
    serializer.serializeU16(ensureNumber(argVal));
    return;
  }
  if (argType instanceof TypeTagU32) {
    serializer.serializeU32(ensureNumber(argVal));
    return;
  }
  if (argType instanceof TypeTagU64) {
    serializer.serializeU64(ensureBigInt(argVal));
    return;
  }
  if (argType instanceof TypeTagU128) {
    serializer.serializeU128(ensureBigInt(argVal));
    return;
  }
  if (argType instanceof TypeTagU256) {
    serializer.serializeU256(ensureBigInt(argVal));
    return;
  }
  if (argType instanceof TypeTagAddress) {
    let addr: AccountAddress;
    if (typeof argVal === "string" || argVal instanceof HexString) {
      addr = AccountAddress.fromHex(argVal);
    } else if (argVal instanceof AccountAddress) {
      addr = argVal;
    } else {
      throw new Error("Invalid account address.");
    }
    addr.serialize(serializer);
    return;
  }
  if (argType instanceof TypeTagVector) {
    // We are serializing a vector<u8>
    if (argType.value instanceof TypeTagU8) {
      if (argVal instanceof Uint8Array) {
        serializer.serializeBytes(argVal);
        return;
      }

      if (typeof argVal === "string") {
        serializer.serializeStr(argVal);
        return;
      }
    }

    if (!Array.isArray(argVal)) {
      throw new Error("Invalid vector args.");
    }

    serializer.serializeU32AsUleb128(argVal.length);

    argVal.forEach((arg) => serializeArg(arg, argType.value, serializer));
    return;
  }

  if (argType instanceof TypeTagStruct) {
    const { address, module_name: moduleName, name } = (argType as TypeTagStruct).value;
    if (
      `${HexString.fromUint8Array(address.address).toShortString()}::${moduleName.value}::${name.value}` !==
      "0x1::string::String"
    ) {
      throw new Error("The only supported struct arg is of type 0x1::string::String");
    }
    assertType(argVal, ["string"]);

    serializer.serializeStr(argVal);
    return;
  }
  throw new Error("Unsupported arg type.");
}

export function argToTransactionArgument(argVal: any, argType: TypeTag): TransactionArgument {
  if (argType instanceof TypeTagBool) {
    return new TransactionArgumentBool(ensureBoolean(argVal));
  }
  if (argType instanceof TypeTagU8) {
    return new TransactionArgumentU8(ensureNumber(argVal));
  }
  if (argType instanceof TypeTagU16) {
    return new TransactionArgumentU16(ensureNumber(argVal));
  }
  if (argType instanceof TypeTagU32) {
    return new TransactionArgumentU32(ensureNumber(argVal));
  }
  if (argType instanceof TypeTagU64) {
    return new TransactionArgumentU64(ensureBigInt(argVal));
  }
  if (argType instanceof TypeTagU128) {
    return new TransactionArgumentU128(ensureBigInt(argVal));
  }
  if (argType instanceof TypeTagU256) {
    return new TransactionArgumentU256(ensureBigInt(argVal));
  }
  if (argType instanceof TypeTagAddress) {
    let addr: AccountAddress;
    if (typeof argVal === "string" || argVal instanceof HexString) {
      addr = AccountAddress.fromHex(argVal);
    } else if (argVal instanceof AccountAddress) {
      addr = argVal;
    } else {
      throw new Error("Invalid account address.");
    }
    return new TransactionArgumentAddress(addr);
  }
  if (argType instanceof TypeTagVector && argType.value instanceof TypeTagU8) {
    if (!(argVal instanceof Uint8Array)) {
      throw new Error(`${argVal} should be an instance of Uint8Array`);
    }
    return new TransactionArgumentU8Vector(argVal);
  }

  throw new Error("Unknown type for TransactionArgument.");
}

export function argToEntryFunctionArgument(argVal: any, argType: TypeTag): EntryFunctionArgument {
  if (argType instanceof TypeTagBool) {
    return new EntryFunctionArgumentBool(ensureBoolean(argVal));
  }
  if (argType instanceof TypeTagU8) {
    return new EntryFunctionArgumentU8(ensureNumber(argVal));
  }
  if (argType instanceof TypeTagU16) {
    return new EntryFunctionArgumentU16(ensureNumber(argVal));
  }
  if (argType instanceof TypeTagU32) {
    return new EntryFunctionArgumentU32(ensureNumber(argVal));
  }
  if (argType instanceof TypeTagU64) {
    return new EntryFunctionArgumentU64(ensureBigInt(argVal));
  }
  if (argType instanceof TypeTagU128) {
    return new EntryFunctionArgumentU128(ensureBigInt(argVal));
  }
  if (argType instanceof TypeTagU256) {
    return new EntryFunctionArgumentU256(ensureBigInt(argVal));
  }
  if (argType instanceof TypeTagAddress) {
    let addr: AccountAddress;
    if (typeof argVal === "string" || argVal instanceof HexString) {
      addr = AccountAddress.fromHex(argVal);
    } else if (argVal instanceof AccountAddress) {
      addr = argVal;
    } else {
      throw new Error("Invalid account address.");
    }
    return new EntryFunctionArgumentAddress(addr);
  }
  if (argType instanceof TypeTagVector) {
    if (argType.value instanceof TypeTagU8) {
      if (typeof argVal === "string") {
        const numbers: number[] = [];
        for (let i = 0; i < argVal.length; i++) {
          const charCode = argVal.charCodeAt(i);
          numbers.push(charCode);
        }
        argVal = numbers;
      }
      if (argVal instanceof Uint8Array) {
        const numbers: number[] = Array.from(argVal);
        argVal = numbers;
      }
    }

    if (!Array.isArray(argVal)) {
      throw new Error("Invalid vector args.");
    }

    let elements: EntryFunctionArgument[] = [];
    if (argVal.length) {
      elements = argVal.map((argValItem: any) => argToEntryFunctionArgument(argValItem, argType.value));
    }
    return new EntryFunctionArgumentVector(elements);
  }
  if (argType instanceof TypeTagStruct && argType.isStringTypeTag()) {
    return new EntryFunctionArgumentString(argVal);
  }
  if (argType instanceof TypeTagStruct && !(argType.isStringTypeTag())) {
    if (
      (argType as TypeTagStruct).value.module_name.value === "option" &&
      (argType as TypeTagStruct).value.name.value === "Option" &&
      (argType as TypeTagStruct).value.address.toHexString() === AccountAddress.fromHex("0x1").toHexString()
    ){
      if (argVal !== null) {
        const optionTypeArg = argToEntryFunctionArgument(argVal, (argType as TypeTagStruct).value.type_args[0]);
        return new EntryFunctionArgumentOption(optionTypeArg);
      } else {
        return new EntryFunctionArgumentOption(undefined);
      }
    }
    if (
      (argType as TypeTagStruct).value.module_name.value === "object" &&
      (argType as TypeTagStruct).value.name.value === "Object" &&
      (argType as TypeTagStruct).value.address.toHexString() === AccountAddress.fromHex("0x1").toHexString()
    ){
      let addr: AccountAddress;
      if (typeof argVal === "string" || argVal instanceof HexString) {
        addr = AccountAddress.fromHex(argVal);
      } else if (argVal instanceof AccountAddress) {
        addr = argVal;
      } else {
        throw new Error("Invalid account address.");
      }
      return new EntryFunctionArgumentObject(addr);
    }
    if (
      (argType as TypeTagStruct).value.module_name.value === "fixed_point32" &&
      (argType as TypeTagStruct).value.name.value === "FixedPoint32" &&
      (argType as TypeTagStruct).value.address.toHexString() === AccountAddress.fromHex("0x1").toHexString()
    ){
      return new EntryFunctionArgumentFixedPoint32(ensureBigInt(argVal));
    }
    if (
      (argType as TypeTagStruct).value.module_name.value === "fixed_point64" &&
      (argType as TypeTagStruct).value.name.value === "FixedPoint64" &&
      (argType as TypeTagStruct).value.address.toHexString() === AccountAddress.fromHex("0x1").toHexString()
    ){
      return new EntryFunctionArgumentFixedPoint64(ensureBigInt(argVal));
    }
    let structType: StructType = {type_: null, fields: []};
    structType.type_ = (argType as TypeTagStruct).value;
    return new EntryFunctionArgumentStruct(structType);
  }

  throw new Error("Unknown type for EntryFunctionArgument.");
}
