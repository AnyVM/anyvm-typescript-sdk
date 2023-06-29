// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { MoveupClient } from "../../providers/moveup_client";
import { getFaucetClient, longTestTimeout, NODE_URL } from "../unit/test_helper.test";
import { MoveupAccount } from "../../account/moveup_account";
import { CoinClient } from "../../plugins/coin_client";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

test(
  "transfer and checkBalance works",
  async () => {
    const client = new MoveupClient(NODE_URL);
    const faucetClient = getFaucetClient();
    const coinClient = new CoinClient(client);

    const alice = new MoveupAccount();
    const bob = new MoveupAccount();
    await faucetClient.fundAccount(alice.address(), 100_000_000);
    await faucetClient.fundAccount(bob.address(), 0);

    await client.waitForTransaction(await coinClient.transfer(alice, bob, 42), { checkSuccess: true });

    expect(await coinClient.checkBalance(bob)).toBe(BigInt(42));

    // Test that `createReceiverIfMissing` works.
    const jemima = new MoveupAccount();
    await client.waitForTransaction(await coinClient.transfer(alice, jemima, 717, { createReceiverIfMissing: true }), {
      checkSuccess: true,
    });

    // Check that using a string address instead of an account works with `checkBalance`.
    expect(await coinClient.checkBalance(jemima.address().hex())).toBe(BigInt(717));
  },
  longTestTimeout,
);
