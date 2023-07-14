import { MoveupAccount } from "../../account";
import { UserTransaction } from "../../generated";
import { MoveupToken } from "../../plugins";
import { Provider } from "../../providers";
import { PROVIDER_LOCAL_NETWORK_CONFIG, getFaucetClient, longTestTimeout } from "../unit/test_helper.test";

const provider = new Provider(PROVIDER_LOCAL_NETWORK_CONFIG);
const faucetClient = getFaucetClient();
const moveupToken = new MoveupToken(provider);

const alice = new MoveupAccount();
const bob = new MoveupAccount();

const collectionName = "AliceCollection";
const tokenName = "Alice Token";
let tokenAddress = "";

describe("token objects", () => {
  beforeAll(async () => {
    // Fund Alice's Account
    await faucetClient.fundAccount(alice.address(), 1000000000000000000);
  }, longTestTimeout);

  test(
    "create collection",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.createCollection(alice, "Alice's simple collection", collectionName, "https://moveup.dev", 5, {
          royaltyNumerator: 10,
          royaltyDenominator: 10,
        }),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "mint",
    async () => {
      const txn = await provider.waitForTransactionWithResult(
        await moveupToken.mint(
          alice,
          collectionName,
          "Alice's simple token",
          tokenName,
          "https://moveup.dev/img/nyan.jpeg",
          ["key"],
          ["bool"],
          ["true"],
        ),
        { checkSuccess: true },
      );
      tokenAddress = (txn as UserTransaction).events[0].data.token;
    },
    longTestTimeout,
  );

  test(
    "mint soul bound",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.mintSoulBound(
          alice,
          collectionName,
          "Alice's simple soul bound token",
          "Alice's soul bound token",
          "https://moveup.dev/img/nyan.jpeg",
          bob,
          ["key"],
          ["bool"],
          ["true"],
        ),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "freeze transfer",
    async () => {
      await provider.waitForTransaction(await moveupToken.freezeTokenTransafer(alice, tokenAddress), {
        checkSuccess: true,
      });
    },
    longTestTimeout,
  );

  test(
    "unfreeze token transfer",
    async () => {
      await provider.waitForTransaction(await moveupToken.unfreezeTokenTransafer(alice, tokenAddress), {
        checkSuccess: true,
      });
    },
    longTestTimeout,
  );

  test(
    "set token description",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.setTokenDescription(alice, tokenAddress, "my updated token description"),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "set token name",
    async () => {
      await provider.waitForTransaction(await moveupToken.setTokenName(alice, tokenAddress, "my updated token name"), {
        checkSuccess: true,
      });
    },
    longTestTimeout,
  );

  test(
    "set token uri",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.setTokenName(alice, tokenAddress, "https://moveup.dev/img/hero.jpg"),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "add token property",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.addTokenProperty(alice, tokenAddress, "newKey", "BOOLEAN", "true"),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "add typed property",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.addTypedProperty(alice, tokenAddress, "newTypedKey", "VECTOR", "[hello,world]"),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "update typed property",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.updateTypedProperty(alice, tokenAddress, "newTypedKey", "U8", "2"),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "update token property",
    async () => {
      await provider.waitForTransaction(
        await moveupToken.updateTokenProperty(alice, tokenAddress, "newKey", "U8", "5"),
        { checkSuccess: true },
      );
    },
    longTestTimeout,
  );

  test(
    "remove token property",
    async () => {
      await provider.waitForTransaction(await moveupToken.removeTokenProperty(alice, tokenAddress, "newKey"), {
        checkSuccess: true,
      });
    },
    longTestTimeout,
  );

  test(
    "transfer token ownership",
    async () => {
      await provider.waitForTransaction(await moveupToken.transferTokenOwnership(alice, tokenAddress, bob.address()), {
        checkSuccess: true,
      });
    },
    longTestTimeout,
  );

  test(
    "burn token",
    async () => {
      await provider.waitForTransaction(await moveupToken.burnToken(alice, tokenAddress), { checkSuccess: true });
    },
    longTestTimeout,
  );
});
