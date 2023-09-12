// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { MoveupAccount, getAddressFromAccountOrAddress } from "../account/moveup_account";
import { MoveupClient, OptionalTransactionArgs } from "../providers/moveup_client";
import { MaybeHexString, MOVEUP_COIN } from "../utils";
import { TransactionBuilderRemoteABI } from "../transaction_builder";
import { bytesToHex } from "@noble/hashes/utils";

/**
 * Class for working with the coin module, such as transferring coins and
 * checking balances.
 */
export class CoinClient {
  moveupClient: MoveupClient;

  /**
   * Creates new CoinClient instance
   * @param moveupClient MoveupClient instance
   */
  constructor(moveupClient: MoveupClient) {
    this.moveupClient = moveupClient;
  }

  /**
   * Generate, sign, and submit a transaction to the moveup blockchain API to
   * transfer coins from one account to another. By default it transfers
   * 0x1::eth::ETH, but you can specify a different coin type
   * with the `coinType` argument.
   *
   * You may set `createReceiverIfMissing` to true if you want to create the
   * receiver account if it does not exist on chain yet. If you do not set
   * this to true, the transaction will fail if the receiver account does not
   * exist on-chain.
   *
   * @param from Account sending the coins
   * @param to Account to receive the coins
   * @param amount Number of coins to transfer
   * @param extraArgs Extra args for building the transaction or configuring how
   * the client should submit and wait for the transaction
   * @returns The hash of the transaction submitted to the API
   */
  // :!:>transfer
  async transfer(
    from: MoveupAccount,
    to: MoveupAccount | MaybeHexString,
    amount: number | bigint,
    extraArgs?: OptionalTransactionArgs & {
      // The coin type to use, defaults to 0x1::eth::ETH
      coinType?: string;
      // If set, create the `receiver` account if it doesn't exist on-chain.
      // This is done by calling `0x1::moveup_account::transfer` instead, which
      // will create the account on-chain first if it doesn't exist before
      // transferring the coins to it.
      // If this is the first time an account has received the specified coinType,
      // and this is set to false, the transaction would fail.
      createReceiverIfMissing?: boolean;
    },
  ): Promise<string> {
    // If none is explicitly given, use 0x1::eth::ETH as the coin type.
    const coinTypeToTransfer = extraArgs?.coinType ?? MOVEUP_COIN;

    // If we should create the receiver account if it doesn't exist on-chain,
    // use the `0x1::moveup_account::transfer` function.
    const func = extraArgs?.createReceiverIfMissing ? "0x1::moveup_account::transfer_coins" : "0x1::coin::transfer";

    // Get the receiver address from the MoveupAccount or MaybeHexString.
    const toAddress = getAddressFromAccountOrAddress(to);

    const builder = new TransactionBuilderRemoteABI(this.moveupClient, { sender: from.address(), ...extraArgs });
    const rawTxn = await builder.build(func, [coinTypeToTransfer], [toAddress, amount]);

    const bcsTxn = MoveupClient.generateBCSTransaction(from, rawTxn);
    const pendingTransaction = await this.moveupClient.submitSignedBCSTransaction(bcsTxn);
    return pendingTransaction.hash;
  } // <:!:transfer

  /**
   * Get the balance of the account. By default it checks the balance of
   * 0x1::eth::ETH, but you can specify a different coin type.
   *
   * @param account Account that you want to get the balance of.
   * @param extraArgs Extra args for checking the balance.
   * @returns Promise that resolves to the balance as a bigint.
   */
  // :!:>checkBalance
  async checkBalance(
    account: MoveupAccount | MaybeHexString,
    extraArgs?: {
      // The coin type to use, defaults to 0x1::eth::ETH
      coinType?: string;
    },
  ): Promise<bigint> {
    const coinType = extraArgs?.coinType ?? MOVEUP_COIN;
    const typeTag = `0x1::coin::CoinStore<${coinType}>`;
    const address = getAddressFromAccountOrAddress(account);
    const accountResource = await this.moveupClient.getAccountResource(address, typeTag);
    return BigInt((accountResource.data as any).coin.value);
  } // <:!:checkBalance
}
