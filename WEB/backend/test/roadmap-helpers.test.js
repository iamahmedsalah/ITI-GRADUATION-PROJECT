import assert from "node:assert/strict";
import { test } from "node:test";
import {
  slugifyStepKey,
  ensureUniqueStepKeys,
  parseRoadmapMarkdownToSteps,
  calculateEstimatedTotalMinutes,
  escapeRegex,
  createServiceError,
  publicTemplateFilter,
} from "../helpers/roadmap.helpers.js";

test("slugifyStepKey helper formats titles to kebab-case step keys", () => {
  assert.equal(slugifyStepKey("HTML & CSS Basics"), "html-css-basics");
  assert.equal(slugifyStepKey("  React v19 Router!!  "), "react-v19-router");
  assert.equal(slugifyStepKey(""), "step");
  assert.equal(slugifyStepKey(null), "step");
});

test("ensureUniqueStepKeys guarantees unique step keys and sets default values", () => {
  const steps = [
    { title: "Intro to JS" },
    { stepKey: "intro-to-js", title: "Intro to JS Part 2" },
    { title: "Advanced Topics", order: 5, required: false, estimatedMinutes: "45" },
  ];

  const processed = ensureUniqueStepKeys(steps);

  assert.equal(processed.length, 3);
  assert.equal(processed[0].stepKey, "intro-to-js");
  assert.equal(processed[0].order, 0);
  assert.equal(processed[0].required, true);
  assert.equal(processed[0].estimatedMinutes, 0);

  // Duplicate key resolved with suffix
  assert.equal(processed[1].stepKey, "intro-to-js-2");
  assert.equal(processed[1].order, 1);

  assert.equal(processed[2].stepKey, "advanced-topics");
  assert.equal(processed[2].order, 5);
  assert.equal(processed[2].required, false);
  assert.equal(processed[2].estimatedMinutes, 45);
  assert.deepEqual(processed[2].dependsOn, []);
});

test("parseRoadmapMarkdownToSteps parses headings and resources correctly", () => {
  const markdown = `
# Project Main Title (Ignored)

## Step 1: Getting Started
This is description for step 1.
- [First Resource](https://example.com/first)
- [Second Resource](https://example.com/second)

### Step 2: Intermediate React
This is step 2 description.
  `;

  const steps = parseRoadmapMarkdownToSteps(markdown);

  assert.equal(steps.length, 2);
  assert.equal(steps[0].title, "Step 1: Getting Started");
  assert.equal(steps[0].stepKey, "step-1-getting-started");
  assert.equal(steps[0].description, "This is description for step 1.");
  assert.equal(steps[0].resources.length, 2);
  assert.equal(steps[0].resources[0].title, "First Resource");
  assert.equal(steps[0].resources[0].url, "https://example.com/first");

  assert.equal(steps[1].title, "Step 2: Intermediate React");
  assert.equal(steps[1].stepKey, "step-2-intermediate-react");
  assert.equal(steps[1].description, "This is step 2 description.");
  assert.equal(steps[1].resources.length, 0);
});

test("calculateEstimatedTotalMinutes sums minutes from steps", () => {
  const steps = [
    { estimatedMinutes: 30 },
    { estimatedMinutes: 45 },
    { estimatedMinutes: "15" },
    { estimatedMinutes: null },
  ];

  assert.equal(calculateEstimatedTotalMinutes(steps), 90);
  assert.equal(calculateEstimatedTotalMinutes([]), 0);
});

test("escapeRegex escapes special regex characters", () => {
  assert.equal(escapeRegex("hello.world*"), "hello\\.world\\*");
  assert.equal(escapeRegex(""), "");
});

test("createServiceError constructs an error with status code", () => {
  const err = createServiceError(404, "Template not found");
  assert.ok(err instanceof Error);
  assert.equal(err.status, 404);
  assert.equal(err.message, "Template not found");
});

test("publicTemplateFilter returns MongoDB query shape for public active roadmaps", () => {
  const filter = publicTemplateFilter();
  assert.equal(filter.isActive, true);
  assert.ok(Array.isArray(filter.$or));
  assert.deepEqual(filter.$or[0], { visibility: "public" });
});
