import { MoveupAccount } from "../../account/moveup_account";
import { MoveupClient } from "../../providers/moveup_client";
import { bcsSerializeBool } from "../../bcs";
import { Provider } from "../../providers/provider";
import { FaucetClient } from "../../plugins/faucet_client";
import { TokenClient } from "../../plugins/token_client";
import { Network, NetworkToIndexerAPI, NetworkToNodeAPI, sleep } from "../../utils";
import { FAUCET_AUTH_TOKEN, NODE_URL, FAUCET_URL, longTestTimeout } from "../unit/test_helper.test";

describe("Provider", () => {
  const faucetClient = new FaucetClient(
      NODE_URL,
      FAUCET_URL,
    { TOKEN: FAUCET_AUTH_TOKEN },
  );
  const alice = new MoveupAccount();
  jest.setTimeout(60000);

  it("uses provided network as API", async () => {
    const provider = new Provider(Network.TESTNET);
    expect(provider.moveupClient.nodeUrl).toBe(NetworkToNodeAPI[Network.TESTNET]);
    expect(provider.indexerClient.endpoint).toBe(NetworkToIndexerAPI[Network.TESTNET]);
  });

  it("uses custom endpoints as API", async () => {
    const provider = new Provider({ fullnodeUrl: "full-node-url", indexerUrl: "indexer-url" });
    expect(provider.moveupClient.nodeUrl).toBe("full-node-url/v1");
    expect(provider.indexerClient.endpoint).toBe("indexer-url");
  });

  it("throws error when endpoint not provided", async () => {
    expect(() => {
      new Provider({ fullnodeUrl: "", indexerUrl: "" });
    }).toThrow("network is not provided");
  });

  describe("requests", () => {
    beforeAll(async () => {
      await faucetClient.fundAccount(alice.address(), 100000000);
    });

    describe("query full node", () => {
      it("gets genesis account from fullnode", async () => {
        const provider = new Provider(Network.TESTNET);
        const genesisAccount = await provider.getAccount("0x1");
        expect(genesisAccount.authentication_key.length).toBe(66);
        expect(genesisAccount.sequence_number).not.toBeNull();
      });
    });

    describe("query indexer", () => {
      const moveupClient = new MoveupClient(NODE_URL);
      const tokenClient = new TokenClient(moveupClient);
      const collectionName = "AliceCollection";
      const tokenName = "Alice Token";

      beforeAll(async () => {
        // Create collection and token on Alice's account
        await moveupClient.waitForTransaction(
          await tokenClient.createCollection(alice, collectionName, "Alice's simple collection", "https://moveup.dev"),
          { checkSuccess: true },
        );

        await moveupClient.waitForTransaction(
          await tokenClient.createTokenWithMutabilityConfig(
            alice,
            collectionName,
            tokenName,
            "Alice's simple token",
            1,
            "https://moveup.dev/img/nyan.jpeg",
            1000,
            alice.address(),
            1,
            0,
            ["TOKEN_BURNABLE_BY_OWNER"],
            [bcsSerializeBool(true)],
            ["bool"],
            [false, false, false, false, true],
          ),
          { checkSuccess: true },
        );
      }, longTestTimeout);

      jest.retryTimes(5);
      beforeEach(async () => {
        await sleep(1000);
      });

      it("gets account NFTs from indexer", async () => {
        let provider = new Provider(Network.TESTNET);
        const accountNFTs = await provider.getAccountNFTs(alice.address().hex(), { limit: 20, offset: 0 });
        expect(accountNFTs.current_token_ownerships).toHaveLength(1);
        expect(accountNFTs.current_token_ownerships[0]).toHaveProperty("current_token_data");
        expect(accountNFTs.current_token_ownerships[0]).toHaveProperty("current_collection_data");
        expect(accountNFTs.current_token_ownerships[0].current_token_data?.name).toBe("Alice Token");
      });
    });
  });
});
