import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    // Hard guarantee: the whole suite needs NO network and NO API key.
    // Every generator is a pure, deterministic transform of bytes the user
    // already has on disk. There is no client, no fetch, no key — there is
    // nothing in this package that could phone home. test/no-network.test.js
    // statically asserts that no source file even references a network API.
    env: {},
    testTimeout: 15000,
  },
});
