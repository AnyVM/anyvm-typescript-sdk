// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { MoveupClient } from "../../providers/moveup_client";

test("test fixNodeUrl", () => {
  expect(new MoveupClient("https://test.com").client.request.config.BASE).toBe("https://test.com/v1");
  expect(new MoveupClient("https://test.com/").client.request.config.BASE).toBe("https://test.com/v1");
  expect(new MoveupClient("https://test.com/v1").client.request.config.BASE).toBe("https://test.com/v1");
  expect(new MoveupClient("https://test.com/v1/").client.request.config.BASE).toBe("https://test.com/v1");
  expect(new MoveupClient("https://test.com", {}, true).client.request.config.BASE).toBe("https://test.com");
});
