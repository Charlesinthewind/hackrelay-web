import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import {
  setupWSConnection,
  setPersistence,
  docs,
} from "@y/websocket-server/utils";
import * as Y from "yjs";
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { resolve } from "node:path";
import { networkInterfaces } from "node:os";
import { seedRoom } from "./seed.js";

const root = resolve(import.meta.dirname, "..");
const dataDir = resolve(process.env.DATA_DIR || resolve(root, "data"));
mkdirSync(dataDir, { recursive: true });
const timers = new Map();
function save(name, doc) {
  const file = resolve(dataDir, `${name}.bin`);
  writeFileSync(`${file}.tmp`, Y.encodeStateAsUpdate(doc));
  renameSync(`${file}.tmp`, file);
}
setPersistence({
  bindState(name, doc) {
    const file = resolve(dataDir, `${name}.bin`);
    if (existsSync(file)) Y.applyUpdate(doc, readFileSync(file));
    seedRoom(doc);
    save(name, doc);
    doc.on("update", () => {
      clearTimeout(timers.get(name));
      timers.set(
        name,
        setTimeout(() => {
          save(name, doc);
          timers.delete(name);
        }, 100),
      );
    });
  },
  async writeState(name, doc) {
    clearTimeout(timers.get(name));
    timers.delete(name);
    save(name, doc);
  },
});
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({
  noServer: true,
  maxPayload: 64 * 1024 * 1024,
});
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  const match = /^\/collab\/([a-zA-Z0-9_-]{1,64})$/.exec(url.pathname);
  if (!match) {
    if (req.headers["sec-websocket-protocol"] !== "vite-hmr") socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) =>
    setupWSConnection(ws, req, { docName: match[1] }),
  );
});
app.get("/api/health", (_req, res) => res.json({ ok: true, rooms: docs.size }));
let vite;
if (process.argv.includes("--dev")) {
  const { createServer: createVite } = await import("vite");
  vite = await createVite({
    root,
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  if (!existsSync(resolve(root, "dist/index.html")))
    throw new Error("Run npm run build before npm start.");
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
}
const port = Number(process.env.PORT || 5173);
server.listen(port, "0.0.0.0", () => {
  console.log(`HackRelay: http://localhost:${port}`);
  for (const values of Object.values(networkInterfaces()))
    for (const n of values || [])
      if (n.family === "IPv4" && !n.internal)
        console.log(`Same-network access: http://${n.address}:${port}`);
});
async function shutdown() {
  for (const [name, doc] of docs) {
    clearTimeout(timers.get(name));
    save(name, doc);
  }
  for (const ws of wss.clients) ws.close();
  await vite?.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
