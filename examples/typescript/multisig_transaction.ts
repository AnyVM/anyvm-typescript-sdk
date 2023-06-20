/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

import { MoveupClient, MoveupAccount, FaucetClient, BCS, TransactionBuilderMultiSecp256k1, TxnBuilderTypes, HexString } from "@anyvm/moveup-sdk";
import { moveupCoinStore } from "./common";
import assert from "assert";

const NODE_URL = process.env.MOVEUP_NODE_URL || "https://fullnode.devnet.moveuplabs.com";
const FAUCET_URL = process.env.MOVEUP_FAUCET_URL || "https://faucet.devnet.moveuplabs.com";

/**
 * This code example demonstrates the process of moving test coins from one multisig
 * account to a single signature account.
 */
(async () => {
  const client = new MoveupClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Genereate 3 key pairs and account instances
  const account1 = new MoveupAccount();
  const account2 = new MoveupAccount();
  const account3 = new MoveupAccount();

  // Create a 2 out of 3 MultiEd25519PublicKey. '2 out of 3' means for a multisig transaction
  // to be executed, at least 2 accounts must have signed the transaction.
  // See https://MoveupLabs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.MultiEd25519PublicKey.html#constructor
  const multiSigPublicKey = new TxnBuilderTypes.MultiSecp256k1PublicKey(
    [
      new TxnBuilderTypes.Secp256k1PublicKey(new HexString(account1.signingKey.getPublic('hex')).toUint8Array()),
      new TxnBuilderTypes.Secp256k1PublicKey(new HexString(account2.signingKey.getPublic('hex')).toUint8Array()),
      new TxnBuilderTypes.Secp256k1PublicKey(new HexString(account3.signingKey.getPublic('hex')).toUint8Array()),
    ],
    // Threshold
    2,
  );

  // Each Moveup account stores an auth key. Initial account address can be derived from auth key.
  // See https://moveup.dev/concepts/accounts for more details.
  const authKey = TxnBuilderTypes.AuthenticationKey.fromMultiSecp256k1PublicKey(multiSigPublicKey);

  // Derive the multisig account address and fund the address with 5000 ETH.
  const mutisigAccountAddress = authKey.derivedAddress();
  await faucetClient.fundAccount(mutisigAccountAddress, 100_000_000);

  let resources = await client.getAccountResources(mutisigAccountAddress);
  let accountResource = resources.find((r) => r.type === moveupCoinStore);
  let balance = parseInt((accountResource?.data as any).coin.value);
  assert(balance === 100_000_000);
  console.log(`multisig account coins: ${balance}. Should be 100000000!`);

  const account4 = new MoveupAccount();
  // Creates a receiver account and fund the account with 0 ETH
  await faucetClient.fundAccount(account4.address(), 0);
  resources = await client.getAccountResources(account4.address());
  accountResource = resources.find((r) => r.type === moveupCoinStore);
  balance = parseInt((accountResource?.data as any).coin.value);
  assert(balance === 0);
  console.log(`account4 coins: ${balance}. Should be 0!`);

  const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString("0x1::eth::ETH"));

  // TS SDK support 3 types of transaction payloads: `EntryFunction`, `Script` and `Module`.
  // See https://MoveupLabs.github.io/ts-sdk-doc/ for the details.
  const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      // Fully qualified module name, `AccountAddress::ModuleName`
      "0x1::coin",
      // Module function
      "transfer",
      // The coin type to transfer
      [token],
      // Arguments for function `transfer`: receiver account address and amount to transfer
      [BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(account4.address())), BCS.bcsSerializeUint64(123)],
    ),
  );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(mutisigAccountAddress),
    client.getChainId(),
  ]);

  // See class definiton here
  // https://MoveupLabs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.RawTransaction.html#constructor.
  const rawTxn = new TxnBuilderTypes.RawTransaction(
    // Transaction sender account address
    TxnBuilderTypes.AccountAddress.fromHex(mutisigAccountAddress),
    BigInt(sequenceNumber),
    entryFunctionPayload,
    // Max gas unit to spend
    BigInt(10000),
    // Gas price per unit
    BigInt(100),
    // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );

  // account1 and account3 sign the transaction
  const txnBuilder = new TransactionBuilderMultiSecp256k1((signingMessage: TxnBuilderTypes.SigningMessage) => {
    const sigHexStr1 = account1.signBuffer(signingMessage);
    const sigHexStr3 = account3.signBuffer(signingMessage);

    // Bitmap masks which public key has signed transaction.
    // See https://MoveupLabs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.MultiEd25519Signature.html#createBitmap
    const bitmap = TxnBuilderTypes.MultiSecp256k1Signature.createBitmap([0, 2]);

    // See https://MoveupLabs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.MultiEd25519Signature.html#constructor
    const muliEd25519Sig = new TxnBuilderTypes.MultiSecp256k1Signature(
      [
        new TxnBuilderTypes.Secp256k1Signature(sigHexStr1.toUint8Array()),
        new TxnBuilderTypes.Secp256k1Signature(sigHexStr3.toUint8Array()),
      ],
      bitmap,
    );

    return muliEd25519Sig;
  }, multiSigPublicKey);

  const bcsTxn = txnBuilder.sign(rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  await client.waitForTransaction(transactionRes.hash);

  resources = await client.getAccountResources(mutisigAccountAddress);
  accountResource = resources.find((r) => r.type === moveupCoinStore);
  balance = parseInt((accountResource?.data as any).coin.value);
  console.log(`multisig account coins: ${balance}.`);

  resources = await client.getAccountResources(account4.address());
  accountResource = resources.find((r) => r.type === moveupCoinStore);
  balance = parseInt((accountResource?.data as any).coin.value);
  assert(balance === 123);
  console.log(`account4 coins: ${balance}. Should be 123!`);
})();
