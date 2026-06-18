export const buildRoadmapDraftPrompt = ({
  goal,
  targetRole,
  targetLevel,
  templateType,
  durationWeeks,
  weeklyStudyHours,
}) => ({
  system:
    "You generate practical software learning roadmap drafts for an admin review workflow. Return only valid JSON. Do not include markdown fences or commentary.",
  user: JSON.stringify({
    task: "Create a roadmap template draft.",
    requirements: {
      goal,
      targetRole,
      targetLevel,
      templateType,
      durationWeeks,
      weeklyStudyHours,
      language: "English",
      stepCount: {
        minimum: 4,
        maximum: 10,
      },
      resources: {
        perStep: "2 to 4",
        requirement:
          "Use real public URLs only. Include at least one documentation/article/reference link and at least one video link when useful. Prefer official documentation, reputable guides, YouTube educational videos, and practice resources.",
        titleGuidance:
          "Make resource titles short and readable. Include words like Docs, Guide, Tutorial, Video, or YouTube when relevant.",
      },
      dependencies:
        "Use stepKey values in dependsOn. The first step should have an empty dependsOn array.",
    },
    responseShape: {
      title: "string, 3-120 chars",
      slug: "lowercase-url-slug",
      goal: "string",
      description: "string, <= 2000 chars",
      tags: ["lowercase strings"],
      steps: [
        {
          stepKey: "lowercase unique slug",
          title: "string",
          description: "string",
          resources: [
            { title: "string, docs/article/reference", url: "https://..." },
            { title: "string, video/youtube", url: "https://..." },
          ],
          estimatedMinutes: "number",
          required: true,
          dependsOn: ["previous-step-key"],
        },
      ],
    },
  }),
});
