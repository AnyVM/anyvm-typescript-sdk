export const NetworkToIndexerAPI: Record<string, string> = {
  mainnet: "http://127.0.0.1:8080/v1/graphql",
  testnet: "http://127.0.0.1:8080/v1/graphql",
  devnet: "http://127.0.0.1:8080/v1/graphql",
};

export const NetworkToNodeAPI: Record<string, string> = {
  mainnet: "http://127.0.0.1:8080/v1",
  testnet: "http://127.0.0.1:8080/v1",
  devnet: "http://127.0.0.1:8080/v1",
};

export enum Network {
  MAINNET = "mainnet",
  TESTNET = "testnet",
  DEVNET = "devnet",
}

export interface CustomEndpoints {
  fullnodeUrl: string;
  indexerUrl: string;
}
