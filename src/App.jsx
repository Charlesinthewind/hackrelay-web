import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { RoomProvider, useRoom, useRoomLink } from "./store";
import { Modal, Field, Button, Badge, Heading } from "./ui";
import { Workspace, TaskDetails, Activity } from "./Workspace";
import Editor from "./Editor";
import {
  Events,
  Challenge,
  Teams,
  CreateTeam,
  Resources,
  Help,
  Submission,
  Preview,
  SubmissionComplete,
  Showcase,
  ProjectDetails,
  ReportForm,
  Reports,
  ReportDetails,
  Docs,
  Profile,
} from "./Pages";
function Shell() {
  const { profile, setProfile, status, ready } = useRoom();
  const link = useRoomLink();
  const [identity, setIdentity] = useState(false),
    [name, setName] = useState(profile.name);
  const location = useLocation();
  const group = location.pathname.startsWith("/reports")
    ? "Report"
    : location.pathname.startsWith("/code")
      ? "Repository"
      : location.pathname.startsWith("/docs")
        ? "Docs"
        : /^\/(events|challenges|teams)/.test(location.pathname)
          ? "Events"
          : "Workspace";
  return (
    <>
      <nav className="nav">
        <NavLink className="brand" to={link("/events")}>
          HackRelay
        </NavLink>
        <div className="nav-links">
          {[
            ["Events", "/events"],
            ["Workspace", "/workspace"],
            ["Repository", "/code"],
            ["Docs", "/docs"],
            ["Report", "/reports"],
          ].map(([label, to]) => (
            <NavLink
              key={to}
              to={link(to)}
              className={() => (group === label ? "active" : "")}
            >
              {label}
            </NavLink>
          ))}
        </div>
        <span
          className={`connection-dot ${status === "connected" ? "online" : ""}`}
          title={status}
        />
        <button
          className="avatar"
          title={`Change display name (${profile.name})`}
          onClick={() => {
            setName(profile.name);
            setIdentity(true);
          }}
        >
          {profile.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </button>
      </nav>
      <main className="page">
        {!ready ? (
          <div className="loading">
            <h1>Connecting to your workspace…</h1>
            <p>
              {status === "disconnected"
                ? "The collaboration service is unavailable. Keep this page open to reconnect."
                : "Loading shared work."}
            </p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={<Navigate to={link("/workspace")} replace />}
            />
            <Route path="/events" element={<Events />} />
            <Route path="/challenges/:id" element={<Challenge />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/new" element={<CreateTeam />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/code" element={<Editor />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:id" element={<Resources />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/help" element={<Help />} />
            <Route path="/submission" element={<Submission />} />
            <Route path="/submission/preview" element={<Preview />} />
            <Route
              path="/submission/complete/:id"
              element={<SubmissionComplete />}
            />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/new" element={<ReportForm />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="*"
              element={
                <>
                  <Heading
                    title="Page not found"
                    context="Choose a destination from the navigation."
                  />
                </>
              }
            />
          </Routes>
        )}
      </main>
      {status !== "connected" && ready && (
        <div className="connection-banner">
          Connection lost. Code edits will sync when you reconnect.
        </div>
      )}
      {identity && (
        <Modal title="Your display name" onClose={() => setIdentity(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setProfile({ name: name.trim() });
              setIdentity(false);
            }}
          >
            <Field label="Name shown to teammates">
              <input
                autoFocus
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <p className="hint">
              Use a different name in each browser when testing collaboration.
            </p>
            <div className="actions">
              <Button type="button" onClick={() => setIdentity(false)}>
                Cancel
              </Button>
              <Button primary>Save name</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <RoomProvider>
        <Shell />
      </RoomProvider>
    </BrowserRouter>
  );
}
