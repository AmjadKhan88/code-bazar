import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const faqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    metaTitle: { type: String, required: true, trim: true },
    metaDescription: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD", uppercase: true },
    images: { type: [String], required: true, default: [] },
    // Private archive path/URL; excluded from default queries and only exposed after purchase verification
    downloadUrl: { type: String, required: true, select: false },
    techStack: { type: [String], default: [] },
    version: { type: String, default: "1.0.0" },
    demoUrl: { type: String, default: "" },
    features: { type: [String], default: [] },
    faqs: { type: [faqSchema], default: [] },
    published: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "Tag", index: true }],
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    salesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({
  title: "text",
  tagline: "text",
  description: "text",
  techStack: "text",
});

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", productSchema);
