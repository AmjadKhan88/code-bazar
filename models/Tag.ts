import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export type TagDoc = InferSchemaType<typeof tagSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Tag: Model<TagDoc> =
  (mongoose.models.Tag as Model<TagDoc>) ||
  mongoose.model<TagDoc>("Tag", tagSchema);
