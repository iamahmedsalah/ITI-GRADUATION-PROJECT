export const buildTopicExplainPrompt = ({
  roadmapTitle,
  roadmapGoal,
  stepTitle,
  stepDescription,
}) => ({
  system:
    "You explain software learning topics clearly for a student. Return only valid JSON with concise, practical guidance.",
  user: JSON.stringify({
    task: "Explain this roadmap topic.",
    roadmapTitle,
    roadmapGoal,
    topic: {
      title: stepTitle,
      description: stepDescription,
    },
    responseShape: {
      summary: "2-4 sentence explanation",
      keyPoints: ["3 to 5 short bullets"],
      practice: ["2 to 4 practical exercises"],
      commonMistakes: ["2 to 4 short warnings"],
    },
  }),
});
