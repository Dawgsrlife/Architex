import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  role: "free" | "pro" | "enterprise";
  membershipExpiry?: Date;
  solanaWallet?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    membershipExpiry: {
      type: Date,
    },
    solanaWallet: {
      type: String,
    },
    credits: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
