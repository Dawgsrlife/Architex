import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  description: string;
  userId: string;
  repository?: string;
  status: "active" | "archived" | "draft";
  workflows: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    repository: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "archived", "draft"],
      default: "draft",
    },
    workflows: [
      {
        type: Schema.Types.ObjectId,
        ref: "Workflow",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
