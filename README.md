# SDK for Moveup Node API

## Quickstart

The public SDK downloaded from [npmjs](https://www.npmjs.com/package/@anyvm/moveup-sdk) is compatible with the Moveup devnet. To start building, run below command in your project directory:

```bash
pnpm add @anyvm/moveup-sdk
```

## Usage

For Javascript or Typescript usage, check out the [`./examples`] folder with ready-made `package.json` files to get you going quickly!

If you are using the types in a `commonjs` module, like in a Node app, you just have to enable `esModuleInterop`
and `allowSyntheticDefaultImports` in your `tsconfig` for types compatibility:

```json
{
  ...
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
    ...
  }
}
```

### Requirements

- [Node.js](https://nodejs.org)
- [Yarn](https://pnpmpkg.com/)

```bash
pnpm install
```

### Working with local node

To develop in a local environment, you need to use the SDK from the [main](https://github.com/MoveupLabs/moveup-typescript-sdk/tree/main/) branch.

**NOTE**
SDK from the main branch might not be compatible with the devnet.

Run a local node (run from the root of the repo):

```bash
./moveup node run-local-testnet --with-faucet
```

Run the SDK tests and make sure they pass. Go to the SDK directory, and setup an env to configure the URLs:

```bash
rm .env
echo 'MOVEUP_NODE_URL="http://127.0.0.1:8080/v1"' >> .env
echo 'MOVEUP_FAUCET_URL="http://127.0.0.1:8081"' >> .env
```

Run the tests:

```bash
pnpm test
```

If you see strange behavior regarding HTTP clients, try running the tests with `--detectOpenHandles`.
