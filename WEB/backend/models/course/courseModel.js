import mongoose from "mongoose";

const courseSectionSchema = new mongoose.Schema(
  {
    sectionKey: {
      type: String,
      required: [true, "Please add a section key"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Please add a section title"],
      trim: true,
      maxlength: [150, "Section title must be at most 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Section description must be at most 1000 characters"],
    },
    order: {
      type: Number,
      required: [true, "Please add a section order"],
      min: 0,
    },
    lessons: [
      {
        lessonKey: { type: String, required: [true, "Please add a lesson key"], trim: true },
        title: { type: String, required: [true, "Please add a lesson title"], trim: true, maxlength: [150, "Lesson title must be at most 150 characters"] },
        summary: { type: String, trim: true, maxlength: [1000, "Lesson summary must be at most 1000 characters"] },
        durationMinutes: { type: Number, min: 0, default: 0 },
        videoUrl: { type: String, trim: true },
        resourceUrl: { type: String, trim: true },
        isPreview: { type: Boolean, default: false },
        order: { type: Number, min: 0, default: 0 },
      },
    ],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a course title"],
      trim: true,
      maxlength: [200, "Course title must be at most 200 characters"],
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Please add a course slug"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Please add a course description"],
      trim: true,
      maxlength: [5000, "Course description must be at most 5000 characters"],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Short description must be at most 300 characters"],
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
      index: true,
    },
    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: "en",
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    sections: {
      type: [courseSectionSchema],
      default: [],
    },
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
    learningOutcomes: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    roadmapTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTemplate",
    },
    stats: {
      enrollmentsCount: { type: Number, default: 0, min: 0 },
      completionRate: { type: Number, default: 0, min: 0, max: 100 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text", tags: "text" });

courseSchema.pre("save", function () {
  if (Array.isArray(this.sections)) {
    this.sections.sort((left, right) => left.order - right.order);
    this.sections.forEach((section) => {
      if (Array.isArray(section.lessons)) {
        section.lessons.sort((left, right) => (left.order || 0) - (right.order || 0));
      }
    });
  }
});

courseSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
