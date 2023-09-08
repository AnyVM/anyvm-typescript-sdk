// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { MoveupClient } from "../../providers/moveup_client";
import * as Gen from "../../generated/index";
import { MoveupAccount } from "../../account/moveup_account";
import {
  TxnBuilderTypes,
  TransactionBuilderMultiSecp256k1,
  TransactionBuilderRemoteABI,
} from "../../transaction_builder";
import { HexString } from "../../utils";
import { getFaucetClient, longTestTimeout, NODE_URL, PROVIDER_LOCAL_NETWORK_CONFIG } from "../unit/test_helper.test";
import { bcsSerializeU128, bcsToBytes } from "../../bcs";
import { AccountAddress, Secp256k1PublicKey, stringStructTag, TransactionArgumentAddress, TransactionArgumentBool, TransactionArgumentU8, TransactionArgumentU8Vector, TypeTagStruct } from "../../moveup_types";
import { Provider } from "../../providers";
import { BCS } from "../..";
import { VERSION } from "../../version";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { EntryFunctionArgumentAddress, EntryFunctionArgumentU128 } from "../../moveup_types/transaction";

const account = "0x1::account::Account";

const moveupCoin = "0x1::coin::CoinStore<0x1::eth::ETH>";

const coinTransferFunction = "0x1::coin::transfer";

test("call should include x-moveup-client header", async () => {
  const client = new MoveupClient(NODE_URL, { HEADERS: { my: "header" } });
  const heders = client.client.request.config.HEADERS;
  expect(heders).toHaveProperty("x-moveup-client", `moveup-ts-sdk/${VERSION}`);
  expect(heders).toHaveProperty("my", "header");
});

test("node url empty", () => {
  expect(() => {
    const client = new MoveupClient("");
    client.getAccount("0x1");
  }).toThrow("Node URL cannot be empty.");
});

test("gets genesis account", async () => {
  const client = new MoveupClient(NODE_URL);
  const genesisAccount = await client.getAccount("0x1");
  expect(genesisAccount.authentication_key.length).toBe(66);
  expect(genesisAccount.sequence_number).not.toBeNull();
});

test("gets transactions", async () => {
  const client = new MoveupClient(NODE_URL);
  const transactions = await client.getTransactions();
  expect(transactions.length).toBeGreaterThan(0);
});

test("gets genesis resources", async () => {
  const client = new MoveupClient(NODE_URL);
  const resources = await client.getAccountResources("0x1");
  const accountResource = resources.find((r) => r.type === account);
  expect(accountResource).toBeDefined();
});

test("gets the Account resource", async () => {
  const client = new MoveupClient(NODE_URL);
  const accountResource = await client.getAccountResource("0x1", account);
  expect(accountResource).toBeDefined();
});

test("gets ledger info", async () => {
  const client = new MoveupClient(NODE_URL);
  const ledgerInfo = await client.getLedgerInfo();
  expect(BigInt(ledgerInfo.chain_id)).toBeGreaterThan(1);
  expect(parseInt(ledgerInfo.ledger_version, 10)).toBeGreaterThan(0);
});

test("gets account modules", async () => {
  const client = new MoveupClient(NODE_URL);
  const modules = await client.getAccountModules("0x1");
  const module = modules.find((r) => r.abi!.name === "eth");
  expect(module!.abi!.address).toBe("0x1");
});

test("gets the ETH module", async () => {
  const client = new MoveupClient(NODE_URL);
  const module = await client.getAccountModule("0x1", "eth");
  expect(module!.abi!.address).toBe("0x1");
});
/*
test(
  "submits bcs transaction script",
  async () => {
    const client = new MoveupClient(NODE_URL);
    const faucetClient = getFaucetClient();

    const account1 = new MoveupAccount();
    await faucetClient.fundAccount(account1.address(), 1000000000000000000);
    let resources = await client.getAccountResources(account1.address());
    let accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("1000000000000000000");

    // const account2 = new MoveupAccount(hexToBytes("5b23822d164aef6b5b617646b14c02aa892fad10787bff10134829f61ae832ba"));
    const account2 = new MoveupAccount();
    await faucetClient.fundAccount(account2.address(), 0);
    resources = await client.getAccountResources(account2.address());
    accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("0");
    
    const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString("0x1::eth::ETH"));

    const argU8 = new TransactionArgumentU8(2);
    const argAddress = new TransactionArgumentAddress(AccountAddress.fromHex("0x01"));
    const argBool = new TransactionArgumentBool(false);
    const argU8Vec = new TransactionArgumentU8Vector(bcsSerializeU128(1));
    
    const scriptPayload = new TxnBuilderTypes.TransactionPayloadScript(
      new TxnBuilderTypes.Script(
        hexToBytes("a11ceb0b030000000105000100000000050601000000000000000600000000000000001a0102"),
        [token],
        [argU8, argAddress, argBool, argU8Vec],
      ),
    );

    const rawTxn = await client.generateRawTransaction(account1.address(), scriptPayload);
    const bcsTxn = MoveupClient.generateBCSTransaction(account1, rawTxn);
    const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

    await client.waitForTransaction(transactionRes.hash);

  },
  longTestTimeout,
);
*/
test(
  "submits bcs transaction",
  async () => {
    const client = new MoveupClient(NODE_URL);
    const faucetClient = getFaucetClient();

    const account1 = new MoveupAccount();
    await faucetClient.fundAccount(account1.address(), 1000000000000000000);
    let resources = await client.getAccountResources(account1.address());
    let accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("1000000000000000000");

    const account2 = new MoveupAccount();
    await faucetClient.fundAccount(account2.address(), 0);
    resources = await client.getAccountResources(account2.address());
    accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("0");
    
    const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString("0x1::eth::ETH"));
    const argU128 = new EntryFunctionArgumentU128(BigInt(717));
    const argAddress = new EntryFunctionArgumentAddress(AccountAddress.fromHex(account2.address()));

    const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "0x1::coin",
        "transfer",
        [token],
        [argAddress, argU128],
      ),
    );

    const rawTxn = await client.generateRawTransaction(account1.address(), entryFunctionPayload);
    const bcsTxn = MoveupClient.generateBCSTransaction(account1, rawTxn);
    const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

    await client.waitForTransaction(transactionRes.hash);

    resources = await client.getAccountResources(account2.address());
    accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("717");
  },
  longTestTimeout,
);

/*
test(
  "submits generic type bcs transaction",
  async () => {
    const provider = new Provider(PROVIDER_LOCAL_NETWORK_CONFIG);
    const moveupToken = new MoveupToken(provider);
    const account1 = new MoveupAccount();
    const faucetClient = getFaucetClient();

    await faucetClient.fundAccount(account1.address(), 1000000000000000000);
    let resources = await provider.getAccountResources(account1.address());
    let accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("1000000000000000000");

    let tokenAddress = "";

    await provider.waitForTransaction(
      await moveupToken.createCollection(account1, "Collection description", "Collection Name", "https://moveup.dev", 5, {
        royaltyNumerator: 10,
        royaltyDenominator: 10,
      }),
    );
    const txn = await provider.waitForTransactionWithResult(
      await moveupToken.mint(
        account1,
        "Collection Name",
        "Token Description",
        "Token Name",
        "https://moveup.dev/img/nyan.jpeg",
        ["key"],
        ["bool"],
        ["true"],
      ),
      { checkSuccess: true },
    );
    tokenAddress = (txn as Gen.UserTransaction).events[0].data.token;

    const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString("0x4::token::Token"));
    const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "0x4::moveup_token",
        "add_typed_property",
        [token, new TypeTagStruct(stringStructTag)],
        [
          BCS.bcsToBytes(AccountAddress.fromHex(tokenAddress)),
          BCS.bcsSerializeStr("bcsKey"),
          BCS.bcsSerializeStr("bcs value"),
        ],
      ),
    );
    const rawTxn = await provider.generateRawTransaction(account1.address(), entryFunctionPayload);
    const bcsTxn = MoveupClient.generateBCSTransaction(account1, rawTxn);
    const transactionRes = await provider.submitSignedBCSTransaction(bcsTxn);
    await provider.waitForTransaction(transactionRes.hash, { checkSuccess: true });
  },
  longTestTimeout,
);
*/

test(
  "submits transaction with remote ABI",
  async () => {
    const client = new MoveupClient(NODE_URL);
    const faucetClient = getFaucetClient();

    const account1 = new MoveupAccount();
    await faucetClient.fundAccount(account1.address(), 1000000000000000000);
    let resources = await client.getAccountResources(account1.address());
    let accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("1000000000000000000");

    const account2 = new MoveupAccount();
    await faucetClient.fundAccount(account2.address(), 0);
    resources = await client.getAccountResources(account2.address());
    accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("0");

    const builder = new TransactionBuilderRemoteABI(client, { sender: account1.address() });
    const rawTxn = await builder.build(
      "0x1::coin::transfer",
      ["0x1::eth::ETH"],
      [account2.address(), 400],
    );

    const bcsTxn = MoveupClient.generateBCSTransaction(account1, rawTxn);
    const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

    await client.waitForTransaction(transactionRes.hash);

    resources = await client.getAccountResources(account2.address());
    accountResource = resources.find((r) => r.type === moveupCoin);
    expect((accountResource!.data as any).coin.value).toBe("400");
  },
  longTestTimeout,
);
