import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { useRecords, useActions, useRoom, useRoomLink } from "./store";
import { Button, Modal, Field, statusLabels } from "./ui";
export function TaskForm({ task = {}, onClose }) {
  const tasks = useRecords("tasks");
  const { profile } = useRoom();
  const { save, remove } = useActions();
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    assignee: profile.name,
    status: "todo",
    due: "",
    dependency: "",
    note: "",
    comments: [],
    ...task,
  });
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <Modal title={task.id ? "Edit task" : "Add task"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(
            "tasks",
            {
              ...draft,
              title: draft.title.trim(),
              order:
                draft.order ??
                tasks.filter((t) => t.status === draft.status).length,
            },
            (id) => [
              task.id ? "updated a task" : "added a task",
              draft.title,
              "task",
              id,
              `/tasks/${id}`,
              statusLabels[draft.status],
            ],
          );
          onClose();
        }}
      >
        <Field label="Task title">
          <input
            required
            autoFocus
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Assignee">
            <input
              value={draft.assignee}
              onChange={(e) => set("assignee", e.target.value)}
            />
          </Field>
          <Field label="Due time">
            <input
              type="time"
              value={draft.due}
              onChange={(e) => set("due", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {Object.entries(statusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Depends on">
          <select
            value={draft.dependency}
            onChange={(e) => set("dependency", e.target.value)}
          >
            <option value="">No dependency</option>
            {tasks
              .filter((t) => t.id !== task.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
        <div className="actions">
          {task.id && (
            <Button
              type="button"
              danger
              onClick={() => {
                if (confirm("Delete this task?")) {
                  remove("tasks", task.id, [
                    "deleted a task",
                    draft.title,
                    "task",
                    task.id,
                    "/workspace#kanban",
                  ]);
                  onClose();
                }
              }}
            >
              Delete task
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button primary>Save task</Button>
        </div>
      </form>
    </Modal>
  );
}
function TaskTile({ task, onEdit, onDelete, overlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const link = useRoomLink();
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging && !overlay ? 0.3 : 1,
      }}
      className="task-tile"
      data-task-id={task.id}
    >
      <div className="task-tools">
        <button
          className="drag-handle"
          aria-label={`Move ${task.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
        >
          <Pencil size={14} />
        </button>
        <button
          className="icon-button"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <Link to={link(`/tasks/${task.id}`)} className="task-title">
        {task.title}
      </Link>
      <p className="task-meta">
        {task.assignee || "Unassigned"}
        {task.due ? ` · ${task.due}` : ""}
      </p>
    </article>
  );
}
function Column({ status, tasks, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "drop-active" : ""}`}
      data-column={status}
    >
      <h3>
        {statusLabels[status]}
        <span>{tasks.length}</span>
      </h3>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((t) => (
          <TaskTile key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </SortableContext>
      <Button className="add-column-task" onClick={() => onEdit({ status })}>
        <Plus size={14} />
        Add task
      </Button>
    </section>
  );
}
export default function Kanban() {
  const tasks = useRecords("tasks");
  const { doc } = useRoom();
  const { patch, remove } = useActions();
  const [editing, setEditing] = useState(null),
    [active, setActive] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function move({ active, over }) {
    setActive(null);
    if (!over || active.id === over.id) return;
    const task = tasks.find((t) => t.id === active.id);
    const targetTask = tasks.find((t) => t.id === over.id);
    const status = targetTask?.status || over.id;
    if (!task || !statusLabels[status]) return;
    const destination = tasks
      .filter((t) => t.status === status && t.id !== task.id)
      .sort((a, b) => a.order - b.order);
    const index = targetTask
      ? destination.findIndex((t) => t.id === targetTask.id)
      : destination.length;
    destination.splice(Math.max(0, index), 0, task);
    doc.transact(() => {
      destination.forEach((t, i) =>
        patch(
          "tasks",
          t.id,
          { status, order: i },
          t.id === task.id
            ? (id) => [
                "moved a task",
                task.title,
                "task",
                id,
                `/tasks/${id}`,
                `${statusLabels[task.status]} → ${statusLabels[status]}`,
              ]
            : undefined,
        ),
      );
    });
  }
  function deleteTask(t) {
    if (confirm(`Delete “${t.title}”?`))
      remove("tasks", t.id, [
        "deleted a task",
        t.title,
        "task",
        t.id,
        "/workspace#kanban",
      ]);
  }
  return (
    <>
      <div className="section-toolbar" id="kanban">
        <h2>Team tasks</h2>
        <Button onClick={() => setEditing({})}>
          <Plus size={16} />
          Add task
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) =>
          setActive(tasks.find((t) => t.id === active.id))
        }
        onDragCancel={() => setActive(null)}
        onDragEnd={move}
      >
        <div className="kanban">
          {Object.keys(statusLabels).map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasks
                .filter((t) => t.status === status)
                .sort((a, b) => a.order - b.order)}
              onEdit={setEditing}
              onDelete={deleteTask}
            />
          ))}
        </div>
        <DragOverlay>
          {active && (
            <div className="task-tile">
              <strong>{active.title}</strong>
              <p>{active.assignee}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {editing && <TaskForm task={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
