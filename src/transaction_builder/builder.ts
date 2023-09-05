// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { keccak_256 } from "@noble/hashes/sha3";
import {
  Secp256k1PublicKey,
  Secp256k1Signature,
  MultiSecp256k1PublicKey,
  MultiSecp256k1Signature,
  RawTransaction,
  SignedTransaction,
  TransactionAuthenticatorSecp256k1,
  TransactionAuthenticatorMultiSecp256k1,
  SigningMessage,
  MultiAgentRawTransaction,
  AccountAddress,
  EntryFunction,
  Identifier,
  ChainId,
  Script,
  TransactionPayload,
  TransactionArgument,
  TransactionPayloadEntryFunction,
  TransactionPayloadScript,
  ModuleId,
  TypeTagParser,
  TransactionPayloadMultisig,
  TypeTagToString,
  ArgsToString,
  TransactionArgumentToString
} from "../moveup_types";
import { bcsToBytes, Bytes, Deserializer, Seq, Serializer, Uint64, Uint8 } from "../bcs";
import { ArgumentABI, EntryFunctionABI, ScriptABI, TransactionScriptABI, TypeArgumentABI } from "../moveup_types/abi";
import { argToEntryFunctionArgument, argToTransactionArgument, serializeArg } from "./builder_utils";
import * as Gen from "../generated/index";
import {
  DEFAULT_TXN_EXP_SEC_FROM_NOW,
  DEFAULT_MAX_GAS_AMOUNT,
  HexString,
  MaybeHexString,
  MemoizeExpiring,
} from "../utils";
import { TypedDataUtils, SignTypedDataVersion, TypedMessage } from '@metamask/eth-sig-util';
import { EntryFunctionArgument, EntryFunctionArgumentToEip712String, EntryFunctionArgumentToString } from "../moveup_types/transaction";

export { TypeTagParser } from "../moveup_types";

const RAW_TRANSACTION_SALT = "MOVEUP::RawTransaction";
const RAW_TRANSACTION_WITH_DATA_SALT = "MOVEUP::RawTransactionWithData";

type AnyRawTransaction = RawTransaction | MultiAgentRawTransaction;

/**
 * Function that takes in a Signing Message (serialized raw transaction)
 *  and returns a signature
 */
export type SigningFn = (txn: SigningMessage) => Secp256k1Signature | MultiSecp256k1Signature;

export class TransactionBuilder<F extends SigningFn> {
  protected readonly signingFunction: F;

  constructor(signingFunction: F, public readonly rawTxnBuilder?: TransactionBuilderABI) {
    this.signingFunction = signingFunction;
  }

  /**
   * Builds a RawTransaction. Relays the call to TransactionBuilderABI.build
   * @param func
   * @param ty_tags
   * @param args
   */
  build(func: string, ty_tags: string[], args: any[]): RawTransaction {
    if (!this.rawTxnBuilder) {
      throw new Error("this.rawTxnBuilder doesn't exist.");
    }

    return this.rawTxnBuilder.build(func, ty_tags, args);
  }

  /** Generates a Signing Message out of a raw transaction. */
  static getSigningMessage(rawTxn: AnyRawTransaction): SigningMessage {
    const hash = keccak_256.create();
    if (rawTxn instanceof RawTransaction) {
      hash.update(RAW_TRANSACTION_SALT);
    } else if (rawTxn instanceof MultiAgentRawTransaction) {
      hash.update(RAW_TRANSACTION_WITH_DATA_SALT);
    } else {
      throw new Error("Unknown transaction type.");
    }

    const prefix = hash.digest();

    const body = bcsToBytes(rawTxn);

    const mergedArray = new Uint8Array(prefix.length + body.length);
    mergedArray.set(prefix);
    mergedArray.set(body, prefix.length);

    return mergedArray;
  }

  static getEip712TypedData(rawTxn: AnyRawTransaction): string {
    let rawTxnPayload;
    if (rawTxn instanceof RawTransaction) {
      rawTxnPayload = (rawTxn as RawTransaction).payload;
    } else if (rawTxn instanceof MultiAgentRawTransaction) {
      rawTxnPayload = (rawTxn as MultiAgentRawTransaction).raw_txn.payload;
    } else {
      throw new Error("Unknown transaction type.");
    }

    let types = {
      EIP712Domain: [],
      AnyVmTransaction: [
        {
           "name": "sender",
           "type": "address",
        },
        {
           "name": "sequenceNumber",
           "type": "uint256",
        },
        {
           "name": "payload",
           "type": "TransactionPayload",
        },
        {
           "name": "maxGasAmount",
           "type": "uint256",
        },
        {
           "name": "gasUnitPrice",
           "type": "uint256",
        },
        {
           "name": "expirationTimestampSecs",
           "type": "uint256",
        },
        {
           "name": "chainId",
           "type": "uint256",
        },
      ],
    };
    let rawTxnPayloadModuleString;
    let rawTxnPayloadFunctionString;
    let payload;
    let rawTxnPayloadTyArgs;
    let rawTxnPayloadArgs;
    let rawTxnPayloadTyArgsString: string[];
    let rawTxnPayloadArgsString;
    let rawTxnPayloadCodeString;

    if (rawTxnPayload instanceof TransactionPayloadEntryFunction) {
      rawTxnPayloadModuleString = HexString.fromUint8Array((rawTxnPayload as TransactionPayloadEntryFunction).value.module_name.address.address).toShortString() + "::" +  (rawTxnPayload as TransactionPayloadEntryFunction).value.module_name.name.value;
      rawTxnPayloadFunctionString = (rawTxnPayload as TransactionPayloadEntryFunction).value.function_name.value;
      rawTxnPayloadTyArgs = (rawTxnPayload as TransactionPayloadEntryFunction).value.ty_args;
      rawTxnPayloadTyArgsString = TypeTagToString(rawTxnPayloadTyArgs);

      rawTxnPayloadArgs =(rawTxnPayload as TransactionPayloadEntryFunction).value.args;
      rawTxnPayloadArgsString = EntryFunctionArgumentToString(rawTxnPayloadArgs);

      payload = {
        type: "EntryFunction",
        value: {
          module: rawTxnPayloadModuleString,
          function: rawTxnPayloadFunctionString,
          tyArgs: rawTxnPayloadTyArgsString,
          args: rawTxnPayloadArgsString,
        },
      };

      const rawTxnPayloadArgsEip712String = EntryFunctionArgumentToEip712String(rawTxnPayloadArgs);

      let updatedTypes = {
        ...types,
        TransactionPayload: [
              {
                  "name": "type",
                  "type": "string",
              },
              {
                  "name": "value",
                  "type": "EntryFunction",
              }
          ],
          EntryFunction: [
              {
                  "name": "module",
                  "type": "string",
              },
              {
                  "name": "function",
                  "type": "string",
              },
              {
                  "name": "tyArgs",
                  "type": "string[]",
              },
              {
                  "name": "args",
                  "type": "EntryFunctionArgs",
              },
          ],
          EntryFunctionArgs: rawTxnPayloadArgsEip712String,
      };

      types = updatedTypes;
    } 
    else if (rawTxnPayload instanceof TransactionPayloadScript) {
      let updatedTypes = {
        ...types,
        TransactionPayload: [
              {
                  "name": "type",
                  "type": "string",
              },
              {
                  "name": "value",
                  "type": 'Script',
              }
          ],
          Script: [
              {
                  "name": "code",
                  "type": "string",
                  },
              {
                  "name": "ty_args",
                  "type": "string[]",
                  },
              {
                  "name": "args",
                  "type": "string[]",
              },
          ],
      };

      rawTxnPayloadCodeString = HexString.fromUint8Array((rawTxnPayload as TransactionPayloadScript).value.code).toString();
      rawTxnPayloadTyArgs = (rawTxnPayload as TransactionPayloadScript).value.ty_args;
      rawTxnPayloadTyArgsString = TypeTagToString(rawTxnPayloadTyArgs);

      rawTxnPayloadArgs =(rawTxnPayload as TransactionPayloadScript).value.args;
      rawTxnPayloadArgsString = TransactionArgumentToString(rawTxnPayloadArgs);

      payload = {
        type: "Script",
        value: {
          code: rawTxnPayloadCodeString,
          ty_args: rawTxnPayloadTyArgsString,
          args: rawTxnPayloadArgsString,
        },
      };

      types = updatedTypes;
    }  else if (rawTxnPayload instanceof TransactionPayloadMultisig) {
      let updatedTypes = {
        ...types,
        TransactionPayload: [
              {
                  "name": "type",
                  "type": "string",
              },
              {
                  "name": "value",
                  "type": 'Multisig',
              }
          ],
          Multisig: [
            {
                "name": "multisig_address",
                "type": "address",
            },
            {
                "name": "transaction_payload",
                "type": "MultisigTransactionPayload",
            },
        ],
        MultisigTransactionPayload: [
            {
                "name": "type",
                "type": "string",
            },
            {
                "name": "value",
                "type": "EntryFunction",
            },
        ],
        EntryFunction: [
          {
              "name": "module",
              "type": "string",
          },
          {
              "name": "function",
              "type": "string",
          },
          {
              "name": "tyArgs",
              "type": "string[]",
          },
          {
              "name": "args",
              "type": "EntryFunctionArgs",
          },
        ],
      };

      types = updatedTypes;
    } else {
      throw new Error("Invalid payload");
    }

    const message = {
      sender: (rawTxn as RawTransaction).sender.toHexString(),
      sequenceNumber: Number((rawTxn as RawTransaction).sequence_number),
      payload: payload,
      maxGasAmount: Number((rawTxn as RawTransaction).max_gas_amount),
      gasUnitPrice: Number((rawTxn as RawTransaction).gas_unit_price),
      expirationTimestampSecs: Number((rawTxn as RawTransaction).expiration_timestamp_secs),
      chainId: Number((rawTxn as RawTransaction).chain_id.value),
    };
    
    return JSON.stringify({
      types: types,
      primaryType: 'AnyVmTransaction',
      domain: {},
      message: message,
    });
  }

  static getEip712SigningMessage(rawTxn: AnyRawTransaction): SigningMessage {
    let rawTxnPayload;
    if (rawTxn instanceof RawTransaction) {
      rawTxnPayload = (rawTxn as RawTransaction).payload;
    } else if (rawTxn instanceof MultiAgentRawTransaction) {
      rawTxnPayload = (rawTxn as MultiAgentRawTransaction).raw_txn.payload;
    } else {
      throw new Error("Unknown transaction type.");
    }

    let types = {
      EIP712Domain: [],
      AnyVmTransaction: [
        {
           "name": "sender",
           "type": "address",
        },
        {
           "name": "sequenceNumber",
           "type": "uint256",
        },
        {
           "name": "payload",
           "type": "TransactionPayload",
        },
        {
           "name": "maxGasAmount",
           "type": "uint256",
        },
        {
           "name": "gasUnitPrice",
           "type": "uint256",
        },
        {
           "name": "expirationTimestampSecs",
           "type": "uint256",
        },
        {
           "name": "chainId",
           "type": "uint256",
        },
      ],
    };

    let rawTxnPayloadModuleString;
    let rawTxnPayloadFunctionString;
    let payload;
    let rawTxnPayloadTyArgs;
    let rawTxnPayloadArgs;
    let rawTxnPayloadTyArgsString: string[];
    let rawTxnPayloadArgsString;
    let rawTxnPayloadCodeString;

    if (rawTxnPayload instanceof TransactionPayloadEntryFunction) {
      

      rawTxnPayloadModuleString = HexString.fromUint8Array((rawTxnPayload as TransactionPayloadEntryFunction).value.module_name.address.address).toShortString() + "::" +  (rawTxnPayload as TransactionPayloadEntryFunction).value.module_name.name.value;
      rawTxnPayloadFunctionString = (rawTxnPayload as TransactionPayloadEntryFunction).value.function_name.value;
      rawTxnPayloadTyArgs = (rawTxnPayload as TransactionPayloadEntryFunction).value.ty_args;
      rawTxnPayloadTyArgsString = TypeTagToString(rawTxnPayloadTyArgs);

      rawTxnPayloadArgs =(rawTxnPayload as TransactionPayloadEntryFunction).value.args;
      rawTxnPayloadArgsString = EntryFunctionArgumentToString(rawTxnPayloadArgs);

      payload = {
        type: "EntryFunction",
        value: {
          module: rawTxnPayloadModuleString,
          function: rawTxnPayloadFunctionString,
          tyArgs: rawTxnPayloadTyArgsString,
          args: rawTxnPayloadArgsString,
        },
      };

      const rawTxnPayloadArgsEip712String = EntryFunctionArgumentToEip712String(rawTxnPayloadArgs);

      let updatedTypes = {
        ...types,
        TransactionPayload: [
              {
                  "name": "type",
                  "type": "string",
              },
              {
                  "name": "value",
                  "type": "EntryFunction",
              }
          ],
          EntryFunction: [
              {
                  "name": "module",
                  "type": "string",
              },
              {
                  "name": "function",
                  "type": "string",
              },
              {
                  "name": "tyArgs",
                  "type": "string[]",
              },
              {
                  "name": "args",
                  "type": "EntryFunctionArgs",
              },
          ],
          EntryFunctionArgs: rawTxnPayloadArgsEip712String,
      };

      types = updatedTypes;
    } 
    else if (rawTxnPayload instanceof TransactionPayloadScript) {
      let updatedTypes = {
        ...types,
        TransactionPayload: [
              {
                  "name": "type",
                  "type": "string",
              },
              {
                  "name": "value",
                  "type": 'Script',
              }
          ],
          Script: [
              {
                  "name": "code",
                  "type": "string",
              },
              {
                  "name": "tyArgs",
                  "type": "string[]",
              },
              {
                  "name": "args",
                  "type": "string[]",
              },
          ],
      };

      rawTxnPayloadCodeString = HexString.fromUint8Array((rawTxnPayload as TransactionPayloadScript).value.code).toString();
      rawTxnPayloadTyArgs = (rawTxnPayload as TransactionPayloadScript).value.ty_args;
      rawTxnPayloadTyArgsString = TypeTagToString(rawTxnPayloadTyArgs, false);

      rawTxnPayloadArgs =(rawTxnPayload as TransactionPayloadScript).value.args;
      rawTxnPayloadArgsString = TransactionArgumentToString(rawTxnPayloadArgs);

      payload = {
        type: "Script",
        value: {
          code: rawTxnPayloadCodeString,
          tyArgs: rawTxnPayloadTyArgsString,
          args: rawTxnPayloadArgsString,
        },
      };

      types = updatedTypes;
    }  else if (rawTxnPayload instanceof TransactionPayloadMultisig) {
      let updatedTypes = {
        ...types,
        TransactionPayload: [
              {
                  "name": "type",
                  "type": "string",
              },
              {
                  "name": "value",
                  "type": 'Multisig',
              }
          ],
          Multisig: [
            {
                "name": "multisig_address",
                "type": "address",
            },
            {
                "name": "transaction_payload",
                "type": "MultisigTransactionPayload",
            },
        ],
        MultisigTransactionPayload: [
            {
                "name": "type",
                "type": "string",
            },
            {
                "name": "value",
                "type": "EntryFunction",
            },
        ],
        EntryFunction: [
          {
              "name": "module",
              "type": "string",
          },
          {
              "name": "function",
              "type": "string",
          },
          {
              "name": "tyArgs",
              "type": "string[]",
          },
          {
              "name": "args",
              "type": "EntryFunctionArgs",
          },
        ],
      };

      types = updatedTypes;
    } else {
      throw new Error("Invalid payload");
    }

    const message = {
      sender: (rawTxn as RawTransaction).sender.toHexString(),
      sequenceNumber: Number((rawTxn as RawTransaction).sequence_number),
      payload: payload,
      maxGasAmount: Number((rawTxn as RawTransaction).max_gas_amount),
      gasUnitPrice: Number((rawTxn as RawTransaction).gas_unit_price),
      expirationTimestampSecs: Number((rawTxn as RawTransaction).expiration_timestamp_secs),
      chainId: Number((rawTxn as RawTransaction).chain_id.value),
    };

    // console.log("message is: ", JSON.stringify(message));
    // console.log("types is: ", JSON.stringify(types));

    const typedDataHash = TypedDataUtils.eip712Hash(
      {
        types: types,
        primaryType: 'AnyVmTransaction',
        domain: {},
        message: message,
      },
      // TransactionBuilder.getEip712TypedData(rawTxn);
      SignTypedDataVersion.V4,
    );
    return typedDataHash;
  }
}

/**
 * Provides signing method for signing a raw transaction with single public key.
 */
export class TransactionBuilderSecp256k1 extends TransactionBuilder<SigningFn> {
  private readonly publicKey: Uint8Array;

  constructor(signingFunction: SigningFn, publicKey: Uint8Array, rawTxnBuilder?: TransactionBuilderABI) {
    super(signingFunction, rawTxnBuilder);
    this.publicKey = publicKey;
  }

  rawToSigned(rawTxn: RawTransaction): SignedTransaction {
    const signingMessage = TransactionBuilder.getEip712SigningMessage(rawTxn);
    const signature = this.signingFunction(signingMessage);

    const authenticator = new TransactionAuthenticatorSecp256k1(
      new Secp256k1PublicKey(this.publicKey),
      signature as Secp256k1Signature,
    );

    return new SignedTransaction(rawTxn, authenticator);
  }

  /** Signs a raw transaction and returns a bcs serialized transaction. */
  sign(rawTxn: RawTransaction): Bytes {
    return bcsToBytes(this.rawToSigned(rawTxn));
  }
}

/**
 * Provides signing method for signing a raw transaction with multisig public key.
 */
export class TransactionBuilderMultiSecp256k1 extends TransactionBuilder<SigningFn> {
  private readonly publicKey: MultiSecp256k1PublicKey;

  constructor(signingFunction: SigningFn, publicKey: MultiSecp256k1PublicKey) {
    super(signingFunction);
    this.publicKey = publicKey;
  }

  rawToSigned(rawTxn: RawTransaction): SignedTransaction {
    const signingMessage = TransactionBuilder.getSigningMessage(rawTxn);
    const bufferHash = keccak_256(signingMessage);
    const signature = this.signingFunction(bufferHash);

    const authenticator = new TransactionAuthenticatorMultiSecp256k1(this.publicKey, signature as MultiSecp256k1Signature);

    return new SignedTransaction(rawTxn, authenticator);
  }

  /** Signs a raw transaction and returns a bcs serialized transaction. */
  sign(rawTxn: RawTransaction): Bytes {
    return bcsToBytes(this.rawToSigned(rawTxn));
  }
}

/**
 * Config for creating raw transactions.
 */
interface ABIBuilderConfig {
  sender: MaybeHexString | AccountAddress;
  sequenceNumber: Uint64 | string;
  gasUnitPrice: Uint64 | string;
  maxGasAmount?: Uint64 | string;
  expSecFromNow?: number | string;
  chainId: Uint8 | string;
}

/**
 * Builds raw transactions based on ABI
 */
export class TransactionBuilderABI {
  private readonly abiMap: Map<string, ScriptABI>;

  private readonly builderConfig: Partial<ABIBuilderConfig>;

  /**
   * Constructs a TransactionBuilderABI instance
   * @param abis List of binary ABIs.
   * @param builderConfig Configs for creating a raw transaction.
   */
  constructor(abis: Bytes[], builderConfig?: ABIBuilderConfig) {
    this.abiMap = new Map<string, ScriptABI>();

    abis.forEach((abi) => {
      const deserializer = new Deserializer(abi);
      const scriptABI = ScriptABI.deserialize(deserializer);
      let k: string;
      if (scriptABI instanceof EntryFunctionABI) {
        const funcABI = scriptABI as EntryFunctionABI;
        const { address: addr, name: moduleName } = funcABI.module_name;
        k = `${HexString.fromUint8Array(addr.address).toShortString()}::${moduleName.value}::${funcABI.name}`;
      } else {
        const funcABI = scriptABI as TransactionScriptABI;
        k = funcABI.name;
      }

      if (this.abiMap.has(k)) {
        throw new Error("Found conflicting ABI interfaces");
      }

      this.abiMap.set(k, scriptABI);
    });

    this.builderConfig = {
      maxGasAmount: BigInt(DEFAULT_MAX_GAS_AMOUNT),
      expSecFromNow: DEFAULT_TXN_EXP_SEC_FROM_NOW,
      ...builderConfig,
    };
  }

  private static toBCSArgs(abiArgs: any[], args: any[]): Bytes[] {
    if (abiArgs.length !== args.length) {
      throw new Error("Wrong number of args provided.");
    }

    return args.map((arg, i) => {
      const serializer = new Serializer();
      serializeArg(arg, abiArgs[i].type_tag, serializer);
      return serializer.getBytes();
    });
  }

  private static toTransactionArguments(abiArgs: any[], args: any[]): TransactionArgument[] {
    if (abiArgs.length !== args.length) {
      throw new Error("Wrong number of args provided.");
    }

    return args.map((arg, i) => argToTransactionArgument(arg, abiArgs[i].type_tag));
  }

  private static toEntryFunctionArguments(abiArgs: any[], args: any[]): EntryFunctionArgument[] {
    if (abiArgs.length !== args.length) {
      throw new Error("Wrong number of args provided.");
    }

    return args.map((arg, i) => argToEntryFunctionArgument(arg, abiArgs[i].type_tag));
  }

  setSequenceNumber(seqNumber: Uint64 | string) {
    this.builderConfig.sequenceNumber = BigInt(seqNumber);
  }

  /**
   * Builds a TransactionPayload. For dApps, chain ID and account sequence numbers are only known to the wallet.
   * Instead of building a RawTransaction (requires chainID and sequenceNumber), dApps can build a TransactionPayload
   * and pass the payload to the wallet for signing and sending.
   * @param func Fully qualified func names, e.g. 0x1::Coin::transfer
   * @param ty_tags TypeTag strings
   * @param args Function arguments
   * @returns TransactionPayload
   */
  buildTransactionPayload(func: string, ty_tags: string[], args: any[]): TransactionPayload {
    const typeTags = ty_tags.map((ty_arg) => new TypeTagParser(ty_arg).parseTypeTag());

    let payload: TransactionPayload;

    if (!this.abiMap.has(func)) {
      throw new Error(`Cannot find function: ${func}`);
    }

    const scriptABI = this.abiMap.get(func);

    if (scriptABI instanceof EntryFunctionABI) {
      const funcABI = scriptABI as EntryFunctionABI;
      // const bcsArgs = TransactionBuilderABI.toBCSArgs(funcABI.args, args);
      const entryFunctionArgs = TransactionBuilderABI.toEntryFunctionArguments(funcABI.args, args);
      payload = new TransactionPayloadEntryFunction(
        new EntryFunction(funcABI.module_name, new Identifier(funcABI.name), typeTags, entryFunctionArgs),
      );
    } else if (scriptABI instanceof TransactionScriptABI) {
      const funcABI = scriptABI as TransactionScriptABI;
      const scriptArgs = TransactionBuilderABI.toTransactionArguments(funcABI.args, args);

      payload = new TransactionPayloadScript(new Script(funcABI.code, typeTags, scriptArgs));
    } else {
      /* istanbul ignore next */
      throw new Error("Unknown ABI format.");
    }

    return payload;
  }

  /**
   * Builds a RawTransaction
   * @param func Fully qualified func names, e.g. 0x1::Coin::transfer
   * @param ty_tags TypeTag strings.
   * @example Below are valid value examples
   * ```
   * // Structs are in format `AccountAddress::ModuleName::StructName`
   * 0x1::eth::ETH
   * // Vectors are in format `vector<other_tag_string>`
   * vector<0x1::eth::ETH>
   * bool
   * u8
   * u16
   * u32
   * u64
   * u128
   * u256
   * address
   * ```
   * @param args Function arguments
   * @returns RawTransaction
   */
  build(func: string, ty_tags: string[], args: any[]): RawTransaction {
    const { sender, sequenceNumber, gasUnitPrice, maxGasAmount, expSecFromNow, chainId } = this.builderConfig;

    if (!gasUnitPrice) {
      throw new Error("No gasUnitPrice provided.");
    }

    const senderAccount = sender instanceof AccountAddress ? sender : AccountAddress.fromHex(sender!);
    const expTimestampSec = BigInt(Math.floor(Date.now() / 1000) + Number(expSecFromNow));
    const payload = this.buildTransactionPayload(func, ty_tags, args);

    if (payload) {
      return new RawTransaction(
        senderAccount,
        BigInt(sequenceNumber!),
        payload,
        BigInt(maxGasAmount!),
        BigInt(gasUnitPrice!),
        expTimestampSec,
        new ChainId(BigInt(Number(chainId))),
      );
    }

    throw new Error("Invalid ABI.");
  }
}

export type RemoteABIBuilderConfig = Partial<Omit<ABIBuilderConfig, "sender">> & {
  sender: MaybeHexString | AccountAddress;
};

interface MoveupClientInterface {
  getAccountModules: (accountAddress: MaybeHexString) => Promise<Gen.MoveModuleBytecode[]>;
  getAccount: (accountAddress: MaybeHexString) => Promise<Gen.AccountData>;
  getChainId: () => Promise<number>;
  estimateGasPrice: () => Promise<Gen.GasEstimation>;
}

/**
 * This transaction builder downloads JSON ABIs from the fullnodes.
 * It then translates the JSON ABIs to the format that is accepted by TransactionBuilderABI
 */
export class TransactionBuilderRemoteABI {
  // We don't want the builder to depend on the actual MoveupClient. There might be circular dependencies.
  constructor(
    private readonly moveupClient: MoveupClientInterface,
    private readonly builderConfig: RemoteABIBuilderConfig,
  ) {}

  // Cache for 10 minutes
  @MemoizeExpiring(10 * 60 * 1000)
  async fetchABI(addr: string) {
    const modules = await this.moveupClient.getAccountModules(addr);
    const abis = modules
      .map((module) => module.abi)
      .flatMap((abi) =>
        abi!.exposed_functions
          .filter((ef) => ef.is_entry)
          .map(
            (ef) =>
              ({
                fullName: `${abi!.address}::${abi!.name}::${ef.name}`,
                ...ef,
              } as Gen.MoveFunction & { fullName: string }),
          ),
      );

    const abiMap = new Map<string, Gen.MoveFunction & { fullName: string }>();
    abis.forEach((abi) => {
      abiMap.set(abi.fullName, abi);
    });

    return abiMap;
  }

  /**
   * Builds a raw transaction. Only support script function a.k.a entry function payloads
   *
   * @param func fully qualified function name in format <address>::<module>::<function>, e.g. 0x1::coins::transfer
   * @param ty_tags
   * @param args
   * @returns RawTransaction
   */
  async build(func: Gen.EntryFunctionId, ty_tags: Gen.MoveType[], args: any[]): Promise<RawTransaction> {
    /* eslint no-param-reassign: ["off"] */
    const normlize = (s: string) => s.replace(/^0[xX]0*/g, "0x");
    func = normlize(func);
    const funcNameParts = func.split("::");
    if (funcNameParts.length !== 3) {
      throw new Error(
        // eslint-disable-next-line max-len
        "'func' needs to be a fully qualified function name in format <address>::<module>::<function>, e.g. 0x1::coins::transfer",
      );
    }

    const [addr, module] = func.split("::");

    // Downloads the JSON abi
    const abiMap = await this.fetchABI(addr);
    if (!abiMap.has(func)) {
      throw new Error(`${func} doesn't exist.`);
    }

    const funcAbi = abiMap.get(func);

    // Remove all `signer` and `&signer` from argument list because the Move VM injects those arguments. Clients do not
    // need to care about those args. `signer` and `&signer` are required be in the front of the argument list. But we
    // just loop through all arguments and filter out `signer` and `&signer`.
    const abiArgs = funcAbi!.params.filter((param) => param !== "signer" && param !== "&signer");

    // Convert abi string arguments to TypeArgumentABI
    const typeArgABIs = abiArgs.map(
      (abiArg, i) => new ArgumentABI(`var${i}`, new TypeTagParser(abiArg, ty_tags).parseTypeTag()),
    );

    const entryFunctionABI = new EntryFunctionABI(
      funcAbi!.name,
      ModuleId.fromStr(`${addr}::${module}`),
      "", // Doc string
      funcAbi!.generic_type_params.map((_, i) => new TypeArgumentABI(`${i}`)),
      typeArgABIs,
    );

    const { sender, ...rest } = this.builderConfig;

    const senderAddress = sender instanceof AccountAddress ? HexString.fromUint8Array(sender.address) : sender;

    const [{ sequence_number: sequenceNumber }, chainId, { gas_estimate: gasUnitPrice }] = await Promise.all([
      rest?.sequenceNumber
        ? Promise.resolve({ sequence_number: rest?.sequenceNumber })
        : this.moveupClient.getAccount(senderAddress),
      rest?.chainId ? Promise.resolve(rest?.chainId) : this.moveupClient.getChainId(),
      rest?.gasUnitPrice ? Promise.resolve({ gas_estimate: rest?.gasUnitPrice }) : this.moveupClient.estimateGasPrice(),
    ]);

    const builderABI = new TransactionBuilderABI([bcsToBytes(entryFunctionABI)], {
      sender,
      sequenceNumber,
      chainId,
      gasUnitPrice: BigInt(gasUnitPrice),
      ...rest,
    });

    return builderABI.build(func, ty_tags, args);
  }
}
