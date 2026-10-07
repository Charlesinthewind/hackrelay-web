export function seedRoom(doc) {
  if (doc.getMap("meta").get("initialized")) return;
  doc.transact(() => {
    doc.getMap("meta").set("initialized", true);
    const put = (collection, records) =>
      records.forEach((r) => doc.getMap(collection).set(r.id, r));
    put("teams", [
      {
        id: "team-a",
        name: "Team A",
        idea: "Community Connect",
        description: "Building a welcoming way to discover local activities.",
        skills: "Design, Frontend development",
        challenge: "a",
        members: [],
        capacity: 4,
      },
      {
        id: "team-b",
        name: "Team B",
        idea: "Campus Loop",
        description: "Connecting neighbours through shared interests.",
        skills: "Research, Storytelling",
        challenge: "a",
        members: [],
        capacity: 4,
      },
    ]);
    put("tasks", [
      {
        id: "needs",
        title: "Define user needs",
        description:
          "Interview participants and define the needs for Community Connect.",
        assignee: "Alex Chen",
        status: "todo",
        due: "15:30",
        order: 0,
        note: "",
        dependency: "",
        comments: [],
      },
      {
        id: "sketch",
        title: "Sketch main screens",
        description: "Sketch the event discovery and community pages.",
        assignee: "Alex Chen",
        status: "todo",
        due: "15:30",
        order: 1,
        note: "",
        dependency: "needs",
        comments: [],
      },
      {
        id: "prototype",
        title: "Build first prototype",
        description:
          "Build the community discovery prototype. Create a searchable event list and an accessible detail view.",
        assignee: "Maya Patel",
        status: "progress",
        due: "16:00",
        order: 0,
        note: "",
        dependency: "needs",
        comments: [],
      },
      {
        id: "fit",
        title: "Review challenge fit",
        description: "Check that the project addresses the challenge criteria.",
        assignee: "Alex Chen",
        status: "review",
        due: "16:30",
        order: 0,
        note: "",
        dependency: "prototype",
        comments: [],
      },
      {
        id: "setup",
        title: "Create team workspace",
        description: "Set up the shared team workspace.",
        assignee: "Alex Chen",
        status: "done",
        due: "",
        order: 0,
        note: "Workspace ready.",
        dependency: "",
        comments: [],
      },
    ]);
    put("nodes", [
      {
        id: "plan",
        position: { x: 20, y: 110 },
        data: {
          label: "Plan",
          description: "Define the project scope",
          kind: "step",
        },
      },
      {
        id: "split",
        position: { x: 230, y: 110 },
        data: {
          label: "Split",
          description: "Run both branches",
          kind: "split",
        },
      },
      {
        id: "design",
        position: { x: 440, y: 30 },
        data: {
          label: "Design",
          description: "Create the prototype",
          kind: "step",
        },
      },
      {
        id: "build",
        position: { x: 440, y: 190 },
        data: {
          label: "Build",
          description: "Implement features",
          kind: "step",
        },
      },
      {
        id: "review",
        position: { x: 650, y: 110 },
        data: {
          label: "Review",
          description: "Review both branches",
          kind: "merge",
        },
      },
      {
        id: "submit",
        position: { x: 860, y: 110 },
        data: {
          label: "Submit",
          description: "Prepare the submission",
          kind: "step",
        },
      },
    ]);
    put(
      "edges",
      [
        ["plan", "split"],
        ["split", "design"],
        ["split", "build"],
        ["design", "review"],
        ["build", "review"],
        ["review", "submit"],
      ].map(([source, target]) => ({
        id: `${source}-${target}`,
        source,
        target,
        type: "smoothstep",
      })),
    );
    put("resources", [
      {
        id: "challenge-pack",
        title: "Challenge pack",
        kind: "Document",
        description: "Challenge goals, judging criteria and deliverables.",
        content:
          "Connected communities\n\nHelp newcomers discover local activities and make meaningful connections.\n\nJudging criteria: relevance, usability, feasibility and impact.\nDeliverables: prototype, project summary and demo.",
        owner: "Alex Chen",
        createdAt: Date.now() - 1800000,
      },
      {
        id: "reference-link",
        title: "Reference link",
        kind: "Link",
        description: "Accessible design reference.",
        url: "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
        owner: "Sam Lee",
        createdAt: Date.now() - 1600000,
      },
      {
        id: "design-file",
        title: "Design file",
        kind: "Link",
        description: "HackRelay high fidelity Figma design.",
        url: "https://www.figma.com/design/2pELb97TKb3xdprvGuDRgr/high",
        owner: "Jordan Davis",
        createdAt: Date.now() - 720000,
      },
    ]);
    put("activity", [
      {
        id: "initial-prototype",
        actor: "Maya Patel",
        verb: "updated a task",
        title: "Build first prototype",
        type: "task",
        targetId: "prototype",
        path: "/tasks/prototype",
        detail: "To Do → In Progress",
        createdAt: Date.now() - 720000,
      },
      {
        id: "initial-resource",
        actor: "Sam Lee",
        verb: "shared a resource",
        title: "Challenge pack",
        type: "resource",
        targetId: "challenge-pack",
        path: "/resources/challenge-pack",
        detail: "Document",
        createdAt: Date.now() - 1680000,
      },
    ]);
    doc
      .getText("code:App.tsx")
      .insert(
        0,
        'import { useState } from "react";\n\nexport default function App() {\n  const [query, setQuery] = useState("");\n\n  return (\n    <main className="community">\n      <h1>Find your people.</h1>\n      <p>Discover local activities and meet people who share your interests.</p>\n      <input value={query} onChange={e => setQuery(e.target.value)} />\n    </main>\n  );\n}\n',
      );
    doc
      .getText("code:styles.css")
      .insert(
        0,
        ".community {\n  max-width: 900px;\n  margin: 0 auto;\n  padding: 32px;\n  color: #18243b;\n}\n",
      );
    doc
      .getText("code:README.md")
      .insert(
        0,
        "# Community Connect\n\nHelp newcomers find their people.\n\n## Team\nDesign, development and research working together.\n",
      );
  }, "seed");
}
