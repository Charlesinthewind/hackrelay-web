import { uuid } from "./id";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Y from "yjs";
import { useLocation } from "react-router-dom";
import { WebsocketProvider } from "y-websocket";

const Store = createContext(null);
const palette = ["#3059e8", "#d34c77", "#15866c", "#bf780d", "#8452d3"];
const initialProfile = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("hackrelay-profile")) || {
        id: uuid(),
        name: "Jordan Davis",
        description: "",
        skills: "Design, JavaScript",
        color: palette[Math.floor(Math.random() * palette.length)],
      }
    );
  } catch {
    return { id: uuid(), name: "Jordan Davis", color: palette[0] };
  }
};
export function RoomProvider({ children }) {
  const [profile, setProfileState] = useState(initialProfile);
  const route = useLocation();
  const room =
    new URLSearchParams(route.search)
      .get("room")
      ?.replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 64) || "team-a";
  const [status, setStatus] = useState("connecting");
  const [ready, setReady] = useState(false);
  const [peers, setPeers] = useState([]);
  const connection = useMemo(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/collab`,
      room,
      doc,
    );
    return { doc, provider };
  }, [room]);
  useEffect(() => {
    setReady(false);
    const { doc, provider } = connection;
    const onStatus = (e) => setStatus(e.status);
    const onSync = (synced) => {
      if (synced && doc.getMap("meta").get("initialized")) setReady(true);
    };
    const onUpdate = () => {
      if (doc.getMap("meta").get("initialized")) setReady(true);
    };
    const onPeers = () =>
      setPeers(
        [...provider.awareness.getStates()]
          .map(([clientId, s]) => ({ clientId, ...s.user, file: s.file }))
          .filter((s) => s.name),
      );
    provider.on("status", onStatus);
    provider.on("sync", onSync);
    doc.on("update", onUpdate);
    provider.awareness.on("change", onPeers);
    onPeers();
    return () => {
      provider.off("status", onStatus);
      provider.off("sync", onSync);
      doc.off("update", onUpdate);
      provider.awareness.off("change", onPeers);
      provider.destroy();
      doc.destroy();
    };
  }, [connection]);
  useEffect(() => {
    localStorage.setItem("hackrelay-profile", JSON.stringify(profile));
    connection.provider.awareness.setLocalStateField("user", {
      ...profile,
      colorLight: profile.color + "33",
    });
  }, [profile, connection]);
  const value = {
    ...connection,
    room,
    profile,
    peers,
    status,
    ready,
    setProfile(p) {
      setProfileState((old) => ({ ...old, ...p }));
    },
  };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}
export const useRoom = () => useContext(Store);
export function useRecords(name) {
  const { doc } = useRoom();
  const map = useMemo(() => doc.getMap(name), [doc, name]);
  const [records, setRecords] = useState(() => [...map.values()]);
  useEffect(() => {
    const update = () => setRecords([...map.values()]);
    map.observe(update);
    update();
    return () => map.unobserve(update);
  }, [map]);
  return records;
}
export function useActions() {
  const { doc, profile } = useRoom();
  function activity(verb, title, type, targetId, path, detail = "") {
    if (type === "workflow" && doc.getMap("nodes").has(targetId))
      path = `/workspace?block=${encodeURIComponent(targetId)}#workflow`;
    const map = doc.getMap("activity");
    const id = uuid();
    map.set(id, {
      id,
      actor: profile.name,
      actorId: profile.id,
      verb,
      title,
      type,
      targetId,
      path,
      detail,
      createdAt: Date.now(),
    });
    if (map.size > 500)
      [...map.values()]
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(0, map.size - 500)
        .forEach((r) => map.delete(r.id));
  }
  function save(collection, record, event) {
    const id = record.id || uuid();
    doc.transact(() => {
      doc.getMap(collection).set(id, { ...record, id });
      if (event) activity(...event(id));
    }, profile.id);
    return id;
  }
  function remove(collection, id, event) {
    doc.transact(() => {
      doc.getMap(collection).delete(id);
      if (event) activity(...event);
    }, profile.id);
  }
  function patch(collection, id, changes, event) {
    const old = doc.getMap(collection).get(id);
    if (old) return save(collection, { ...old, ...changes }, event);
  }
  return { save, remove, patch, activity };
}
export function useRoomLink() {
  const { room } = useRoom();
  return (path) => {
    const [base, hash] = path.split("#");
    const url = new URL(base, location.origin);
    url.searchParams.set("room", room);
    return url.pathname + url.search + (hash ? "#" + hash : "");
  };
}
export function timeAgo(value) {
  const mins = Math.floor((Date.now() - value) / 60000);
  return mins < 1
    ? "Just now"
    : mins < 60
      ? `${mins} min ago`
      : new Date(value).toLocaleString();
}
