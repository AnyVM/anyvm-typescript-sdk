import { MoveupAccount } from "../../account/moveup_account";
import { MoveupClient } from "../../providers/moveup_client";
import { bcsSerializeBool } from "../../bcs";
import { FaucetClient } from "../../plugins/faucet_client";
import { IndexerClient } from "../../providers/indexer";
import { TokenClient } from "../../plugins/token_client";
import { FAUCET_AUTH_TOKEN, NODE_URL, FAUCET_URL, longTestTimeout } from "../unit/test_helper.test";
import { Network, NetworkToIndexerAPI, NetworkToNodeAPI, sleep } from "../../utils";

const moveupClient = new MoveupClient(NetworkToNodeAPI[Network.TESTNET]);
const faucetClient = new FaucetClient(
    NODE_URL,
    FAUCET_URL,
  { TOKEN: FAUCET_AUTH_TOKEN },
);
const tokenClient = new TokenClient(moveupClient);
const alice = new MoveupAccount();
const collectionName = "AliceCollection";
const tokenName = "Alice Token";
const indexerClient = new IndexerClient(NetworkToIndexerAPI[Network.TESTNET]);

describe("Indexer", () => {
  it("should throw an error when account address is not valid", async () => {
    expect(async () => {
      await indexerClient.getAccountNFTs("3361d670d40475d1be51eaeefe91c4bcefa848");
    }).rejects.toThrow("Address needs to be 42 chars long.");

    expect(async () => {
      await indexerClient.getAccountNFTs("0x3361d670d40475d1be51eaeefe91c4bcefa848");
    }).rejects.toThrow("Address needs to be 42 chars long.");
  });

  it("should not throw an error when account address is missing 0x", async () => {
    expect(async () => {
      await indexerClient.getAccountNFTs("003361d670d40475d1be51eaeefe91c4bcefa848");
    }).not.toThrow("Address needs to be 42 chars long.");
  });

  beforeAll(async () => {
    await faucetClient.fundAccount(alice.address(), 100000000);
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

  describe("get data", () => {
    jest.retryTimes(5);
    beforeEach(async () => {
      await sleep(1000);
    });
    it(
      "gets account NFTs",
      async () => {
        const accountNFTs = await indexerClient.getAccountNFTs(alice.address().hex());
        expect(accountNFTs.current_token_ownerships).toHaveLength(1);
        expect(accountNFTs.current_token_ownerships[0]).toHaveProperty("current_token_data");
        expect(accountNFTs.current_token_ownerships[0]).toHaveProperty("current_collection_data");
        expect(accountNFTs.current_token_ownerships[0].current_token_data?.name).toBe("Alice Token");
      },
      longTestTimeout,
    );

    it(
      "gets token activities",
      async () => {
        const accountNFTs = await indexerClient.getAccountNFTs(alice.address().hex());
        const tokenActivity = await indexerClient.getTokenActivities(
          accountNFTs.current_token_ownerships[0].current_token_data!.token_data_id_hash,
        );
        expect(tokenActivity.token_activities).toHaveLength(2);
        expect(tokenActivity.token_activities[0]).toHaveProperty("from_address");
        expect(tokenActivity.token_activities[0]).toHaveProperty("to_address");
      },
      longTestTimeout,
    );

    it(
      "gets account coin data",
      async () => {
        const accountCoinData = await indexerClient.getAccountCoinsData(alice.address().hex());
        expect(accountCoinData.current_coin_balances[0].coin_type).toEqual("0x1::eth::ETH");
      },
      longTestTimeout,
    );

    it(
      "gets account token count",
      async () => {
        const accountTokenCount = await indexerClient.getAccountTokensCount(alice.address().hex());
        expect(accountTokenCount.current_token_ownerships_aggregate.aggregate?.count).toEqual(1);
      },
      longTestTimeout,
    );

    it(
      "gets account transactions count",
      async () => {
        const accountTransactionsCount = await indexerClient.getAccountTransactionsCount(alice.address().hex());
        expect(accountTransactionsCount.move_resources_aggregate.aggregate?.count).toEqual(3);
      },
      longTestTimeout,
    );

    it(
      "gets account transactions data",
      async () => {
        const accountTransactionsData = await indexerClient.getAccountTransactionsData(alice.address().hex());
        expect(accountTransactionsData.move_resources[0]).toHaveProperty("transaction_version");
      },
      longTestTimeout,
    );

    it(
      "gets token activities count",
      async () => {
        const accountNFTs = await indexerClient.getAccountNFTs(alice.address().hex());
        const tokenActivitiesCount = await indexerClient.getTokenActivitiesCount(
          accountNFTs.current_token_ownerships[0].current_token_data!.token_data_id_hash,
        );
        expect(tokenActivitiesCount.token_activities_aggregate.aggregate?.count).toBe(2);
      },
      longTestTimeout,
    );

    it(
      "gets token data",
      async () => {
        const accountNFTs = await indexerClient.getAccountNFTs(alice.address().hex());
        const tokenData = await indexerClient.getTokenData(
          accountNFTs.current_token_ownerships[0].current_token_data!.token_data_id_hash,
        );
        expect(tokenData.current_token_datas[0].name).toEqual("Alice Token");
      },
      longTestTimeout,
    );

    it(
      "gets token owners data",
      async () => {
        const accountNFTs = await indexerClient.getAccountNFTs(alice.address().hex());
        const tokenOwnersData = await indexerClient.getTokenOwnersData(
          accountNFTs.current_token_ownerships[0].current_token_data!.token_data_id_hash,
          0,
        );
        expect(tokenOwnersData.current_token_ownerships[0].owner_address).toEqual(alice.address().hex());
      },
      longTestTimeout,
    );

    it(
      "gets top user transactions",
      async () => {
        const topUserTransactions = await indexerClient.getTopUserTransactions(5);
        expect(topUserTransactions.user_transactions.length).toEqual(5);
      },
      longTestTimeout,
    );

    it(
      "gets user transactions",
      async () => {
        const userTransactions = await indexerClient.getUserTransactions(482294669, { limit: 4 });
        expect(userTransactions.user_transactions[0].version).toEqual(482294669);
        expect(userTransactions.user_transactions.length).toEqual(4);
      },
      longTestTimeout,
    );

    test("gets indexer ledger info", async () => {
      const ledgerInfo = await indexerClient.getIndexerLedgerInfo();
      expect(ledgerInfo.ledger_infos[0].chain_id).toBeGreaterThan(1);
    });
  });
});
