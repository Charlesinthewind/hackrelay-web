import { test, expect } from "@playwright/test";

test("two independent users edit code concurrently and see live cursors", async ({
  browser,
}) => {
  const room = "browser-code-" + Date.now();
  const a = await browser.newContext(),
    b = await browser.newContext();
  const alice = await a.newPage(),
    bob = await b.newPage();
  const errors = [];
  for (const p of [alice, bob])
    p.on("pageerror", (e) => errors.push(e.message));
  await a.addInitScript(() =>
    localStorage.setItem(
      "hackrelay-profile",
      JSON.stringify({ id: "alice", name: "Alice", color: "#3059e8" }),
    ),
  );
  await b.addInitScript(() =>
    localStorage.setItem(
      "hackrelay-profile",
      JSON.stringify({ id: "bob", name: "Bob", color: "#d34c77" }),
    ),
  );
  await Promise.all([
    alice.goto("/code?room=" + room),
    bob.goto("/code?room=" + room),
  ]);
  await expect(alice.locator(".cm-content")).toContainText("Find your people");
  await expect(bob.locator(".presence")).toContainText("Alice");
  for (const p of [alice, bob]) {
    await p.locator(".cm-content").click();
    await p.keyboard.press("ControlOrMeta+End");
  }
  await Promise.all([
    alice.keyboard.insertText("\n// Alice simultaneous edit"),
    bob.keyboard.insertText("\n// Bob simultaneous edit"),
  ]);
  for (const p of [alice, bob]) {
    await expect(p.locator(".cm-content")).toContainText(
      "Alice simultaneous edit",
    );
    await expect(p.locator(".cm-content")).toContainText(
      "Bob simultaneous edit",
    );
  }
  await alice.locator(".cm-content").click();
  await alice.keyboard.press("ControlOrMeta+Home");
  await alice.keyboard.press("ArrowRight");
  await expect(bob.locator(".cm-ySelectionInfo")).toContainText("Alice");
  await alice.keyboard.insertText("X");
  await expect
    .poll(() =>
      bob.locator(".cm-content").evaluate((el) => {
        const c = el.cloneNode(true);
        c.querySelectorAll(".cm-ySelectionCaret").forEach((n) => n.remove());
        return c.textContent.replace(/\u2060/g, "");
      }),
    )
    .toContain("iXmport");
  await alice.keyboard.press("Backspace");
  await expect(bob.locator(".cm-content")).not.toContainText("iXmport");
  await alice.screenshot({ path: "tests/artifacts/code.png", fullPage: true });
  expect(errors).toEqual([]);
  await a.close();
  await b.close();
});

test("workflow block CRUD, connection, pan/zoom, resize and kanban actions", async ({
  page,
}) => {
  const room = "browser-workspace-" + Date.now();
  await page.goto("/workspace?room=" + room);
  await expect(
    page.getByRole("heading", { name: "Team Workspace" }),
  ).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  await page.getByRole("button", { name: "Add block", exact: true }).click();
  await page.getByLabel("Block name").fill("Testing block");
  await page.getByRole("button", { name: "Save block", exact: true }).click();
  await expect(
    page.locator(".workflow-block").filter({ hasText: "Testing block" }),
  ).toBeVisible();
  const node = page
    .locator(".react-flow__node")
    .filter({ hasText: "Testing block" });
  await node.dblclick();
  await page.getByLabel("Block name").fill("User testing");
  await page.getByRole("button", { name: "Save block", exact: true }).click();
  const updated = page
    .locator(".react-flow__node")
    .filter({ hasText: "User testing" });
  const before = await updated.boundingBox();
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    before.x + before.width / 2 + 40,
    before.y + before.height / 2 + 40,
    { steps: 8 },
  );
  await page.mouse.up();
  const after = await updated.boundingBox();
  expect(after.x).toBeGreaterThan(before.x + 20);
  const source = page
    .locator(".react-flow__node")
    .filter({ hasText: "Plan" })
    .locator(".react-flow__handle.source");
  const target = updated.locator(".react-flow__handle.target");
  const s = await source.boundingBox(),
    t = await target.boundingBox();
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator(".react-flow__edge")).toHaveCount(7);
  const grip = page.getByRole("button", {
    name: "Drag to resize workflow canvas",
  });
  const gb = await grip.boundingBox(),
    cb = await page.locator(".canvas-shell").boundingBox();
  await page.mouse.move(gb.x + 10, gb.y + 10);
  await page.mouse.down();
  await page.mouse.move(gb.x + 30, gb.y + 100, { steps: 8 });
  await page.mouse.up();
  const resized = await page.locator(".canvas-shell").boundingBox();
  expect(resized.height).toBeGreaterThan(cb.height + 60);
  await page.getByRole("button", { name: "Zoom In", exact: true }).click();
  await updated.click();
  await page
    .locator("#workflow")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.locator(".workflow-block").filter({ hasText: "User testing" }),
  ).toHaveCount(0);
  await expect(page.locator(".react-flow__edge")).toHaveCount(6);
  await page
    .locator("#kanban")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  await page.getByLabel("Task title").fill("Evaluate interaction");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Test the completed interface.");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  const task = page
    .locator(".task-tile")
    .filter({ hasText: "Evaluate interaction" });
  await expect(task).toBeVisible();
  await task.scrollIntoViewIfNeeded();
  const handle = await task
    .getByRole("button", { name: "Move Evaluate interaction" })
    .boundingBox();
  const dest = await page.locator('[data-column="progress"]').boundingBox();
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(dest.x + dest.width / 2, dest.y + 100, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('[data-column="progress"]')).toContainText(
    "Evaluate interaction",
  );
  await task.getByRole("button", { name: "Edit Evaluate interaction" }).click();
  await page.getByLabel("Task title").fill("Evaluate collaboration");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page
    .getByRole("link", { name: "Evaluate collaboration", exact: true })
    .click();
  await page
    .getByLabel("Completed work, remaining work and linked materials")
    .fill("Handoff: test with two teammates.");
  await page.getByRole("button", { name: "Save handoff note" }).click();
  await page.reload();
  await expect(
    page.getByLabel("Completed work, remaining work and linked materials"),
  ).toHaveValue("Handoff: test with two teammates.");
  await page.goto("/activity?room=" + room);
  await page
    .getByRole("link")
    .filter({ hasText: "updated a handoff note" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/tasks\//);
  await page.goto("/workspace?room=" + room);
  await page.screenshot({
    path: "tests/artifacts/workspace.png",
    fullPage: true,
  });
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete Evaluate collaboration" })
    .click();
  await expect(
    page.getByRole("link", { name: "Evaluate collaboration", exact: true }),
  ).toHaveCount(0);
});

test("resources, actual forms, submission and reports", async ({ page }) => {
  const room = "browser-forms-" + Date.now();
  await page.goto("/resources?room=" + room);
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Interview notes");
  await page
    .getByLabel("Document content")
    .fill("Participants need visible handoff states.");
  await page.getByRole("button", { name: "Save resource" }).click();
  await expect(page.locator("pre")).toContainText("Participants need");
  await page.goto("/submission?room=" + room);
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Working Community");
  await page
    .getByLabel("Solution summary")
    .fill("A working collaboration prototype.");
  await page
    .getByLabel("Demo or prototype link")
    .fill("https://example.com/demo");
  await page
    .getByLabel("Team members and contributions")
    .fill("Alice: design, Bob: development");
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Preview →" }).click();
  await expect(
    page.getByRole("heading", { name: "Submission Preview" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit project", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm submission" }).click();
  await expect(
    page.getByRole("heading", { name: "Submission Complete" }),
  ).toBeVisible();
  await page.goto("/reports/new?room=" + room);
  await page
    .getByLabel("What happened")
    .fill("The session needs organiser support.");
  await page
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Report Details" }),
  ).toBeVisible();
  await page
    .getByLabel("Add details")
    .fill("Additional context entered freely.");
  await page.getByRole("button", { name: "Send additional info" }).click();
  await expect(page.locator(".comment")).toContainText("Additional context");
  await page.getByRole("link", { name: "Back to my reports" }).click();
  await expect(page.locator("tbody")).toContainText("Team workspace");
});

test("all primary pages render without errors and mobile navigation remains usable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const room = "browser-routes-" + Date.now();
  for (const route of [
    "/events",
    "/challenges/a",
    "/teams",
    "/teams/new",
    "/workspace",
    "/tasks/prototype",
    "/code",
    "/resources",
    "/activity",
    "/help",
    "/submission",
    "/submission/preview",
    "/showcase",
    "/projects/community",
    "/reports",
    "/reports/new",
    "/docs",
    "/profile",
  ]) {
    await page.goto(route + "?room=" + room);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/workspace?room=" + room);
  await expect(
    page.getByRole("heading", { name: "Team Workspace" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Repository", exact: true }).click();
  await expect(page.locator(".cm-content")).toBeVisible();
  await page.screenshot({ path: "tests/artifacts/mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("workflow activity opens the same room and selects the referenced block", async ({
  page,
}) => {
  const room = "browser-links-" + Date.now();
  await page.goto("/workspace?room=" + room);
  await page.getByRole("button", { name: "Add block", exact: true }).click();
  await page.getByLabel("Block name").fill("Review usability");
  await page.getByRole("button", { name: "Save block", exact: true }).click();
  await page.goto("/activity?room=" + room);
  await page
    .getByRole("link")
    .filter({ hasText: "added a workflow block" })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp("room=" + room));
  await expect(page.locator(".workflow-block.selected")).toContainText(
    "Review usability",
  );
  await expect(page.locator("#workflow")).toBeVisible();
});
