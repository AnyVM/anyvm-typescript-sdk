import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import {
  AnyvmBridgeAbi,
  AnyvmMessengerAbi,
  Lib_AddressManagerAbi,
} from "./abi";
import { MoveupAccount } from "../account/moveup_account";
import { TxnBuilderTypes } from "../transaction_builder";
import {
  EntryFunctionArgumentAddress,
  EntryFunctionArgumentU128,
} from "../moveup_types/transaction";
import { AccountAddress } from "../moveup_types/account_address";
import { HexString } from "./hex_string";
import { MoveupClient } from "../providers/moveup_client";
import axios from "axios";

const NODE_URL = process.env.MOVEUP_NODE_URL!;
const INDEXER_URL = process.env.MOVEUP_INDEXER_URL!;

export async function GetL1TokenWhiteList(
  provider: ethers.providers.Provider
): Promise<string[]> {
  const contractAddress = process.env.Lib_AddressManagerAddress;
  if (!contractAddress) {
    throw new Error(`do not set Lib_AddressManager contract address`);
  }

  const Lib_AddressManagerContract = new ethers.Contract(
    contractAddress as string,
    Lib_AddressManagerAbi,
    provider
  );
  const addresses = Lib_AddressManagerContract.getAllSupportL1TokenAddr();
  return addresses;
}

export async function GetL2TokenWhiteList(
  provider: ethers.providers.Provider
): Promise<string[]> {
  let l1TokenAddrArr: string[] = [];
  await GetL1TokenWhiteList(provider)
    .then((result: string[]) => {
      l1TokenAddrArr = result;
    })
    .catch((error: any) => {
      throw error;
    });

  const contractAddress = process.env.Lib_AddressManagerAddress;
  if (!contractAddress) {
    throw new Error(`do not set Lib_AddressManager contract address`);
  }
  const Lib_AddressManagerContract = new ethers.Contract(
    contractAddress as string,
    Lib_AddressManagerAbi,
    provider
  );

  let l2CoinTypeArr: string[] = [];

  for (let i = 0; i < l1TokenAddrArr.length; i++) {
    await Lib_AddressManagerContract.supportCoinType(l1TokenAddrArr[0])
      .then((result: string) => {
        l2CoinTypeArr.push(result);
      })
      .catch((error: Error) => {
        throw error;
      });
  }

  return l2CoinTypeArr;
}

export async function GetEthBalance(
  provider: ethers.providers.Provider,
  address: string
): Promise<string> {
  const balance = await provider.getBalance(address);
  const formattedBalance = ethers.utils.formatEther(balance);
  return formattedBalance;
}

export async function DepositETHEstimateGas(
  provider: ethers.providers.Provider
): Promise<string> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const gasEstimate = await AnyvmBridgeContract.estimateGas.depositETH();
  const gasPrice = await provider.getGasPrice();

  const gasFee = gasEstimate.mul(gasPrice);
  const formattedGasFee = ethers.utils.formatEther(gasFee);

  return formattedGasFee;
}

export async function DepositETH(
  provider: ethers.providers.Provider,
  from: string,
  value: string
): Promise<any> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const depositTx = await AnyvmBridgeContract.populateTransaction.depositETH();

  const gasPrice = await provider.getGasPrice();
  const nonce = await provider.getTransactionCount(from);
  const chainId = (await provider.getNetwork()).chainId;

  const transaction = {
    to: contractAddress,
    nonce: nonce,
    chainId: chainId,
    data: depositTx.data,
    value: ethers.utils.parseEther(value),
    gasPrice: gasPrice,
    gasLimit: 0,
  };

  const gasLimit = await provider.estimateGas(transaction);
  transaction.gasLimit = gasLimit.toNumber();

  return transaction;
}

export async function DepositETHToEstimateGas(
  provider: ethers.providers.Provider,
  to: string
): Promise<string> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const gasEstimate = await AnyvmBridgeContract.estimateGas.depositETHTo(to);
  const gasPrice = await provider.getGasPrice();

  const gasFee = gasEstimate.mul(gasPrice);
  const formattedGasFee = ethers.utils.formatEther(gasFee);

  return formattedGasFee;
}

export async function DepositETHTo(
  provider: ethers.providers.Provider,
  from: string,
  to: string,
  value: string
): Promise<any> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const depositTx = await AnyvmBridgeContract.populateTransaction.depositETHTo(
    to
  );

  const gasPrice = await provider.getGasPrice();
  const nonce = await provider.getTransactionCount(from);
  const chainId = (await provider.getNetwork()).chainId;

  const transaction = {
    to: contractAddress,
    nonce: nonce,
    chainId: chainId,
    data: depositTx.data,
    value: ethers.utils.parseEther(value),
    gasPrice: gasPrice,
    gasLimit: 0,
  };

  const gasLimit = await provider.estimateGas(transaction);
  transaction.gasLimit = gasLimit.toNumber();

  return transaction;
}

export async function DepositERC20EstimateGas(
  provider: ethers.providers.Provider,
  l1TokenAddress: string,
  value: string
): Promise<string> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const gasEstimate = await AnyvmBridgeContract.estimateGas.depositERC20(
    l1TokenAddress,
    ethers.utils.parseEther(value)
  );
  const gasPrice = await provider.getGasPrice();

  const gasFee = gasEstimate.mul(gasPrice);
  const formattedGasFee = ethers.utils.formatEther(gasFee);

  return formattedGasFee;
}

export async function DepositERC20(
  provider: ethers.providers.Provider,
  from: string,
  l1TokenAddress: string,
  value: string
): Promise<any> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const depositTx = await AnyvmBridgeContract.populateTransaction.depositERC20(
    l1TokenAddress,
    ethers.utils.parseEther(value)
  );

  const gasPrice = await provider.getGasPrice();
  const nonce = await provider.getTransactionCount(from);
  const chainId = (await provider.getNetwork()).chainId;

  const transaction = {
    to: contractAddress,
    nonce: nonce,
    chainId: chainId,
    data: depositTx.data,
    gasPrice: gasPrice,
    gasLimit: 0,
  };

  const gasLimit = await provider.estimateGas(transaction);
  transaction.gasLimit = gasLimit.toNumber();

  return transaction;
}

export async function DepositERC20ToEstimateGas(
  provider: ethers.providers.Provider,
  to: string,
  l1TokenAddress: string,
  value: string
): Promise<string> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const gasEstimate = await AnyvmBridgeContract.estimateGas.depositERC20To(
    l1TokenAddress,
    to,
    ethers.utils.parseEther(value)
  );
  const gasPrice = await provider.getGasPrice();

  const gasFee = gasEstimate.mul(gasPrice);
  const formattedGasFee = ethers.utils.formatEther(gasFee);

  return formattedGasFee;
}

export async function DepositERC20To(
  provider: ethers.providers.Provider,
  from: string,
  to: string,
  l1TokenAddress: string,
  value: string
): Promise<any> {
  const contractAddress = process.env.AnyvmBridgeAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmBridge contract address`);
  }
  const AnyvmBridgeContract = new ethers.Contract(
    contractAddress as string,
    AnyvmBridgeAbi,
    provider
  );

  const depositTx =
    await AnyvmBridgeContract.populateTransaction.depositERC20To(
      l1TokenAddress,
      to,
      ethers.utils.parseEther(value)
    );

  const gasPrice = await provider.getGasPrice();
  const nonce = await provider.getTransactionCount(from);
  const chainId = (await provider.getNetwork()).chainId;

  const transaction = {
    to: contractAddress,
    nonce: nonce,
    chainId: chainId,
    data: depositTx.data,
    gasPrice: gasPrice,
    gasLimit: 0,
  };

  const gasLimit = await provider.estimateGas(transaction);
  transaction.gasLimit = gasLimit.toNumber();

  return transaction;
}

export async function WithdrawTokenEstimateGas(
  coinType: string,
  accountFrom: MoveupAccount,
  dest: string,
  amount: bigint
): Promise<string> {
  const client = new MoveupClient(NODE_URL);
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString(coinType)
  );

  const entryFunctionPayload =
    new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "0x1::bridge",
        "burn",
        [token],
        [
          new EntryFunctionArgumentAddress(
            AccountAddress.fromHex(new HexString(dest).toShortString())
          ),
          new EntryFunctionArgumentU128(amount),
        ]
      )
    );

  const rawTxn = await client.generateRawTransaction(
    accountFrom.address(),
    entryFunctionPayload
  );
  const estimateTx = await client.simulateTransaction(accountFrom, rawTxn);
  const gasPriceRes = await client.estimateGasPrice();

  const gasUsedBN = ethers.BigNumber.from(estimateTx[0].gas_used);
  const gasPriceBN = ethers.BigNumber.from(gasPriceRes.gas_estimate.toString());
  const gasFeeBN = gasUsedBN.mul(gasPriceBN);
  const L2Decimals = process.env.L2Decimals;
  const formattedGasFee = ethers.utils.formatUnits(gasFeeBN, L2Decimals);

  return formattedGasFee;
}

export async function WithdrawToken(
  coinType: string,
  accountFrom: MoveupAccount,
  dest: string,
  amount: bigint
) {
  const client = new MoveupClient(NODE_URL);
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString(coinType)
  );

  const entryFunctionPayload =
    new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "0x1::bridge",
        "burn",
        [token],
        [
          new EntryFunctionArgumentAddress(
            AccountAddress.fromHex(new HexString(dest).toShortString())
          ),
          new EntryFunctionArgumentU128(amount),
        ]
      )
    );

  const rawTxn = await client.generateRawTransaction(
    accountFrom.address(),
    entryFunctionPayload
  );
  const bcsTxn = MoveupClient.generateBCSTransaction(accountFrom, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  await client.waitForTransaction(transactionRes.hash, { checkSuccess: true });
}

export async function RelayMessage(
  provider: ethers.providers.Provider,
  from: string,
  index: string,
  version: string,
  sequenceNumber: string
): Promise<any> {
  interface ChainBatchHeader {
    batchIndex: bigint;
    batchRoot: string;
    batchSize: bigint;
    prevLastL2BlockIndex: bigint;
    extraData: string;
  }

  interface ChainInclusionProof {
    index: bigint;
    siblings: string[];
  }

  interface AnyvmTxProof {
    prefixData: string;
    rawEventData: string;
    eventSiblings: string[];
    eventIndex: bigint;
    totalEventLeaves: bigint;
    siblings: string[];
    index: bigint;
    totalLeaves: bigint;
  }

  interface L2MessageInclusionProof {
    stateRoot: string;
    stateRootBatchHeader: ChainBatchHeader;
    stateRootProof: ChainInclusionProof;
    anyvmTxProof: AnyvmTxProof;
  }

  let l2MessageInclusionProof: L2MessageInclusionProof;
  let stateRoot: string;
  let stateRootBatchHeader: ChainBatchHeader;
  let stateRootProof: ChainInclusionProof;
  let anyvmTxProof: AnyvmTxProof;

  const response = await axios.get(
    `${INDEXER_URL}/messageproof/index/${index}`
  );

  if (response.status === 200) {
    if (response.data) {
      stateRoot = response.data.stateRoot;
      stateRootBatchHeader = response.data.stateRootBatchHeader;
      stateRootProof = response.data.stateRootProof;
    } else {
      return null;
    }
  } else {
    return null;
  }

  const anyvmTxProofResponse = await axios.get(
    `${NODE_URL}/proofs/event_proof/version/${version}/sequence_number/${sequenceNumber}`
  );

  if (anyvmTxProofResponse.status === 200) {
    if (anyvmTxProofResponse.data) {
      const anyvmTxProofPrefixData = new HexString(
        anyvmTxProofResponse.data.prefix_data
      ).toString();
      const anyvmTxProofRawEventData = new HexString(
        anyvmTxProofResponse.data.raw_event_data
      ).toString();
      let anyvmTxProofEventSiblings: string[] = [];
      anyvmTxProofEventSiblings = anyvmTxProofResponse.data.event_siblings.map(
        (sibling: any) => new HexString(sibling).toString()
      );
      let anyvmTxProofSiblings: string[] = [];
      anyvmTxProofSiblings = anyvmTxProofResponse.data.siblings.map(
        (sibling: any) => new HexString(sibling).toString()
      );
      anyvmTxProof = {
        prefixData: anyvmTxProofPrefixData,
        rawEventData: anyvmTxProofRawEventData,
        eventSiblings: anyvmTxProofEventSiblings,
        eventIndex: anyvmTxProofResponse.data.event_index,
        totalEventLeaves: anyvmTxProofResponse.data.total_event_leaves,
        siblings: anyvmTxProofSiblings,
        index: anyvmTxProofResponse.data.index,
        totalLeaves: anyvmTxProofResponse.data.total_leaves,
      };
    } else {
      return null;
    }
  } else {
    return null;
  }

  l2MessageInclusionProof = {
    stateRoot: stateRoot,
    stateRootBatchHeader: stateRootBatchHeader,
    stateRootProof: stateRootProof,
    anyvmTxProof: anyvmTxProof,
  };

  const contractAddress = process.env.AnyvmMessengerAddress;
  if (!contractAddress) {
    throw new Error(`do not set AnyvmMessenger contract address`);
  }
  const AnyvmMessengerContract = new ethers.Contract(
    contractAddress as string,
    AnyvmMessengerAbi,
    provider
  );

  const depositTx =
    await AnyvmMessengerContract.populateTransaction.relayMessage(
      l2MessageInclusionProof
    );

  const gasPrice = await provider.getGasPrice();
  const nonce = await provider.getTransactionCount(from);
  const chainId = (await provider.getNetwork()).chainId;

  const transaction = {
    to: contractAddress,
    nonce: nonce,
    chainId: chainId,
    data: depositTx.data,
    gasPrice: gasPrice,
    gasLimit: 0,
  };

  const gasLimit = await provider.estimateGas(transaction);
  transaction.gasLimit = gasLimit.toNumber();

  return transaction;
}
