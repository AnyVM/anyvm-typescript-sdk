/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

import {
  MoveupClient,
  MoveupAccount,
  FaucetClient,
  BCS,
  TxnBuilderTypes,
  HexString,
  OptionalTransactionArgs
} from "@anyvm/moveup-sdk";

import * as fs from "fs";
import {hexToBytes} from "@noble/hashes/utils";
import path from "path";

const NODE_URL = process.env.MOVEUP_NODE_URL;
const FAUCET_URL = process.env.MOVEUP_FAUCET_URL;
const ADMIN_PRIVATE_KEY = process.env.MOVEUP_ADMIN_PRIVATE_KEY;

const {
  EntryFunction,
  TransactionPayloadEntryFunction,
} = TxnBuilderTypes;

const client = new MoveupClient(NODE_URL);

/**
 * This code example demonstrates the process of publish and initialize a coin to coin manager and register mapping to L1 token.
 */
(async () => {
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  const modulePath = "../../../../../moveup-move/move-examples/sun_coin";
  const account = new MoveupAccount(hexToBytes(ADMIN_PRIVATE_KEY));
  await faucetClient.fundAccount(account.address(), 1_000_000_000_000_000_000);
  const packageMetadata =fs.readFileSync(path.join(modulePath, "build", "SunCoin", "package-metadata.bcs"));
  const moduleData = fs.readFileSync(path.join(modulePath, "build", "SunCoin", "bytecode_modules", "sun_coin.mv"));
  console.log("Publishing SunCoin package.");
  let txnHash1 = await publishCoin(
    account,
    new HexString(packageMetadata.toString("hex")).toUint8Array(),
    [new TxnBuilderTypes.Module(new HexString(moduleData.toString("hex")).toUint8Array())]
  );
  await client.waitForTransaction(txnHash1, { checkSuccess: true });
  let txnHash2 = await initializeCoin(
    account,
    "sun",
    "SUN",
    18,
    true
  );
  await client.waitForTransaction(txnHash2, { checkSuccess: true });
  let txnHash3 = await register(
    account,
    "0x0000000000000000000000000000000000002222",
    18
  );
  await client.waitForTransaction(txnHash3, { checkSuccess: true });
  console.log("Publish succeed.");
})();

async function publishCoin(sender: MoveupAccount, packageMetadata: BCS.Bytes, modules: BCS.Seq<TxnBuilderTypes.Module>, extraArgs?: OptionalTransactionArgs) {
  const codeSerializer = new BCS.Serializer();
  BCS.serializeVector(modules, codeSerializer);
  const payload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      "0x1::coin_manager",
      "publish_package_to_framework",
      [],
      [
        BCS.bcsSerializeBytes(packageMetadata),
        codeSerializer.getBytes()
      ]
    )
  );
  return client.generateSignSubmitTransaction(sender, payload, extraArgs);
}

async function initializeCoin(sender: MoveupAccount, name: string, symbol: string, decimals: number, monitorSupply: boolean, extraArgs?: OptionalTransactionArgs) {
  const payload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      "0x1::coin_manager",
      "initialize_coin",
      [new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString("0x1::sun_coin::SunCoin"))],
      [
        BCS.bcsSerializeStr(name),
        BCS.bcsSerializeStr(symbol),
        BCS.bcsSerializeU8(decimals),
        BCS.bcsSerializeBool(monitorSupply),
      ]
    )
  );
  return client.generateSignSubmitTransaction(sender, payload, extraArgs);
}

async function register(sender: MoveupAccount, mapping_token: string, mapping_token_decimals: number, extraArgs?: OptionalTransactionArgs) {
  const payload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      "0x1::coin_manager",
      "register",
      [new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString("0x1::sun_coin::SunCoin"))],
      [
        BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(mapping_token)),
        BCS.bcsSerializeU8(mapping_token_decimals)
      ]
    )
  );
  return client.generateSignSubmitTransaction(sender, payload, extraArgs);
}
