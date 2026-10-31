import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
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
      index: true,
    },
    buyerWhatsapp: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["STRIPE", "MANUAL"],
      default: "STRIPE",
      index: true,
    },
    paymentAccount: {
      type: String,
      enum: ["UBL", "JAZZCASH", "OTHER", ""],
      default: "",
    },
    transactionReference: {
      type: String,
      trim: true,
      default: "",
    },
    buyerNotes: {
      type: String,
      trim: true,
      default: "",
    },
    screenshotUrl: {
      type: String,
      default: "",
    },
    screenshotPublicId: {
      type: String,
      default: "",
    },
    adminNote: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PENDING_VERIFICATION",
        "PAID",
        "REJECTED",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD", uppercase: true },
    items: { type: [orderItemSchema], required: true, default: [] },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ||
  mongoose.model<OrderDoc>("Order", orderSchema);
