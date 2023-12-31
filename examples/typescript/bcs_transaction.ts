/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

import { MoveupClient, MoveupAccount, FaucetClient, BCS, TxnBuilderTypes } from "@anyvm/moveup-sdk";
import { moveupCoinStore } from "./common";
import assert from "assert";

const NODE_URL = process.env.MOVEUP_NODE_URL;
const FAUCET_URL = process.env.MOVEUP_FAUCET_URL;

const {
  AccountAddress,
  TypeTagStruct,
  EntryFunction,
  StructTag,
  TransactionPayloadEntryFunction,
  RawTransaction,
  ChainId,
  EntryFunctionArgumentAddress,
  EntryFunctionArgumentU128,
} = TxnBuilderTypes;

/**
 * This code example demonstrates the process of moving test coins from one account to another.
 */
(async () => {
  const client = new MoveupClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Generates key pair for a new account
  const account1 = new MoveupAccount();
  await faucetClient.fundAccount(account1.address(), 1_000_000_000_000_000_000);
  let resources = await client.getAccountResources(account1.address());
  let accountResource = resources.find((r) => r.type === moveupCoinStore);
  let balance = parseInt((accountResource?.data as any).coin.value);
  assert(balance === 1_000_000_000_000_000_000);
  console.log(`account1 coins: ${balance}. Should be 1000000000000000000!`);

  const account2 = new MoveupAccount();
  // Creates the second account and fund the account with 0 ETH
  await faucetClient.fundAccount(account2.address(), 0);
  resources = await client.getAccountResources(account2.address());
  accountResource = resources.find((r) => r.type === moveupCoinStore);
  balance = parseInt((accountResource?.data as any).coin.value);
  assert(balance === 0);
  console.log(`account2 coins: ${balance}. Should be 0!`);

  const token = new TypeTagStruct(StructTag.fromString("0x1::eth::ETH"));

  // TS SDK support 3 types of transaction payloads: `EntryFunction`, `Script` and `Module`.
  const entryFunctionPayload = new TransactionPayloadEntryFunction(
    EntryFunction.natural(
      // Fully qualified module name, `AccountAddress::ModuleName`
      "0x1::coin",
      // Module function
      "transfer",
      // The coin type to transfer
      [token],
      // Arguments for function `transfer`: receiver account address and amount to transfer
      [new EntryFunctionArgumentAddress(AccountAddress.fromHex(account2.address())), new EntryFunctionArgumentU128(BigInt(717))],
    ),
  );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(account1.address()),
    client.getChainId(),
  ]);

  // See class definiton here
  const rawTxn = new RawTransaction(
    // Transaction sender account address
    AccountAddress.fromHex(account1.address()),
    BigInt(sequenceNumber),
    entryFunctionPayload,
    // Max gas unit to spend
    BigInt(20000),
    // Gas price per unit
    BigInt(1000000000),
    // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new ChainId(BigInt(chainId)),
  );

  // Sign the raw transaction with account1's private key
  const bcsTxn = MoveupClient.generateBCSTransaction(account1, rawTxn);

  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  await client.waitForTransaction(transactionRes.hash);

  resources = await client.getAccountResources(account2.address());
  accountResource = resources.find((r) => r.type === moveupCoinStore);
  balance = parseInt((accountResource?.data as any).coin.value);
  assert(balance === 717);
  console.log(`account2 coins: ${balance}. Should be 717!`);
})();
