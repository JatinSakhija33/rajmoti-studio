import test from "node:test";
import assert from "node:assert/strict";
import {firebaseWebConfigFromEnv, FIREBASE_DATABASE_ID} from "../src/lib/rajmoti-firebase-web-config.mjs";

test("accepts the registered rajmoti-os web application", () => {
  const config = firebaseWebConfigFromEnv({VITE_FIREBASE_API_KEY: "firebase-browser-key"});
  assert.equal(config.projectId, "rajmoti-os");
  assert.equal(config.appId, "1:350182272734:web:93629d267be9b686f8dc4f");
  assert.equal(FIREBASE_DATABASE_ID, "ai-studio-rajmotistudioai-72e2debd-055c-4ab8-a5ef-f9c759cebfaf");
});
test("rejects missing browser configuration and mismatched projects", () => {
  assert.throws(() => firebaseWebConfigFromEnv({}), /Missing VITE_FIREBASE_API_KEY/);
  assert.throws(() => firebaseWebConfigFromEnv({
    VITE_FIREBASE_API_KEY: "firebase-browser-key", VITE_FIREBASE_PROJECT_ID: "wrong-project"
  }), /mismatch/);
});
