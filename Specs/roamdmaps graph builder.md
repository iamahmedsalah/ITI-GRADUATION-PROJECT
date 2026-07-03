# Implementation Plan: roadmap.sh Layout for Roadmap Graph

This plan details how to redesign the current React Flow roadmap layout to look like [roadmap.sh](https://roadmap.sh).

Currently, the roadmap uses a simple zig-zag layout (for small roadmaps) or a multi-column grid snake layout (for large roadmaps). We want to transition to a professional **Spine-and-Branches** layout where core milestones run vertically down the center spine, and sub-topics branch off horizontally to the sides.

---

## User Review Required

We have designed a dynamic layout algorithm that auto-detects hierarchy without requiring pre-defined coordinates in the JSON database. 

> [!IMPORTANT]
> **No database changes are needed.** The algorithm parses the existing `dependsOn` and `order` fields to dynamically classify and layout nodes on the fly.
>
> **Edge Connections & Handles:** To make connection lines look neat and right-angled, we will add Left and Right handles to the nodes. Core nodes will connect to their branch nodes horizontally (e.g. from Core's right to Branch's left).

---

## Proposed Changes

### 1. Classification & Position Calculations

#### [MODIFY] [graphBuilder.ts](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/utils/graphBuilder.ts)
We will rewrite `createGraph` and `getNodePosition` to execute a two-pass layout algorithm:

1. **Classify Nodes**:
   - Build a map of dependents (`child -> parents`).
   - Identify **Core Nodes**: Nodes that are not leaves (have at least one other node depending on them), OR are root nodes (no dependencies), OR are the very last step in the roadmap sequence.
   - Identify **Branch Nodes**: Leaf nodes (no other nodes depend on them) that have a single dependency (their parent).
2. **Assign Coordinates**:
   - Align all **Core Nodes** vertically down the center column ($x = 0$).
   - For each Core Node, group its associated Branch Nodes.
   - **Horizontal Alignment**:
     - Alternate side branches for each Core Node to maintain visual balance (e.g. Core 1 has branches on the right, Core 2 on the left).
     - If a Core Node has a large number of branches (e.g., $> 4$), split them equally between the left and right sides.
   - **Vertical Alignment & Spacing**:
     - Center the stack of branch nodes vertically relative to their parent Core Node.
     - Spacing formula: Calculate the distance between Core Node $i$ and Core Node $i+1$ based on the heights of their respective branch stacks to guarantee **zero vertical overlaps**:
       $$Y_{gap} = 150 + \max\left(0, \frac{M_i - 1}{2} \times 80\right) + \max\left(0, \frac{M_{i+1} - 1}{2} \times 80\right)$$
       where $M_i$ is the number of branches for Core Node $i$.
3. **Configure Edge Handles**:
   - For Core-to-Core edges: Connect `core-bottom` to `core-top`.
   - For Core-to-Branch edges: Connect `core-right` to `branch-left` (or `core-left` to `branch-right`).

### 2. Node Customization

#### [MODIFY] [StepNode.tsx](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/components/ui/StepNode.tsx)
We will customize the visual appearance of nodes to establish a strong hierarchy:

- **Core Nodes**: Styled as prominent buttons/capsules with solid outlines, bold fonts, and a distinct theme background color (e.g., primary yellow/gold).
- **Branch Nodes**: Styled as smaller, lighter-weight cards (white or dark-gray surface depending on dark/light mode) to signal that they are sub-topics.
- **Multiple Handles**:
  - Top handle: `type="target" id="top"` (for incoming main path)
  - Bottom handle: `type="source" id="bottom"` (for outgoing main path)
  - Left handle: `type="source" id="left-source"` and `type="target" id="left-target"`
  - Right handle: `type="source" id="right-source"` and `type="target" id="right-target"`

### 3. Edge Styling

#### [MODIFY] [graphBuilder.ts](file:///d:/Ahmed-Salah/ITI/ITI-GRAD-PROJECT/WEB/frontend/src/utils/graphBuilder.ts)
- Main path edges: Solid line, thicker stroke (`strokeWidth: 3`), running down the center.
- Branch edges: Dashed line (`strokeDasharray: '4 4'`), thinner stroke (`strokeWidth: 1.5`), connecting horizontally.

---

## Verification Plan

### Manual Verification
1. Open the roadmap page in the browser.
2. Verify that:
   - Core topics (e.g. CSS Basics, Box Model, Flexbox, Grid) run down the center.
   - Sub-topics branch off neatly to the sides.
   - No nodes overlap vertically.
   - Edge lines form neat, right-angled horizontal and vertical steps instead of random diagonal paths.
