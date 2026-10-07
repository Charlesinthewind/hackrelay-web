import { uuid } from "./id";
import { useSearchParams } from "react-router-dom";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Pencil, Trash2, Maximize2, Minimize2, Grip } from "lucide-react";
import { useRoom, useRecords, useActions } from "./store";
import { Card, Button, Modal, Field } from "./ui";

function Block({ data, selected }) {
  return (
    <div className={`workflow-block ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <strong>{data.label}</strong>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { block: Block };
export default function Workflow() {
  const savedNodes = useRecords("nodes"),
    savedEdges = useRecords("edges");
  const [params] = useSearchParams();
  const focusId = params.get("block");
  const { doc } = useRoom();
  const { save, remove, patch, activity } = useActions();
  const [nodes, setNodes] = useState([]),
    [edges, setEdges] = useState([]),
    [selection, setSelection] = useState(null),
    [editing, setEditing] = useState(null),
    [expanded, setExpanded] = useState(false);
  const dragging = useRef(false);
  const [size, setSize] = useState({ width: null, height: 320 });
  const container = useRef();
  const flow = useRef();
  useEffect(() => {
    if (!dragging.current)
      setNodes((old) =>
        savedNodes.map((n) => ({
          ...n,
          type: "block",
          selected: old.find((o) => o.id === n.id)?.selected,
        })),
      );
  }, [savedNodes]);
  useEffect(
    () =>
      setEdges((old) =>
        savedEdges.map((e) => ({
          ...e,
          selected: old.find((o) => o.id === e.id)?.selected,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#3059e8" },
        })),
      ),
    [savedEdges],
  );
  useEffect(() => {
    if (!focusId || !savedNodes.some((n) => n.id === focusId)) return;
    const timer = setTimeout(() => {
      const n = savedNodes.find((n) => n.id === focusId);
      setSelection({ kind: "node", id: n.id, label: n.data.label });
      setNodes((ns) => ns.map((x) => ({ ...x, selected: x.id === focusId })));
      flow.current?.fitView({
        nodes: [{ id: focusId }],
        padding: 0.7,
        maxZoom: 1,
        duration: 300,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [focusId, savedNodes]);
  const onNodesChange = useCallback(
    (changes) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((es) => applyEdgeChanges(changes, es)),
    [],
  );
  function deleteSelection() {
    if (!selection) return;
    if (selection.kind === "node") {
      doc.transact(() => {
        remove("nodes", selection.id, [
          "removed a workflow block",
          selection.label,
          "workflow",
          selection.id,
          "/workspace#workflow",
        ]);
        savedEdges
          .filter((e) => e.source === selection.id || e.target === selection.id)
          .forEach((e) => remove("edges", e.id));
      });
    } else
      remove("edges", selection.id, [
        "removed a connection",
        "Workflow connection",
        "workflow",
        selection.id,
        "/workspace#workflow",
      ]);
    setSelection(null);
  }
  function connect(c) {
    if (
      c.source === c.target ||
      savedEdges.some((e) => e.source === c.source && e.target === c.target)
    )
      return;
    save("edges", { ...c, id: uuid(), type: "smoothstep" }, (id) => [
      "connected workflow blocks",
      `${savedNodes.find((n) => n.id === c.source)?.data.label} → ${savedNodes.find((n) => n.id === c.target)?.data.label}`,
      "workflow",
      id,
      "/workspace#workflow",
    ]);
  }
  function resize(e) {
    e.preventDefault();
    const startX = e.clientX,
      startY = e.clientY,
      rect = container.current.getBoundingClientRect();
    const move = (ev) =>
      setSize({
        width: Math.max(
          320,
          Math.min(window.innerWidth - 80, rect.width + ev.clientX - startX),
        ),
        height: Math.max(240, Math.min(800, rect.height + ev.clientY - startY)),
      });
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  }
  return (
    <Card
      className={`workflow-card ${expanded ? "canvas-expanded" : ""}`}
      id="workflow"
    >
      <div className="section-toolbar">
        <h2>Workflow</h2>
        <div className="toolbar">
          <Button
            onClick={() =>
              setEditing({
                id: "",
                data: { label: "", description: "", kind: "step" },
                position: flow.current?.screenToFlowPosition({
                  x:
                    container.current.getBoundingClientRect().left +
                    container.current.clientWidth / 2,
                  y: container.current.getBoundingClientRect().top + 150,
                }) || { x: 100, y: 100 },
              })
            }
          >
            <Plus size={16} />
            Add block
          </Button>
          <Button
            disabled={!selection || selection.kind !== "node"}
            onClick={() =>
              setEditing(savedNodes.find((n) => n.id === selection.id))
            }
          >
            <Pencil size={16} />
            Edit
          </Button>
          <Button disabled={!selection} onClick={deleteSelection}>
            <Trash2 size={16} />
            Delete
          </Button>
          <button
            className="icon-button"
            aria-label={expanded ? "Restore canvas" : "Expand canvas"}
            onClick={() => {
              setExpanded(!expanded);
              setSize({ width: null, height: expanded ? 320 : 520 });
            }}
          >
            {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      <div
        className="canvas-shell"
        ref={container}
        style={{
          height: size.height,
          width: size.width ? `${size.width}px` : "100%",
        }}
      >
        <ReactFlow
          attributionPosition="top-right"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={connect}
          onInit={(instance) => (flow.current = instance)}
          onNodeDragStart={() => (dragging.current = true)}
          onNodeDragStop={(_, node) => {
            dragging.current = false;
            patch("nodes", node.id, { position: node.position }, (id) => [
              "moved a workflow block",
              node.data.label,
              "workflow",
              id,
              "/workspace#workflow",
            ]);
          }}
          onNodeClick={(_, node) =>
            setSelection({ kind: "node", id: node.id, label: node.data.label })
          }
          onEdgeClick={(_, edge) => setSelection({ kind: "edge", id: edge.id })}
          onPaneClick={() => setSelection(null)}
          onNodeDoubleClick={(_, node) =>
            setEditing(savedNodes.find((n) => n.id === node.id))
          }
          onNodesDelete={(deleted) => {
            deleted.forEach((n) => {
              remove("nodes", n.id, [
                "removed a workflow block",
                n.data.label,
                "workflow",
                n.id,
                "/workspace#workflow",
              ]);
              savedEdges
                .filter((e) => e.source === n.id || e.target === n.id)
                .forEach((e) => remove("edges", e.id));
            });
            setSelection(null);
          }}
          onEdgesDelete={(deleted) =>
            deleted.forEach((e) => remove("edges", e.id))
          }
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={2.5}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#3059e8", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#3059e8" },
          }}
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Background color="#d7deeb" gap={22} />
          <Controls showInteractive={false} />
          {expanded && <MiniMap />}
        </ReactFlow>
        <button
          className="resize-grip"
          aria-label="Drag to resize workflow canvas"
          title="Drag to resize canvas"
          onPointerDown={resize}
        >
          <Grip size={18} />
        </button>
      </div>
      <p className="hint">
        Drag blocks to move · Connect an output dot to an input dot ·
        Double-click to edit · Scroll to zoom
      </p>
      {editing && (
        <Modal
          title={editing.id ? "Edit workflow block" : "Add workflow block"}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = editing.id || uuid();
              save(
                "nodes",
                {
                  ...editing,
                  id,
                  data: { ...editing.data, label: editing.data.label.trim() },
                },
                (id) => [
                  editing.id
                    ? "edited a workflow block"
                    : "added a workflow block",
                  editing.data.label,
                  "workflow",
                  id,
                  "/workspace#workflow",
                ],
              );
              setEditing(null);
            }}
          >
            <Field label="Block name">
              <input
                required
                autoFocus
                value={editing.data.label}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    data: { ...editing.data, label: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Type">
              <select
                value={editing.data.kind}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    data: { ...editing.data, kind: e.target.value },
                  })
                }
              >
                <option value="step">Step</option>
                <option value="split">Split</option>
                <option value="merge">Merge</option>
              </select>
            </Field>
            <Field label="Description">
              <textarea
                value={editing.data.description}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    data: { ...editing.data, description: e.target.value },
                  })
                }
              />
            </Field>
            <div className="actions">
              <Button type="button" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button primary>Save block</Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
