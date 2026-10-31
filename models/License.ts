import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const licenseSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    buyerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    licenseKey: { type: String, required: true, unique: true },
    licenseType: {
      type: String,
      enum: ["PERSONAL", "COMMERCIAL", "EXTENDED"],
      default: "COMMERCIAL",
    },
    downloadCount: { type: Number, default: 0, min: 0 },
    maxDownloads: { type: Number, default: 10, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type LicenseDoc = InferSchemaType<typeof licenseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const License: Model<LicenseDoc> =
  (mongoose.models.License as Model<LicenseDoc>) ||
  mongoose.model<LicenseDoc>("License", licenseSchema);
