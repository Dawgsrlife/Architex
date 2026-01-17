import mongoose, { Schema, Document } from "mongoose";

export interface IWorkflow extends Document {
  name: string;
  description: string;
  projectId: mongoose.Types.ObjectId;
  nodes: any[];
  edges: any[];
  aiGeneratedCode?: string;
  status: "draft" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    nodes: {
      type: Schema.Types.Mixed,
      default: [],
    },
    edges: {
      type: Schema.Types.Mixed,
      default: [],
    },
    aiGeneratedCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Workflow ||
  mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
