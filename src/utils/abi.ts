export const Lib_AddressManagerAbi: any = [
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "string",
              "name": "_name",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "_newAddress",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "_oldAddress",
              "type": "address"
            }
          ],
          "name": "AddressSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "_name",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "_newCoinType",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "_oldCoinType",
              "type": "string"
            }
          ],
          "name": "L2CoinTypeSet",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "OwnershipTransferred",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "name": "coinTypeAddrMap",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_name",
              "type": "string"
            }
          ],
          "name": "getAddress",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getAllSupportL1TokenAddr",
          "outputs": [
            {
              "internalType": "address[]",
              "name": "",
              "type": "address[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "l1TokenAddrArr",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "renounceOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_name",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "_address",
              "type": "address"
            }
          ],
          "name": "setAddress",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_address",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "_l2CoinType",
              "type": "string"
            }
          ],
          "name": "setCoinType",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "supportCoinType",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "transferOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

export const AnyvmBridgeAbi: any = [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "string",
              "name": "_coinType",
              "type": "string"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            }
          ],
          "name": "ERC20DepositInitiated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "_coinType",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_l2TxIndex",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_l2EventIndex",
              "type": "uint256"
            }
          ],
          "name": "ERC20WithdrawalFinalized",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "string",
              "name": "coinType",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            }
          ],
          "name": "ETHDepositInitiated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "_coinType",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_l2TxIndex",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "_l2EventIndex",
              "type": "uint256"
            }
          ],
          "name": "ETHWithdrawalFinalized",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            }
          ],
          "name": "depositERC20",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            }
          ],
          "name": "depositERC20To",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "depositETH",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_to",
              "type": "address"
            }
          ],
          "name": "depositETHTo",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "name": "deposits",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "donateETH",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "_coinType",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "_from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_l2TxIndex",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_l2EventIndex",
              "type": "uint256"
            }
          ],
          "name": "finalizeERC20Withdrawal",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_l1Token",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "_coinType",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "_from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_l2TxIndex",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_l2EventIndex",
              "type": "uint256"
            }
          ],
          "name": "finalizeETHWithdrawal",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_l1messenger",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_l2TokenBridge",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_libAddressManager",
              "type": "address"
            }
          ],
          "name": "initialize",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "l2MovePackageBridge",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "libAddressManager",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "messenger",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "stateMutability": "payable",
          "type": "receive"
        }
      ];

export const AnyvmMessengerAbi: any = [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "msgHash",
              "type": "bytes32"
            }
          ],
          "name": "FailedRelayedMessage",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "version",
              "type": "uint8"
            }
          ],
          "name": "Initialized",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "_xDomainCalldataHash",
              "type": "bytes32"
            }
          ],
          "name": "MessageAllowed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "_xDomainCalldataHash",
              "type": "bytes32"
            }
          ],
          "name": "MessageBlocked",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "OwnershipTransferred",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "Paused",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "msgHash",
              "type": "bytes32"
            }
          ],
          "name": "RelayedMessage",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "target",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bytes",
              "name": "message",
              "type": "bytes"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "messageNonce",
              "type": "uint256"
            }
          ],
          "name": "SentMessage",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "Unpaused",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_caller",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "bAllow",
              "type": "bool"
            }
          ],
          "name": "allowMsgSender",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_index",
              "type": "uint256"
            }
          ],
          "name": "getQueueElement",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "bytes32",
                  "name": "transactionHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "uint40",
                  "name": "timestamp",
                  "type": "uint40"
                },
                {
                  "internalType": "uint40",
                  "name": "blockNumber",
                  "type": "uint40"
                }
              ],
              "internalType": "struct AnyvmMessenger.CrossMsgElement",
              "name": "_element",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getQueueLength",
          "outputs": [
            {
              "internalType": "uint40",
              "name": "",
              "type": "uint40"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_libAddressManager",
              "type": "address"
            }
          ],
          "name": "initialize",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "libAddressManager",
          "outputs": [
            {
              "internalType": "contract Lib_AddressManager",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bool",
              "name": "_bOpenForAll",
              "type": "bool"
            }
          ],
          "name": "openForAllMsgSender",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "pause",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "paused",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "components": [
                {
                  "internalType": "bytes32",
                  "name": "stateRoot",
                  "type": "bytes32"
                },
                {
                  "components": [
                    {
                      "internalType": "uint256",
                      "name": "batchIndex",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32",
                      "name": "batchRoot",
                      "type": "bytes32"
                    },
                    {
                      "internalType": "uint256",
                      "name": "batchSize",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "prevLastL2BlockIndex",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes",
                      "name": "extraData",
                      "type": "bytes"
                    }
                  ],
                  "internalType": "struct Lib_AnyvmCodec.ChainBatchHeader",
                  "name": "stateRootBatchHeader",
                  "type": "tuple"
                },
                {
                  "components": [
                    {
                      "internalType": "uint256",
                      "name": "index",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32[]",
                      "name": "siblings",
                      "type": "bytes32[]"
                    }
                  ],
                  "internalType": "struct Lib_AnyvmCodec.ChainInclusionProof",
                  "name": "stateRootProof",
                  "type": "tuple"
                },
                {
                  "components": [
                    {
                      "internalType": "bytes",
                      "name": "prefixData",
                      "type": "bytes"
                    },
                    {
                      "internalType": "bytes",
                      "name": "rawEventData",
                      "type": "bytes"
                    },
                    {
                      "internalType": "bytes32[]",
                      "name": "eventSiblings",
                      "type": "bytes32[]"
                    },
                    {
                      "internalType": "uint256",
                      "name": "eventIndex",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalEventLeaves",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32[]",
                      "name": "siblings",
                      "type": "bytes32[]"
                    },
                    {
                      "internalType": "uint256",
                      "name": "index",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalLeaves",
                      "type": "uint256"
                    }
                  ],
                  "internalType": "struct Lib_AnyvmCodec.AnyvmTxProof",
                  "name": "anyvmTxProof",
                  "type": "tuple"
                }
              ],
              "internalType": "struct IAnyvmMessenger.L2MessageInclusionProof",
              "name": "_proof",
              "type": "tuple"
            }
          ],
          "name": "relayMessage",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "name": "relayedMessages",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "renounceOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_name",
              "type": "string"
            }
          ],
          "name": "resolve",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_coinType",
              "type": "string"
            }
          ],
          "name": "resolveL1TokenAddr",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_target",
              "type": "address"
            },
            {
              "internalType": "bytes",
              "name": "_message",
              "type": "bytes"
            }
          ],
          "name": "sendMessage",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "name": "successfulMessages",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "transferOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];