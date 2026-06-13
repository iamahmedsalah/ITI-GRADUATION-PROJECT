import mongoose from "mongoose";

const ROADMAP_MARKDOWN_MAX_LENGTH = 5000;

const roadmapStepSchema = new mongoose.Schema(
  {
    stepKey: {
      type: String,
      required: [true, "Please add a step key"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Please add a step title"],
      trim: true,
      maxlength: [120, "Step title must be at most 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Step description must be at most 1000 characters"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    resources: [
      {
        title: { type: String, trim: true, maxlength: [120, "Resource title must be at most 120 characters"] },
        url: { type: String, trim: true },
      },
    ],
    order: {
      type: Number,
      required: [true, "Please add a step order"],
      min: 0,
    },
    estimatedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    required: {
      type: Boolean,
      default: true,
    },
    dependsOn: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const roadmapTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a roadmap title"],
      trim: true,
      maxlength: [150, "Roadmap title must be at most 150 characters"],
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Please add a roadmap slug"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    goal: {
      type: String,
      required: [true, "Please add a roadmap goal"],
      trim: true,
      maxlength: [300, "Roadmap goal must be at most 300 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Roadmap description must be at most 2000 characters"],
    },
    targetRole: {
      type: String,
      enum: ["student", "instructor", "admin", "jobSeeker", "careerSwitcher"],
      default: "student",
      index: true,
    },
    targetLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
      index: true,
    },
    templateType: {
      type: String,
      enum: ["roleBased", "skillBased"],
      default: "roleBased",
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    steps: {
      type: [roadmapStepSchema],
      validate: {
        validator: function (steps) {
          const hasSteps = Array.isArray(steps) && steps.length > 0;
          const hasMarkdown = typeof this.contentMarkdown === "string" && this.contentMarkdown.trim().length > 0;
          return hasSteps || hasMarkdown;
        },
        message: "A roadmap must contain at least one step or markdown content.",
      },
      default: [],
    },
    contentFormat: {
      type: String,
      enum: ["json", "markdown"],
      default: "json",
      index: true,
    },
    contentMarkdown: {
      type: String,
      trim: true,
      maxlength: [
        ROADMAP_MARKDOWN_MAX_LENGTH,
        `Markdown content must be at most ${ROADMAP_MARKDOWN_MAX_LENGTH} characters`,
      ],
    },
    estimatedTotalMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    source: {
      type: String,
      enum: ["admin", "ai", "manual"],
      default: "manual",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roadmapTemplateSchema.index({
  title: "text",
  goal: "text",
  description: "text",
  tags: "text",
  "steps.title": "text",
  "steps.description": "text",
  "steps.stepKey": "text",
  contentMarkdown: "text",
});

roadmapTemplateSchema.pre("save", function () {
  if (Array.isArray(this.steps)) {
    this.steps.sort((left, right) => left.order - right.order);
  }
});

roadmapTemplateSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const RoadmapTemplate = mongoose.model("RoadmapTemplate", roadmapTemplateSchema);

export default RoadmapTemplate;
