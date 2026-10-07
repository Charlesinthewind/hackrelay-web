import React, { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { yCollab, ySyncAnnotation } from "y-codemirror.next";
import * as Y from "yjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Copy, FileCode2, Check } from "lucide-react";
import { useRoom, useActions, useRecords, useRoomLink } from "./store";
import { Heading, Card, Button, Go, Badge, Modal, Field } from "./ui";
export default function Editor() {
  const { doc, provider, profile, peers, status, room } = useRoom();
  const { activity } = useActions();
  const tasks = useRecords("tasks");
  const link = useRoomLink();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const file = ["App.tsx", "styles.css", "README.md"].includes(
    params.get("file"),
  )
    ? params.get("file")
    : "App.tsx";
  const mount = useRef(),
    view = useRef();
  const [copied, setCopied] = useState(false),
    [invite, setInvite] = useState(false);
  useEffect(() => {
    const ytext = doc.getText("code:" + file);
    const undoManager = new Y.UndoManager(ytext);
    let timer,
      pending = false;
    provider.awareness.setLocalStateField("file", file);
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        oneDark,
        file.endsWith(".css")
          ? css()
          : file.endsWith(".md")
            ? markdown()
            : javascript({ jsx: true, typescript: true }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": `Shared code editor ${file}`,
        }),
        yCollab(ytext, provider.awareness, { undoManager }),
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            update.transactions.some(
              (tr) => tr.docChanged && !tr.annotation(ySyncAnnotation),
            )
          ) {
            pending = true;
            clearTimeout(timer);
            timer = setTimeout(() => {
              activity(
                "edited code",
                file,
                "code",
                file,
                `/code?file=${encodeURIComponent(file)}`,
                "Shared code editor",
              );
              pending = false;
            }, 2500);
          }
        }),
      ],
    });
    const editor = new EditorView({ state, parent: mount.current });
    view.current = editor;
    return () => {
      clearTimeout(timer);
      if (pending)
        activity(
          "edited code",
          file,
          "code",
          file,
          `/code?file=${encodeURIComponent(file)}`,
          "Shared code editor",
        );
      editor.destroy();
      undoManager.destroy();
      provider.awareness.setLocalStateField("cursor", null);
      provider.awareness.setLocalStateField("file", null);
    };
  }, [doc, provider, file]);
  function download() {
    const blob = new Blob([doc.getText("code:" + file).toString()], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file;
    a.click();
    URL.revokeObjectURL(url);
  }
  const online = peers.filter((p) => p.file === file);
  return (
    <>
      <Heading
        title="Live Code Collaboration"
        context="Repository / Community Connect"
      />
      <Card title="Shared session">
        <div className="session-bar">
          <div className="presence">
            {peers.map((p) => (
              <span className="person" key={p.clientId}>
                <i style={{ background: p.color }} />
                {p.name}
                {p.clientId === doc.clientID ? " (you)" : ""}
              </span>
            ))}
          </div>
          <Badge tone={status === "connected" ? "success" : "warning"}>
            {status === "connected" ? "Connected" : "Reconnecting…"}
          </Badge>
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  location.origin + link("/code"),
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setInvite(true);
              }
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}Invite teammate
          </Button>
        </div>
        <p className="hint">
          Room: {room} · Change your display name from your profile.
        </p>
      </Card>
      <div className="code-layout">
        <Card title="Files" className="files">
          <p>community-connect</p>
          {["App.tsx", "styles.css", "README.md"].map((name) => (
            <button
              className={`file-button ${name === file ? "active" : ""}`}
              key={name}
              onClick={() => setParams({ room, file: name })}
            >
              <FileCode2 size={16} />
              {name}
            </button>
          ))}
        </Card>
        <section className="editor-panel">
          <div className="editor-header">
            <div>
              <h2>Shared code editor</h2>
              <span>
                {file} · {online.length}{" "}
                {online.length === 1 ? "person" : "people"} viewing
              </span>
            </div>
            <button
              className="icon-button"
              aria-label="Download current file"
              onClick={download}
            >
              <Download size={18} />
            </button>
          </div>
          <div className="code-mount" ref={mount} />
        </section>
        <aside className="stack">
          <Card title="Project context" className="tinted">
            <h3>Community Connect</h3>
            <p>Find your people.</p>
            <p>
              Discover local activities and meet people who share your
              interests.
            </p>
          </Card>
          <Card title="Linked task">
            <p>
              {tasks.find((t) => t.id === "prototype")?.title ||
                "Build first prototype"}
            </p>
            <Go to="/tasks/prototype">Open task details →</Go>
          </Card>
          <Card title="Editing together">
            <p>
              Type or delete code. Your teammates see the changes, your cursor
              and your selection live.
            </p>
            <p className="hint">
              Changes save automatically. Undo affects your own edits.
            </p>
          </Card>
        </aside>
      </div>
      <div className="actions">
        <Go to="/workspace">← Back to workspace</Go>
        <Button onClick={download}>
          <Download size={16} />
          Download {file}
        </Button>
      </div>
      {invite && (
        <Modal title="Invite teammate" onClose={() => setInvite(false)}>
          <Field label="Shared session link">
            <input
              readOnly
              value={location.origin + link("/code")}
              onFocus={(e) => e.target.select()}
            />
          </Field>
          <p>
            Copy this link and open it on a device connected to the same
            network.
          </p>
        </Modal>
      )}
    </>
  );
}
