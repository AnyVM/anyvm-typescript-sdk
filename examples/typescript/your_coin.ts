// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import assert from "assert";
import fs from "fs";
import path from "path";
import { NODE_URL, FAUCET_URL } from "./common";
import { MoveupAccount, MoveupClient, TxnBuilderTypes, MaybeHexString, HexString, FaucetClient } from "@anyvm/moveup-sdk";
/**
  This example depends on the MoonCoin.move module having already been published to the destination blockchain.

  One method to do so is to use the CLI:
      * Acquire the Moveup CLI, see https://moveup.dev/cli-tools/moveup-cli-tool/install-moveup-cli
      * `pnpm your_coin ~/moveup-core/moveup-move/move-examples/moon_coin`.
      * Open another terminal and `moveup move compile --package-dir ~/moveup-core/moveup-move/move-examples/moon_coin --save-metadata --named-addresses MoonCoin=<Alice address from above step>`.
      * Return to the first terminal and press enter.
 */

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

class CoinClient extends MoveupClient {
  constructor() {
    super(NODE_URL);
  }

  /** Register the receiver account to receive transfers for the new coin. */
  async registerCoin(coinTypeAddress: HexString, coinReceiver: MoveupAccount): Promise<string> {
    const rawTxn = await this.generateTransaction(coinReceiver.address(), {
      function: "0x1::managed_coin::register",
      type_arguments: [`${coinTypeAddress.hex()}::moon_coin::MoonCoin`],
      arguments: [],
    });

    const bcsTxn = await this.signTransaction(coinReceiver, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

  /** Mints the newly created coin to a specified receiver address */
  async transferCoin(sender: MoveupAccount, receiverAddress: HexString, amount: number | bigint): Promise<string> {
    const rawTxn = await this.generateTransaction(sender.address(), {
      function: "0x1::moveup_account::transfer_coins",
      type_arguments: [`${sender.address()}::moon_coin::MoonCoin`],
      arguments: [receiverAddress.hex(), amount],
    });

    const bcsTxn = await this.signTransaction(sender, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

  /** Mints the newly created coin to a specified receiver address */
  async mintCoin(minter: MoveupAccount, receiverAddress: HexString, amount: number | bigint): Promise<string> {
    const rawTxn = await this.generateTransaction(minter.address(), {
      function: "0x1::managed_coin::mint",
      type_arguments: [`${minter.address()}::moon_coin::MoonCoin`],
      arguments: [receiverAddress.hex(), amount],
    });

    const bcsTxn = await this.signTransaction(minter, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

  /** Return the balance of the newly created coin */
  async getBalance(accountAddress: MaybeHexString, coinTypeAddress: HexString): Promise<string | number> {
    try {
      const resource = await this.getAccountResource(
        accountAddress,
        `0x1::coin::CoinStore<${coinTypeAddress.hex()}::moon_coin::MoonCoin>`,
      );

      return parseInt((resource.data as any)["coin"]["value"]);
    } catch (_) {
      return 0;
    }
  }
}

/** run our demo! */
async function main() {
  assert(process.argv.length == 3, "Expecting an argument that points to the moon_coin directory.");

  const client = new CoinClient();
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Create two accounts, Alice and Bob, and fund Alice but not Bob
  const alice = new MoveupAccount();
  const bob = new MoveupAccount();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.address()}`);
  console.log(`Bob: ${bob.address()}`);

  await faucetClient.fundAccount(alice.address(), 1_000_000_000_000_000_000);
  await faucetClient.fundAccount(bob.address(), 1_000_000_000_000_000_000);

  await new Promise<void>((resolve) => {
    readline.question("Update the module with Alice's address, compile, and press enter.", () => {
      resolve();
      readline.close();
    });
  });

  // :!:>publish
  const modulePath = process.argv[2];
  const packageMetadata = fs.readFileSync(path.join(modulePath, "build", "Examples", "package-metadata.bcs"));
  console.log("packageMetadata is: ", new HexString(packageMetadata.toString("hex")).toString());
  const moduleData = fs.readFileSync(path.join(modulePath, "build", "Examples", "bytecode_modules", "moon_coin.mv"));
  console.log("moduleData is: ", new HexString(moduleData.toString("hex")).toString());

  console.log("Publishing MoonCoin package.");
  let txnHash = await client.publishPackage(alice, new HexString(packageMetadata.toString("hex")).toUint8Array(), [
    new TxnBuilderTypes.Module(new HexString(moduleData.toString("hex")).toUint8Array()),
  ]);
  await client.waitForTransaction(txnHash, { checkSuccess: true }); // <:!:publish

  console.log(`Bob's initial MoonCoin balance: ${await client.getBalance(bob.address(), alice.address())}.`);
  console.log("Alice mints herself some of the new coin.");
  txnHash = await client.registerCoin(alice.address(), alice);
  await client.waitForTransaction(txnHash, { checkSuccess: true });
  txnHash = await client.mintCoin(alice, alice.address(), 100);
  await client.waitForTransaction(txnHash, { checkSuccess: true });

  console.log("Alice transfers the newly minted coins to Bob.");
  txnHash = await client.transferCoin(alice, bob.address(), 100);
  await client.waitForTransaction(txnHash, { checkSuccess: true });
  console.log(`Bob's updated MoonCoin balance: ${await client.getBalance(bob.address(), alice.address())}.`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
