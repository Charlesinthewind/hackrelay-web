import { uuid } from "./id";
import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useRecords, useActions, useRoom, useRoomLink, timeAgo } from "./store";
import {
  Card,
  Heading,
  Go,
  Button,
  Field,
  Back,
  Badge,
  Empty,
  statusLabels,
} from "./ui";
import Workflow from "./Workflow";
import Kanban, { TaskForm } from "./Kanban";
export function Workspace() {
  const tasks = useRecords("tasks");
  const activity = useRecords("activity");
  const { room } = useRoom();
  const link = useRoomLink();
  const location = useLocation();
  useEffect(() => {
    if (location.hash)
      setTimeout(
        () =>
          document
            .getElementById(location.hash.slice(1))
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        100,
      );
  }, [location.hash]);
  return (
    <>
      <Heading
        title="Team Workspace"
        context={`Connected communities / ${room} / Table 01`}
      />
      <div className="workspace-layout">
        <div className="workspace-main stack">
          <Workflow />
          <Kanban />
          <div className="actions">
            <Go to="/code">Open live code</Go>
            <Go primary to="/submission">
              Prepare submission
            </Go>
            <Go to="/showcase">Project showcase</Go>
          </div>
        </div>
        <aside className="stack">
          <Card title="Shared Resources">
            <p>Files, links, and reference materials.</p>
            <Go to="/resources">Open resources →</Go>
          </Card>
          <Card title="Recent activity">
            <div className="recent-list">
              {activity
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 3)
                .map((a) => (
                  <Link key={a.id} to={link(a.path)}>
                    <strong>
                      {a.actor} {a.verb}
                    </strong>
                    <span>
                      {a.title} · {timeAgo(a.createdAt)}
                    </span>
                  </Link>
                ))}
            </div>
            <Go to="/activity">View all activity →</Go>
          </Card>
          <Go to="/help">Get help</Go>
          <Card title="Challenge brief">
            <h3>Connected communities</h3>
            <p>Help people find local connections.</p>
            <p>Relevance · Usability · Impact</p>
            <Go to="/challenges/a">View full brief →</Go>
          </Card>
        </aside>
      </div>
    </>
  );
}
export function TaskDetails() {
  const { id } = useParams();
  const tasks = useRecords("tasks");
  const task = tasks.find((t) => t.id === id);
  const events = useRecords("activity")
    .filter((a) => a.type === "task" && a.targetId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const { patch } = useActions();
  const { profile } = useRoom();
  const [note, setNote] = useState(""),
    [dirty, setDirty] = useState(false),
    [editing, setEditing] = useState(false),
    [comment, setComment] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setNote(task?.note || "");
    setDirty(false);
  }, [id]);
  useEffect(() => {
    if (!dirty) setNote(task?.note || "");
  }, [task?.note, dirty]);
  if (!task)
    return (
      <>
        <Heading
          title="Task unavailable"
          context="This task may have been deleted."
        />
        <Back />
      </>
    );
  const dependency = tasks.find((t) => t.id === task.dependency);
  function saveNote() {
    patch("tasks", id, { note }, (id) => [
      "updated a handoff note",
      task.title,
      "task",
      id,
      `/tasks/${id}`,
    ]);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  return (
    <>
      <Heading
        title="Task Details & Handoff"
        context={`Workspace / ${task.title}`}
      >
        <Button onClick={() => setEditing(true)}>
          <Pencil size={16} />
          Edit task
        </Button>
      </Heading>
      <div className="two-columns">
        <div className="stack">
          <Card title="Task summary">
            <h3>{task.title}</h3>
            <p>{task.description || "No description yet."}</p>
            <div className="metadata">
              <span>Owner: {task.assignee || "Unassigned"}</span>
              <Badge>{statusLabels[task.status]}</Badge>
              {task.due && <span>Due: {task.due}</span>}
            </div>
          </Card>
          <Card title="Dependencies">
            {dependency ? (
              <Go to={`/tasks/${dependency.id}`}>
                {dependency.title} {dependency.status === "done" ? "✓" : "→"}
              </Go>
            ) : (
              <p>No dependencies.</p>
            )}
          </Card>
          <Card title="Handoff note">
            <Field label="Completed work, remaining work and linked materials">
              <textarea
                rows={6}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setDirty(true);
                }}
                placeholder="What should the next teammate know?"
              />
            </Field>
            <div className="actions">
              <Button primary onClick={saveNote}>
                {saved ? "Saved ✓" : "Save handoff note"}
              </Button>
              {dirty && <span className="hint">Unsaved changes</span>}
            </div>
          </Card>
        </div>
        <aside className="stack">
          <Card title="Task history & discussion">
            <div className="compact-timeline">
              {events.slice(0, 8).map((a) => (
                <p key={a.id}>
                  <strong>
                    {a.actor} {a.verb}
                  </strong>
                  <br />
                  {timeAgo(a.createdAt)}
                </p>
              ))}
            </div>
            {task.comments?.map((c) => (
              <div className="comment" key={c.id}>
                <strong>{c.author}</strong>
                <p>{c.text}</p>
                <small>{timeAgo(c.createdAt)}</small>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                patch(
                  "tasks",
                  id,
                  {
                    comments: [
                      ...(task.comments || []),
                      {
                        id: uuid(),
                        author: profile.name,
                        text: comment,
                        createdAt: Date.now(),
                      },
                    ],
                  },
                  (id) => [
                    "commented on a task",
                    task.title,
                    "task",
                    id,
                    `/tasks/${id}`,
                  ],
                );
                setComment("");
              }}
            >
              <Field label="Add a comment">
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Field>
              <Button>Post comment</Button>
            </form>
          </Card>
          <Go to="/code">Open linked code</Go>
          <Button
            primary
            disabled={task.status === "review"}
            onClick={() =>
              patch("tasks", id, { status: "review" }, (id) => [
                "marked a task ready for review",
                task.title,
                "task",
                id,
                `/tasks/${id}`,
              ])
            }
          >
            {task.status === "review"
              ? "Ready for review"
              : "Mark ready for review"}
          </Button>
        </aside>
      </div>
      <div className="actions">
        <Back />
      </div>
      {editing && <TaskForm task={task} onClose={() => setEditing(false)} />}
    </>
  );
}
export function Activity() {
  const all = useRecords("activity");
  const { profile } = useRoom();
  const { activity } = useActions();
  const [member, setMember] = useState(""),
    [type, setType] = useState(""),
    [date, setDate] = useState("");
  const link = useRoomLink();
  const people = [...new Set(all.map((a) => a.actor))];
  const events = all
    .filter(
      (a) =>
        (!member || a.actor === member) &&
        (!type || a.type === type) &&
        (!date || new Date(a.createdAt).toLocaleDateString("en-CA") === date),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  function download() {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hackrelay-contributions.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <Heading
        title="Activity & Contributions"
        context="Workspace / Activity"
      />
      <Card>
        <div className="filter-row">
          <Field label="Member">
            <select value={member} onChange={(e) => setMember(e.target.value)}>
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Activity type">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All activity</option>
              {[
                "task",
                "workflow",
                "code",
                "resource",
                "team",
                "submission",
                "help",
                "report",
                "contribution",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Button
            onClick={() => {
              setMember("");
              setType("");
              setDate("");
            }}
          >
            Clear filters
          </Button>
        </div>
      </Card>
      <div className="two-columns">
        <Card title="Team timeline" className="timeline">
          {events.length ? (
            events.map((a) => (
              <Link className="activity-row" key={a.id} to={link(a.path)}>
                <span className="activity-dot" />
                <div>
                  <strong>
                    {a.actor} {a.verb}
                  </strong>
                  <p>
                    {a.title}
                    {a.detail ? ` · ${a.detail}` : ""}
                  </p>
                  <small>{timeAgo(a.createdAt)}</small>
                </div>
                <span className="activity-arrow">→</span>
              </Link>
            ))
          ) : (
            <Empty>No activity matches these filters.</Empty>
          )}
        </Card>
        <Card title="Contributors">
          {people.map((p) => (
            <div className="contributor" key={p}>
              <strong>{p}</strong>
              <span>
                {all.filter((a) => a.actor === p).length} contributions
              </span>
            </div>
          ))}
          <p className="hint">
            Activity links open the exact task, resource or code file. Deleted
            items return to the workspace.
          </p>
        </Card>
      </div>
      <div className="actions">
        <Button primary onClick={download}>
          Export contributions
        </Button>
        <Back />
      </div>
    </>
  );
}
