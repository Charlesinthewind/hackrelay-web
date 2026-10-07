import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import WebSocket from "ws";

const wait = async (check, timeout = 10000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeout)
      throw Error("Timed out waiting for synchronization");
    await new Promise((r) => setTimeout(r, 30));
  }
};
test(
  "two clients converge, presence syncs, records persist and rooms isolate",
  { timeout: 40000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "hackrelay-test-"));
    let child;
    const clients = [];
    let logs = "";
    function start() {
      child = spawn(process.execPath, ["server/index.js", "--dev"], {
        cwd: process.cwd(),
        env: { ...process.env, PORT: "5179", DATA_DIR: dir },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (s) => (logs += s));
      child.stderr.on("data", (s) => (logs += s));
      return wait(() => logs.includes("http://localhost:5179"));
    }
    async function stop() {
      const done = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      await done;
      logs = "";
    }
    async function connect(room) {
      const doc = new Y.Doc();
      const provider = new WebsocketProvider(
        "ws://localhost:5179/collab",
        room,
        doc,
        { WebSocketPolyfill: WebSocket, disableBc: true },
      );
      const c = { doc, provider };
      clients.push(c);
      await wait(
        () => provider.synced && doc.getMap("meta").get("initialized"),
      );
      return c;
    }
    try {
      await start();
      const a = await connect("test-room"),
        b = await connect("test-room");
      assert.equal(a.doc.getMap("nodes").size, 6);
      assert.equal(b.doc.getMap("tasks").size, 5);
      const at = a.doc.getText("code:App.tsx"),
        bt = b.doc.getText("code:App.tsx");
      at.insert(at.length, "\n// ALICE");
      bt.insert(bt.length, "\n// BOB");
      await wait(
        () =>
          at.toString() === bt.toString() &&
          at.toString().includes("ALICE") &&
          at.toString().includes("BOB"),
      );
      const i = bt.toString().indexOf("// ALICE");
      bt.delete(i, 8);
      await wait(
        () =>
          at.toString() === bt.toString() && !at.toString().includes("ALICE"),
      );
      a.provider.awareness.setLocalStateField("user", {
        name: "Alice",
        color: "#3059e8",
      });
      a.provider.awareness.setLocalStateField("cursor", {
        anchor: Y.createRelativePositionFromTypeIndex(at, 3),
        head: Y.createRelativePositionFromTypeIndex(at, 5),
      });
      await wait(() =>
        [...b.provider.awareness.getStates().values()].some(
          (s) => s.user?.name === "Alice" && s.cursor,
        ),
      );
      a.doc
        .getMap("tasks")
        .set("test-task", {
          id: "test-task",
          title: "Real task",
          status: "todo",
          order: 2,
        });
      await wait(() => b.doc.getMap("tasks").get("test-task"));
      b.doc
        .getMap("tasks")
        .set("test-task", {
          ...b.doc.getMap("tasks").get("test-task"),
          status: "done",
        });
      await wait(
        () => a.doc.getMap("tasks").get("test-task")?.status === "done",
      );
      a.doc
        .getMap("nodes")
        .set("new", {
          id: "new",
          position: { x: 300, y: 200 },
          data: { label: "New" },
        });
      a.doc
        .getMap("edges")
        .set("test-edge", { id: "test-edge", source: "plan", target: "new" });
      await wait(() => b.doc.getMap("edges").has("test-edge"));
      b.doc.getMap("nodes").delete("new");
      b.doc.getMap("edges").delete("test-edge");
      await wait(() => !a.doc.getMap("nodes").has("new"));
      const isolated = await connect("other-room");
      assert.equal(isolated.doc.getMap("tasks").has("test-task"), false);
      assert.equal(
        isolated.doc.getText("code:App.tsx").toString().includes("BOB"),
        false,
      );
      for (const c of clients) {
        c.provider.destroy();
        c.doc.destroy();
      }
      clients.length = 0;
      await stop();
      await start();
      const persisted = await connect("test-room");
      assert.equal(
        persisted.doc.getMap("tasks").get("test-task").status,
        "done",
      );
      assert.ok(
        persisted.doc.getText("code:App.tsx").toString().includes("BOB"),
      );
    } finally {
      for (const c of clients) {
        c.provider.destroy();
        c.doc.destroy();
      }
      if (child?.exitCode === null) await stop();
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
