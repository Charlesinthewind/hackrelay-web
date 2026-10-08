# HackRelay — Interactive Web App

A React application based on the high-fidelity designs in the Figma `high` file, with a local Node.js collaboration server.

## Getting Started

Requires Node.js 22 or later. Clone the repository and start the development server:

```sh
git clone https://github.com/Charlesinthewind/hackrelay-web.git
cd hackrelay-web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The terminal also displays an address for devices on the same network. Keep the server running while using the application. To change the port, run `PORT=5174 npm run dev`.

## Testing Real-Time Collaboration

1. Open **Repository**, click the avatar in the top-right corner, and enter your display name.
2. Click **Invite teammate** and share the complete session link. To test on one computer, use another browser or a private browsing window.
3. For other devices, connect to the same Wi-Fi and use the local network address printed in the terminal, such as `http://192.168.1.10:5173/code?room=team-a`. Replace the example IP with your computer's actual address. Other devices cannot use `localhost` to reach your computer.
4. Set a different display name in each browser, then type, delete, and select code simultaneously. Text changes, colored cursors, and selections synchronize live. Hover over a remote cursor to see its display name.
5. Sessions with the same `room` parameter share content. Different rooms have independent code, tasks, workflows, resources, and records.

The shared text editor includes three example files: `App.tsx`, `styles.css`, and `README.md`. It supports syntax highlighting, undo for your own edits, and file downloads. It does not execute code.

## Interactive Features

- **Workflow:** Add, edit, delete, and drag blocks. Drag from a right-side output handle to a left-side input handle to create directed connections, including branches and merges. Select a connection to delete it. Zoom with the mouse wheel or controls, pan by dragging empty space, and fit the diagram to the viewport. Drag the bottom-right grip to resize the canvas or expand it within the current page.
- **Kanban:** Add, edit, and delete tasks. Use the handle at the top-left of a card to reorder tasks or move them between columns. Task status can also be changed in the edit form. Task details include dependency links, editable handoff notes, comments, and a ready-for-review action.
- **Recent Activity:** Records actual editing actions and links to the corresponding task, resource, code file, workflow block, or submission. Supports filtering and export. Deleted items show an unavailable state or return to the relevant list.
- **Other Pages:** Events and challenges, team discovery and creation, shared resources (documents, links, and files up to 5 MB), on-site help requests, submission drafts and previews, submission confirmation, project showcase, reports and additional report information, documentation, and profiles.
- **Reports and Handoffs:** Handoff notes use editable text areas. Reports appear in an aligned table with column headings. Layouts also support mobile screens.

## Data and Collaboration Server

Browsers connect to the Node.js server through WebSocket. Code editing uses Yjs CRDTs to merge concurrent changes, while Yjs awareness synchronizes temporary cursor and presence information. Application records are stored in shared Yjs documents.

Room data is automatically saved to `data/<room>.bin` and restored after a server restart. Display names and colors are stored in the browser's localStorage. The `data` directory is excluded from Git; back it up to retain your demonstration content.

This is a local/LAN prototype for assignment demonstrations. It has no login authentication or production organizer approval backend. Reports are filtered by the current browser identity, which does not provide server-side access control; use demonstration data. Events, teams, tasks, and showcase projects include initial sample content. Newly added content and collaborative edits are saved. The application has not been deployed to the public internet.

## Production Build

```sh
npm run build
npm start
```

In production, Node.js serves both the website and the WebSocket connection. Hosting only the static `dist` directory will not provide cross-device collaboration.

## Tests

```sh
npm test

# Install Chromium before running browser tests for the first time.
npx playwright install chromium

# Start npm run dev in another terminal, then run:
npm run test:ui
```

Network tests cover concurrent edits and deletions between independent clients, presence and cursor synchronization, task and workflow synchronization, room isolation, and persistence across server restarts.

Browser tests cover synchronization and cursors in two independent sessions, workflow and Kanban operations, handoff note persistence, resource/submission/report flows, activity links to specific items, and mobile layouts. Test screenshots are saved in `tests/artifacts`.

## Project Structure

- `src/Editor.jsx` — CodeMirror and Yjs shared editor
- `src/Workflow.jsx` — React Flow editable workflow canvas
- `src/Kanban.jsx` — dnd-kit Kanban board and task forms
- `src/Workspace.jsx` — Workspace, handoff, and activity pages
- `src/Pages.jsx` — Other pages and forms
- `src/store.jsx` — Room connections, identity, shared data, and activity records
- `server/index.js` and `server/seed.js` — WebSocket server, persistence, and initial content
- `design-reference/` — Figma design references

No external AI service or API key is required.
