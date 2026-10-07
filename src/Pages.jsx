import { uuid } from "./id";
import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Plus, Download, Trash2, Pencil, Check } from "lucide-react";
import { useRoom, useRoomLink, useRecords, useActions, timeAgo } from "./store";
import {
  Heading,
  Card,
  Field,
  Button,
  Go,
  Back,
  Badge,
  Empty,
  Modal,
} from "./ui";

const challenges = [
  {
    id: "a",
    name: "Connected communities",
    description:
      "Help people discover local connections and take part in community life.",
    goal: "Help newcomers discover local activities and make meaningful connections. Build an accessible way to explore the community and meet people with shared interests.",
    why: "Moving to a new place can feel isolating. This challenge is for students and local residents who want to find communities and participate in everyday life.",
  },
  {
    id: "b",
    name: "Sustainable campus",
    description: "Make sustainable habits part of everyday campus life.",
    goal: "Help students make practical sustainable choices at university.",
    why: "Small changes in daily habits can reduce waste and connect people around shared environmental goals.",
  },
  {
    id: "c",
    name: "Inclusive learning",
    description:
      "Make learning and collaboration more accessible for everyone.",
    goal: "Build an inclusive way to learn and collaborate with people with different needs.",
    why: "Access to learning should not depend on a person’s abilities, background or location.",
  },
];
export function Events() {
  const [selected, setSelected] = useState("a");
  return (
    <>
      <Heading
        title="Events & Challenges"
        context="Explore the event, choose a challenge, and start building with your team."
      />
      <div className="event-grid">
        <Card className="hero">
          <div>
            <span className="eyebrow">HACKRELAY / COMMUNITY HACKATHON</span>
            <h2>Build something that brings people together.</h2>
            <p>
              Turn a shared challenge into a working idea. Meet collaborators
              and build a project with real impact.
            </p>
            <p className="hint">
              01 Choose a challenge / 02 Find your team / 03 Start building
            </p>
          </div>
          <img src="/assets/community.svg" alt="Community connections" />
        </Card>
        <Card title="Event information">
          <h3>Date & time</h3>
          <p>To be announced</p>
          <h3>Location</h3>
          <p>Venue to be confirmed</p>
          <h3>Eligibility</h3>
          <p>Open to all experience levels</p>
        </Card>
      </div>
      <div className="section-toolbar" style={{ marginTop: 28 }}>
        <h2>Choose your challenge</h2>
        <span className="hint">3 challenges</span>
      </div>
      <div className="challenge-grid">
        {challenges.map((c) => (
          <button
            key={c.id}
            className={`card challenge-card ${selected === c.id ? "selected" : ""}`}
            onClick={() => setSelected(c.id)}
          >
            <span className="eyebrow">CHALLENGE {c.id.toUpperCase()}</span>
            <h3>{c.name}</h3>
            <p>{c.description}</p>
            {selected === c.id && <Badge>Selected</Badge>}
          </button>
        ))}
      </div>
      <div className="actions">
        <Go to="/workspace">My workspace</Go>
        <Go primary to={`/challenges/${selected}`}>
          Explore challenge →
        </Go>
        <Go to="/showcase">Project showcase</Go>
      </div>
    </>
  );
}
export function Challenge() {
  const { id } = useParams();
  const c = challenges.find((c) => c.id === id) || challenges[0];
  return (
    <>
      <Heading
        title="Challenge Brief"
        context={`Events / Challenge ${c.id.toUpperCase()}`}
      />
      <div className="two-columns">
        <div className="stack">
          <Card title="Challenge goal">
            <h3>{c.name}</h3>
            <p>{c.goal}</p>
          </Card>
          <Card title="Why this matters">
            <p>{c.why}</p>
          </Card>
          <Card title="Resources & judging">
            <p>Relevance · Usability · Feasibility · Impact</p>
            <Go to="/resources/challenge-pack">Open challenge pack →</Go>
          </Card>
        </div>
        <aside className="stack">
          <Card title="Participation information">
            <p>Open to all experience levels.</p>
            <p>Team size: up to 4 people.</p>
            <p>Deliverables: Prototype, demo and project summary.</p>
          </Card>
          <Go primary to={`/teams?challenge=${c.id}`}>
            Find a team →
          </Go>
        </aside>
      </div>
      <div className="actions">
        <Back to="/events" children="Back to events" />
      </div>
    </>
  );
}
export function Teams() {
  const teams = useRecords("teams");
  const { profile } = useRoom();
  const { patch } = useActions();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("team-a"),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    link = useRoomLink();
  const team = teams.find((t) => t.id === selected);
  const list = teams.filter((t) =>
    `${t.name} ${t.idea} ${t.skills}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  function join() {
    if (!team) return;
    const members = team.members || [];
    if (members.some((m) => m.id === profile.id)) {
      navigate(link("/workspace"));
      return;
    }
    if (members.length >= team.capacity) {
      setError("This team is full. Choose another team.");
      return;
    }
    patch(
      "teams",
      team.id,
      { members: [...members, { id: profile.id, name: profile.name }] },
      (id) => ["joined a team", team.name, "team", id, "/workspace"],
    );
    navigate(link("/workspace"));
  }
  return (
    <>
      <Heading
        title="Find a Team"
        context="Events / Connected communities / Teams"
      />
      <div className="two-columns">
        <div>
          <Field label="Search teams">
            <input
              type="search"
              placeholder="Search by team name or skills…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          {list.length ? (
            list.map((t) => (
              <button
                key={t.id}
                className={`team-item ${t.id === selected ? "selected" : ""}`}
                onClick={() => setSelected(t.id)}
              >
                <h3>
                  {t.name} · {t.idea}
                </h3>
                <p>{t.description}</p>
                <p>Looking for: {t.skills}</p>
                <p className="hint">
                  {t.members?.length || 0} of {t.capacity} members ·{" "}
                  {t.members?.length >= t.capacity ? "Full" : "Open to join"}
                </p>
              </button>
            ))
          ) : (
            <Empty>No teams found.</Empty>
          )}
        </div>
        <aside className="stack">
          <Card title="Team description">
            {team ? (
              <>
                <h3>
                  {team.name} · {team.idea}
                </h3>
                <p>{team.description}</p>
                <p>Looking for {team.skills.toLowerCase()}.</p>
                <h3 style={{ marginTop: 20 }}>Participants</h3>
                {team.members?.length ? (
                  team.members.map((m) => <p key={m.id}>{m.name}</p>)
                ) : (
                  <p>Be the first to join this team.</p>
                )}
              </>
            ) : (
              <p>Select a team.</p>
            )}
          </Card>
          <Go to="/teams/new">Create a team</Go>
        </aside>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="actions">
        <Button primary disabled={!team} onClick={join}>
          Join selected team →
        </Button>
        <Back to="/challenges/a" children="Back to brief" />
      </div>
    </>
  );
}
export function CreateTeam() {
  const { profile } = useRoom();
  const { save } = useActions();
  const navigate = useNavigate(),
    link = useRoomLink();
  const [form, setForm] = useState({
    name: "",
    idea: "",
    description: "",
    skills: "",
    challenge: "a",
    capacity: 4,
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <>
      <Heading
        title="Create a Team"
        context="Events / Connected communities / Create team"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(
            "teams",
            { ...form, members: [{ id: profile.id, name: profile.name }] },
            (id) => ["created a team", form.name, "team", id, "/teams"],
          );
          navigate(link("/workspace"));
        }}
      >
        <div className="two-columns">
          <Card title="Team details">
            <Field label="Challenge">
              <select
                value={form.challenge}
                onChange={(e) => set("challenge", e.target.value)}
              >
                {challenges.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Team name">
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Team idea">
              <textarea
                required
                value={form.idea}
                onChange={(e) => set("idea", e.target.value)}
                placeholder="Summarise what you want to build."
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field label="Skills you are looking for">
              <input
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
              />
            </Field>
          </Card>
          <Card title="Guidance">
            <p>Choose a clear team name.</p>
            <p>Keep your idea concise and connected to the challenge.</p>
            <p>Explain which skills or roles you are looking for.</p>
          </Card>
        </div>
        <div className="actions">
          <Back to="/teams" children="Go back" />
          <Button primary>Create team →</Button>
        </div>
      </form>
    </>
  );
}

function safeUrl(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function Resources() {
  const items = useRecords("resources");
  const { id } = useParams();
  const { profile } = useRoom();
  const { save, remove } = useActions();
  const link = useRoomLink(),
    navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState(""),
    [editing, setEditing] = useState(null),
    [file, setFile] = useState(null),
    [error, setError] = useState("");
  const selected = items.find((r) => r.id === id);
  const list = items.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) &&
      (!kind || r.kind === kind),
  );
  async function submit(e) {
    e.preventDefault();
    setError("");
    let resource = {
      ...editing,
      owner: editing.owner || profile.name,
      createdAt: editing.createdAt || Date.now(),
    };
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Please choose a file smaller than 5 MB.");
        return;
      }
      resource.dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      resource.filename = file.name;
      resource.mime = file.type;
    }
    if (resource.kind === "Link" && !safeUrl(resource.url)) {
      setError("Use a valid http or https link.");
      return;
    }
    const resourceId = save("resources", resource, (id) => [
      editing.id ? "updated a resource" : "shared a resource",
      editing.title,
      "resource",
      id,
      `/resources/${id}`,
      resource.kind,
    ]);
    setEditing(null);
    setFile(null);
    navigate(link(`/resources/${resourceId}`));
  }
  return (
    <>
      <Heading
        title="Shared Resources"
        context="Workspace / Shared resources"
      />
      <Card>
        <div className="filter-row">
          <Field label="Search resources">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources…"
            />
          </Field>
          <Field label="Type">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">All types</option>
              <option>Document</option>
              <option>Link</option>
              <option>File</option>
            </select>
          </Field>
          <Button
            onClick={() => {
              setFile(null);
              setError("");
              setEditing({
                title: "",
                kind: "Document",
                description: "",
                content: "",
                url: "",
              });
            }}
          >
            <Plus size={16} />
            Add resource
          </Button>
        </div>
      </Card>
      <div className="two-columns">
        <Card title="Resource list">
          {list.length ? (
            list.map((r) => (
              <Link
                key={r.id}
                className={`resource-item ${r.id === id ? "selected" : ""}`}
                to={link(`/resources/${r.id}`)}
              >
                <h3>{r.title}</h3>
                <p>
                  {r.kind} · {r.owner} · {timeAgo(r.createdAt)}
                </p>
              </Link>
            ))
          ) : (
            <Empty>No resources found.</Empty>
          )}
        </Card>
        <Card title="Resource details">
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>
              <p className="hint">
                {selected.owner} · {timeAgo(selected.createdAt)}
              </p>
              {selected.content && (
                <pre style={{ marginTop: 20 }}>{selected.content}</pre>
              )}
              {selected.url && safeUrl(selected.url) && (
                <a
                  className="button"
                  href={safeUrl(selected.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open resource ↗
                </a>
              )}
              {selected.dataUrl && (
                <>
                  <a
                    className="button"
                    href={selected.dataUrl}
                    download={selected.filename}
                  >
                    <Download size={16} />
                    Download {selected.filename}
                  </a>
                  {selected.mime?.startsWith("image/") && (
                    <img
                      className="file-preview"
                      src={selected.dataUrl}
                      alt={selected.title}
                    />
                  )}
                </>
              )}
              <div className="actions">
                <Button
                  onClick={() => {
                    setFile(null);
                    setEditing(selected);
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </Button>
                <Button
                  danger
                  onClick={() => {
                    if (confirm("Delete this resource?")) {
                      remove("resources", selected.id, [
                        "deleted a resource",
                        selected.title,
                        "resource",
                        selected.id,
                        "/resources",
                      ]);
                      navigate(link("/resources"));
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <Empty>
              {id
                ? "This resource has been deleted."
                : "Choose a resource to see its details."}
            </Empty>
          )}
        </Card>
      </div>
      <div className="actions">
        <Back />
      </div>
      {editing && (
        <Modal
          title={editing.id ? "Edit resource" : "Add resource"}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submit}>
            <Field label="Title">
              <input
                required
                autoFocus
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Type">
              <select
                value={editing.kind}
                onChange={(e) =>
                  setEditing({ ...editing, kind: e.target.value })
                }
              >
                <option>Document</option>
                <option>Link</option>
                <option>File</option>
              </select>
            </Field>
            <Field label="Description">
              <input
                value={editing.description || ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </Field>
            {editing.kind === "Document" ? (
              <Field label="Document content">
                <textarea
                  rows={5}
                  value={editing.content || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, content: e.target.value })
                  }
                />
              </Field>
            ) : editing.kind === "Link" ? (
              <Field label="Link">
                <input
                  type="url"
                  required
                  value={editing.url || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, url: e.target.value })
                  }
                />
              </Field>
            ) : (
              <Field label="File (up to 5 MB)">
                <input
                  type="file"
                  required={!editing.dataUrl}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Field>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="actions">
              <Button type="button" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button primary>Save resource</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Help() {
  const [helpParams] = useSearchParams();
  const highlighted = helpParams.get("request");
  const requests = useRecords("help");
  const { profile } = useRoom();
  const { save } = useActions();
  const [category, setCategory] = useState("Technical support"),
    [description, setDescription] = useState(""),
    [table, setTable] = useState("01"),
    [sent, setSent] = useState(null);
  return (
    <>
      <Heading title="On-site Help" context="Workspace / Get help" />
      <div className="two-columns">
        <div className="stack">
          <Card title="Help request">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const id = save(
                  "help",
                  {
                    category,
                    description,
                    table,
                    status: "Requested",
                    requester: profile.name,
                    createdAt: Date.now(),
                  },
                  (id) => [
                    "requested help",
                    category,
                    "help",
                    id,
                    `/help?request=${id}`,
                    `Table ${table}`,
                  ],
                );
                setSent(id);
                setDescription("");
              }}
            >
              <Field label="Help category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {[
                    "Technical support",
                    "Design feedback",
                    "Accessibility",
                    "Event logistics",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Describe what you need">
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a short description of your issue."
                />
              </Field>
              <Button primary>Send help request</Button>
            </form>
          </Card>
          <Card title="Venue map">
            <div className="venue-map">
              {["01", "02", "03", "04", "05", "06"].map((v) => (
                <Button
                  key={v}
                  className={v === table ? "selected" : ""}
                  onClick={() => setTable(v)}
                >
                  Table {v}
                </Button>
              ))}
            </div>
            <p className="hint">Selected location: Table {table}</p>
          </Card>
        </div>
        <aside className="stack">
          <Card title="Request status">
            {sent && (
              <p className="inline-notice" role="status">
                Your request was sent. Location: Table {table}.
              </p>
            )}
            {requests.length ? (
              requests
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((r) => (
                  <div
                    className={`comment ${highlighted === r.id ? "highlighted" : ""}`}
                    id={`help-${r.id}`}
                    key={r.id}
                  >
                    <strong>{r.category}</strong>
                    <p>{r.description}</p>
                    <p>
                      Table {r.table} · {r.requester}
                    </p>
                    <Badge>{r.status}</Badge>
                  </div>
                ))
            ) : (
              <p>Send a request and a mentor can meet you at your table.</p>
            )}
          </Card>
          <Card title="Other support">
            <p>Help desk · Main entrance</p>
            <p>Ask an event organiser in person.</p>
            <Go to="/docs?section=rules">Read the event handbook →</Go>
          </Card>
        </aside>
      </div>
      <div className="actions">
        <Back />
      </div>
    </>
  );
}

const blankSubmission = {
  name: "",
  summary: "",
  demo: "",
  repository: "",
  credits: "",
  external: "",
  creditChecked: false,
  rulesChecked: false,
};
export function Submission() {
  const drafts = useRecords("drafts");
  const draft = drafts.find((d) => d.id === "project");
  const { save } = useActions();
  const navigate = useNavigate(),
    link = useRoomLink();
  const [form, setForm] = useState(() => ({ ...blankSubmission, ...draft })),
    [message, setMessage] = useState("");
  const set = (k, v) => setForm({ ...form, [k]: v });
  function persist(preview) {
    save("drafts", { ...form, id: "project" }, () => [
      "saved a submission draft",
      form.name || "Untitled project",
      "submission",
      "project",
      "/submission",
    ]);
    if (preview) navigate(link("/submission/preview"));
    else {
      setMessage("Draft saved.");
      setTimeout(() => setMessage(""), 2500);
    }
  }
  return (
    <>
      <Heading
        title="Project Submission"
        context="Workspace / Prepare submission"
      />
      <Card title="Submission context">
        <p>HackRelay / Connected communities / Team A</p>
      </Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          persist(true);
        }}
      >
        <div className="two-columns">
          <div className="stack">
            <Card title="Project & solution">
              <Field label="Project name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Solution summary">
                <textarea
                  required
                  rows={5}
                  value={form.summary}
                  onChange={(e) => set("summary", e.target.value)}
                />
              </Field>
              <Field label="Demo or prototype link">
                <input
                  required
                  type="url"
                  value={form.demo}
                  onChange={(e) => set("demo", e.target.value)}
                />
              </Field>
              <Field label="Repository link">
                <input
                  type="url"
                  value={form.repository}
                  onChange={(e) => set("repository", e.target.value)}
                />
              </Field>
            </Card>
            <Card title="Credits & declarations">
              <Field label="Team members and contributions">
                <textarea
                  required
                  value={form.credits}
                  onChange={(e) => set("credits", e.target.value)}
                />
              </Field>
              <Field label="External materials / AI tools used">
                <textarea
                  value={form.external}
                  onChange={(e) => set("external", e.target.value)}
                />
              </Field>
              <div className="checklist">
                <label>
                  <input
                    type="checkbox"
                    required
                    checked={form.creditChecked}
                    onChange={(e) => set("creditChecked", e.target.checked)}
                  />
                  We have credited external resources.
                </label>
                <label>
                  <input
                    type="checkbox"
                    required
                    checked={form.rulesChecked}
                    onChange={(e) => set("rulesChecked", e.target.checked)}
                  />
                  We confirm this submission follows the event rules.
                </label>
              </div>
            </Card>
          </div>
          <Card title="Submission checklist">
            {[
              ["name", "Project name"],
              ["summary", "Solution summary"],
              ["demo", "Demo or prototype link"],
              ["credits", "Team credits"],
              ["creditChecked", "External resource declaration"],
              ["rulesChecked", "Event rules declaration"],
            ].map(([k, label]) => (
              <p key={k} style={{ marginBottom: 16 }}>
                {form[k] ? "✓" : "○"} {label}
              </p>
            ))}
          </Card>
        </div>
        <div className="actions">
          <Button type="button" onClick={() => persist(false)}>
            Save draft
          </Button>
          <Button primary>Preview →</Button>
          <Back />
        </div>
        {message && <p role="status">{message}</p>}
      </form>
    </>
  );
}
export function Preview() {
  const draft = useRecords("drafts").find((d) => d.id === "project");
  const { save } = useActions();
  const { profile } = useRoom();
  const navigate = useNavigate(),
    link = useRoomLink();
  const [confirming, setConfirming] = useState(false);
  if (!draft?.name)
    return (
      <>
        <Heading
          title="Submission Preview"
          context="Complete your project details first."
        />
        <Go to="/submission">Prepare submission</Go>
      </>
    );
  const valid =
    draft.name &&
    draft.summary &&
    draft.demo &&
    draft.credits &&
    draft.creditChecked &&
    draft.rulesChecked;
  function submit() {
    const id = save(
      "submissions",
      {
        ...draft,
        id: uuid(),
        submittedAt: Date.now(),
        submitter: profile.name,
        challenge: "Connected communities",
        team: "Team A",
      },
      (id) => [
        "submitted a project",
        draft.name,
        "submission",
        id,
        `/projects/${id}`,
      ],
    );
    navigate(link(`/submission/complete/${id}`));
  }
  return (
    <>
      <Heading
        title="Submission Preview"
        context="Workspace / Prepare submission / Preview"
      />
      <div className="two-columns">
        <div className="stack">
          <Card title="Project overview">
            <h3>{draft.name}</h3>
            <p>Challenge: Connected communities / Team A</p>
          </Card>
          <Card title="Solution summary">
            <p>{draft.summary}</p>
          </Card>
          <Card title="Links & credits">
            <p>Demo: {draft.demo}</p>
            <p>Repository: {draft.repository || "Not provided"}</p>
            <p>{draft.credits}</p>
            <p>External resources: {draft.external || "None"}</p>
          </Card>
        </div>
        <aside className="stack">
          <Card title="Final checklist">
            <p>
              {valid
                ? "✓ Required details complete"
                : "Some required details are missing. Return to edit."}
            </p>
            <p>Review all links and credits before submitting.</p>
          </Card>
          <Card title="Before you submit">
            <p>Your project will appear in the project showcase.</p>
          </Card>
        </aside>
      </div>
      <div className="actions">
        <Back to="/submission" children="Back to edit" />
        <Button primary disabled={!valid} onClick={() => setConfirming(true)}>
          Submit project
        </Button>
      </div>
      {confirming && (
        <Modal
          title={`Submit ${draft.name}?`}
          onClose={() => setConfirming(false)}
        >
          <p>The project will be added to the event submission record.</p>
          <div className="actions">
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
            <Button primary onClick={submit}>
              Confirm submission
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function SubmissionComplete() {
  const { id } = useParams();
  const project = useRecords("submissions").find((p) => p.id === id);
  return (
    <>
      <Heading
        title="Submission Complete"
        context="Your project has been added to the event submission record."
      />
      <Card>
        <div className="success-mark">✓</div>
        <h2>Project submitted</h2>
        <h3>{project?.name}</h3>
        <p>Reference: {id}</p>
        <p>
          Submitted:{" "}
          {project ? new Date(project.submittedAt).toLocaleString() : ""}
        </p>
        <Badge tone="success">Received</Badge>
      </Card>
      <Card title="What happens next" className="next-card">
        <p>
          Your team can view the submission and share the project through the
          showcase.
        </p>
      </Card>
      <div className="actions">
        <Go to={`/projects/${id}`}>View submission</Go>
        <Back />
        <Go to="/showcase">Project showcase</Go>
      </div>
    </>
  );
}
const exampleProjects = [
  {
    id: "community",
    name: "Community Connect",
    summary: "Discover local activities and find your people.",
    challenge: "Connected communities",
    team: "Team A",
    credits:
      "Jordan Davis · Design / Maya Patel · Development / Sam Lee · Data",
  },
  {
    id: "campus",
    name: "Campus Loop",
    summary: "Make reuse part of everyday campus life.",
    challenge: "Sustainable campus",
    team: "Team B",
  },
  {
    id: "notes",
    name: "Neighbourhood Notes",
    summary: "Exchange useful local knowledge.",
    challenge: "Connected communities",
    team: "Team C",
  },
  {
    id: "learning",
    name: "Learn Together",
    summary: "Make learning accessible for everyone.",
    challenge: "Inclusive learning",
    team: "Team D",
  },
];
export function Showcase() {
  const submissions = useRecords("submissions");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("");
  const projects = [...submissions, ...exampleProjects].filter(
    (p) =>
      `${p.name} ${p.summary} ${p.team}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!filter || p.challenge === filter),
  );
  return (
    <>
      <Heading
        title="Project Showcase"
        context="Explore submitted projects and compare how teams approached the event challenges."
      />
      <Card>
        <div className="filter-row">
          <Field label="Search projects">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Projects, teams or challenges…"
            />
          </Field>
          <Field label="Challenge">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All challenges</option>
              {challenges.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>
      <div className="showcase-grid">
        {projects.map((p) => (
          <Card key={p.id} title={p.name}>
            <p>
              {p.challenge} · {p.team}
            </p>
            <p>{p.summary}</p>
            <Go to={`/projects/${p.id}`}>View project →</Go>
          </Card>
        ))}
      </div>
      {!projects.length && <Empty>No projects match your search.</Empty>}
    </>
  );
}
export function ProjectDetails() {
  const { id } = useParams();
  const project = [...useRecords("submissions"), ...exampleProjects].find(
    (p) => p.id === id,
  );
  if (!project)
    return (
      <>
        <Heading
          title="Project unavailable"
          context="The project could not be found."
        />
        <Back to="/showcase" children="Back to showcase" />
      </>
    );
  return (
    <>
      <Heading
        title={project.name}
        context={`Project showcase / ${project.challenge} / ${project.team}`}
      />
      <div className="two-columns">
        <div className="stack">
          <Card title="Demo & screenshots">
            <h3>{project.name}</h3>
            {safeUrl(project.demo) ? (
              <a
                className="button"
                href={safeUrl(project.demo)}
                target="_blank"
                rel="noreferrer"
              >
                Open demo ↗
              </a>
            ) : (
              <p>This example project has no demo link.</p>
            )}
          </Card>
          <Card title="Solution & impact">
            <p>{project.summary}</p>
          </Card>
          <Card title="Published feedback">
            <p>
              Feedback pending. Organiser feedback will appear here when
              published.
            </p>
          </Card>
        </div>
        <aside className="stack">
          <Card title="Project & contributors">
            <p>{project.team}</p>
            <p>{project.credits || "Team credits not yet published."}</p>
          </Card>
          <Card title="Links & disclosures">
            {safeUrl(project.repository) && (
              <a
                href={safeUrl(project.repository)}
                target="_blank"
                rel="noreferrer"
              >
                Open repository ↗
              </a>
            )}
            <p>External resources: {project.external || "None declared"}</p>
          </Card>
        </aside>
      </div>
      <div className="actions">
        <Back to="/showcase" children="Back to showcase" />
      </div>
    </>
  );
}

export function ReportForm() {
  const { profile } = useRoom();
  const { save } = useActions();
  const navigate = useNavigate(),
    link = useRoomLink();
  const [form, setForm] = useState({
      related: "Team workspace",
      category: "Conduct",
      affected: "Myself",
      description: "",
      evidence: "",
    }),
    [files, setFiles] = useState([]),
    [error, setError] = useState("");
  const set = (k, v) => setForm({ ...form, [k]: v });
  async function submit(e) {
    e.preventDefault();
    if (files.reduce((n, f) => n + f.size, 0) > 5 * 1024 * 1024) {
      setError("Keep attachments under 5 MB in total.");
      return;
    }
    const attachments = await Promise.all(
      files.map(
        (f) =>
          new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve({ name: f.name, dataUrl: r.result });
            r.onerror = reject;
            r.readAsDataURL(f);
          }),
      ),
    );
    const id = save(
      "reports",
      {
        ...form,
        ownerId: profile.id,
        reporter: profile.name,
        status: "Submitted",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        attachments,
        comments: [],
      },
      (id) => [
        "submitted a report",
        form.category,
        "report",
        id,
        `/reports/${id}`,
      ],
    );
    navigate(link(`/reports/${id}`));
  }
  return (
    <>
      <Heading
        title="Report an Issue"
        context="Tell the organisers about a conduct, safety, privacy or submission concern."
      />
      <Card title="Report context" className="tinted">
        <p>
          Describe the issue and include the information needed to understand
          it.
        </p>
      </Card>
      <form onSubmit={submit}>
        <div className="two-columns">
          <div className="stack">
            <Card title="Linked item & category">
              <Field label="Related item">
                <input
                  required
                  value={form.related}
                  onChange={(e) => set("related", e.target.value)}
                />
              </Field>
              <Field label="Issue category">
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {[
                    "Conduct",
                    "Safety",
                    "Privacy",
                    "Submission concern",
                    "Technical issue",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Who is affected">
                <select
                  value={form.affected}
                  onChange={(e) => set("affected", e.target.value)}
                >
                  <option>Myself</option>
                  <option>My team</option>
                  <option>Another participant</option>
                </select>
              </Field>
            </Card>
            <Card title="Description & evidence">
              <Field label="What happened">
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
              <Field label="Additional details or links">
                <textarea
                  value={form.evidence}
                  onChange={(e) => set("evidence", e.target.value)}
                />
              </Field>
              <Field label="Attach screenshots or files (up to 5 MB)">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles([...e.target.files])}
                />
              </Field>
            </Card>
          </div>
          <Card title="What happens next">
            <p>Your report is saved to your profile’s report list.</p>
            <p>
              For urgent safety issues, contact an organiser in person. If
              someone is in immediate danger, contact local emergency services.
            </p>
          </Card>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          <Button primary>Submit report</Button>
          <Back to="/reports" children="Cancel" />
        </div>
      </form>
    </>
  );
}
export function Reports() {
  const { profile } = useRoom();
  const reports = useRecords("reports").filter((r) => r.ownerId === profile.id);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("");
  const list = reports.filter(
    (r) =>
      `${r.related} ${r.category} ${r.id}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || r.status === status),
  );
  return (
    <>
      <Heading title="My Report" context="Report / My report" />
      <Card title="Search & status filters">
        <div className="filter-row">
          <Field label="Search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {[
                "Submitted",
                "Under review",
                "Needs information",
                "Resolved",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>
      <Card title="My Report List" style={{ marginTop: 24 }}>
        <p style={{ marginBottom: 20 }}>
          {list.length} reports · Reports for {profile.name}
        </p>
        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Related item</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id.slice(0, 8).toUpperCase()}</td>
                    <td>{r.related}</td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>{timeAgo(r.updatedAt)}</td>
                    <td>
                      <Go to={`/reports/${r.id}`}>View →</Go>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No reports to show.</Empty>
        )}
      </Card>
      <Card title="Status Guide" style={{ marginTop: 16 }}>
        <p>Submitted → Under review → Needs information → Resolved</p>
      </Card>
      <div className="actions">
        <Go primary to="/reports/new">
          Report an issue
        </Go>
      </div>
    </>
  );
}
export function ReportDetails() {
  const { id } = useParams();
  const { profile } = useRoom();
  const report = useRecords("reports").find(
    (r) => r.id === id && r.ownerId === profile.id,
  );
  const { patch } = useActions();
  const [text, setText] = useState("");
  if (!report)
    return (
      <>
        <Heading
          title="Report unavailable"
          context="This report is not available for your profile."
        />
        <Back to="/reports" children="Back to my reports" />
      </>
    );
  return (
    <>
      <Heading
        title="Report Details"
        context={`Report / ${id.slice(0, 8).toUpperCase()}`}
      />
      <Card title="Case summary">
        <Badge>{report.status}</Badge>
        <p>
          {report.category} · Updated {timeAgo(report.updatedAt)}
        </p>
      </Card>
      <div className="two-columns">
        <div className="stack">
          <Card title="Original report">
            <p>Reporter: {report.reporter}</p>
            <p>Related item: {report.related}</p>
            <p>{report.description}</p>
            <p>{report.evidence}</p>
            {report.attachments?.map((a, i) => (
              <a className="button" key={i} href={a.dataUrl} download={a.name}>
                <Download size={16} />
                {a.name}
              </a>
            ))}
          </Card>
          <Card title="Additional information">
            {report.comments?.map((c) => (
              <div className="comment" key={c.id}>
                <p>{c.text}</p>
                <small>{timeAgo(c.createdAt)}</small>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                patch(
                  "reports",
                  id,
                  {
                    comments: [
                      ...(report.comments || []),
                      { id: uuid(), text, createdAt: Date.now() },
                    ],
                    updatedAt: Date.now(),
                  },
                  (id) => [
                    "added report information",
                    report.category,
                    "report",
                    id,
                    `/reports/${id}`,
                  ],
                );
                setText("");
              }}
            >
              <Field label="Add details">
                <textarea
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </Field>
              <Button primary>Send additional info</Button>
            </form>
          </Card>
        </div>
        <Card title="Case timeline">
          <p>
            {new Date(report.createdAt).toLocaleString()} · Report submitted
          </p>
          {report.comments?.map((c) => (
            <p key={c.id}>
              {new Date(c.createdAt).toLocaleString()} · Information added
            </p>
          ))}
          <p>No organiser decision has been recorded.</p>
        </Card>
      </div>
      <div className="actions">
        <Back to="/reports" children="Back to my reports" />
      </div>
    </>
  );
}
const articles = {
  about: {
    title: "About HackRelay",
    text: "HackRelay is a collaborative event platform for participants, mentors, judges and organisers. The platform supports discovery, shared work and project submissions.",
    sections: [
      [
        "What HackRelay supports",
        "Discover events and challenges.\nWork with a team in a shared workspace.\nLink repositories, documents and reports.\nTrack decisions and handoffs.",
      ],
      [
        "Platform principles",
        "Keep work visible, communicate respectfully and document important decisions.",
      ],
    ],
  },
  rules: {
    title: "Event Rules",
    text: "Respect other participants, acknowledge sources, and build around the selected challenge.",
    sections: [
      [
        "Teams and submissions",
        "Teams have up to four participants. Include a demo or prototype link, solution summary and team credits in the submission.",
      ],
      [
        "Respect and conduct",
        "Report concerns to event organisers. For urgent issues, contact an organiser in person.",
      ],
    ],
  },
  how: {
    title: "How to use",
    text: "Choose a challenge and find a team. Open Workspace to plan and manage your project.",
    sections: [
      [
        "Workflow",
        "Drag blocks to move them. Drag between connection dots to link steps. Double-click a block to edit. Select a block or edge and use Delete to remove it. The controls zoom and fit the canvas. Drag the bottom-right grip to resize.",
      ],
      [
        "Kanban",
        "Use Add task to create a card. Move cards using the drag handle, or edit their status. Open a task to write a handoff note and add comments.",
      ],
      [
        "Live collaboration",
        "Open Repository, share the same room link with a teammate, and choose different display names. Type in the shared code editor; text and cursors sync automatically.",
      ],
    ],
  },
  reporting: {
    title: "Reporting & moderation",
    text: "Use Report an Issue to record a concern. Reports are listed under the browser profile that submitted them.",
    sections: [
      [
        "Prototype evaluation",
        "This local prototype uses display names rather than authenticated accounts. Real organiser moderation and private report permissions require an authenticated deployment.",
      ],
      [
        "Support",
        "Use Get help for technical support, design feedback or event logistics.",
      ],
    ],
  },
};
export function Docs() {
  const [params, setParams] = useSearchParams();
  const key = articles[params.get("section")] ? params.get("section") : "about";
  const article = articles[key];
  const { room } = useRoom();
  return (
    <>
      <Heading
        title="Documents"
        context="HackRelay knowledge base / Event handbook"
      />
      <div className="document-layout">
        <Card title="Contents" className="document-nav">
          {Object.entries(articles).map(([id, a]) => (
            <button
              key={id}
              className={id === key ? "active" : ""}
              onClick={() => setParams({ room, section: id })}
            >
              {a.title}
            </button>
          ))}
        </Card>
        <Card title={article.title} className="document-content">
          <p>{article.text}</p>
          {article.sections.map(([title, text]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </section>
          ))}
        </Card>
      </div>
      <div className="actions">
        <Back />
      </div>
    </>
  );
}
export function Profile() {
  const { profile, setProfile } = useRoom();
  const [draft, setDraft] = useState(profile),
    [saved, setSaved] = useState(false);
  return (
    <>
      <Heading
        title="Personal Profile"
        context="Profile / Participant / Public information"
      />
      <div className="two-columns">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            setProfile(draft);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          <Card>
            <div className="profile-header">
              <div className="profile-avatar">
                {profile.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <h2>{profile.name}</h2>
                <p>Participant · HackRelay</p>
              </div>
            </div>
          </Card>
          <Card title="Profile details">
            <Field label="Display name">
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={draft.description || ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
            <Field label="Skills & interests">
              <input
                value={draft.skills || ""}
                onChange={(e) => setDraft({ ...draft, skills: e.target.value })}
              />
            </Field>
            <Field label="Cursor colour">
              <input
                type="color"
                value={draft.color}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              />
            </Field>
          </Card>
          <div className="actions">
            <Button primary>{saved ? "Saved ✓" : "Save profile"}</Button>
            <Back />
          </div>
        </form>
        <Card title="Find collaborators">
          <p>Explore teams looking for your skills and interests.</p>
          <Go to="/teams">Find a team →</Go>
        </Card>
      </div>
    </>
  );
}
