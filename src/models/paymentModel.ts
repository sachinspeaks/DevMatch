import { Schema, type Document, model, type Types } from "mongoose";

interface IPaymentNotes {
  firstName?: string;
  lastName?: string;
  planType?: string;
}

export interface IPayment extends Document {
  userId: Types.ObjectId;
  paymentId?: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  receipt: string;
  notes?: IPaymentNotes;
}

const paymentSchema: Schema<IPayment> = new Schema<IPayment>(
  {
    userId: {
      type: Schema.ObjectId,
      ref: "User",
      required: true,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      reqrired: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    receipt: {
      type: String,
      required: true,
    },
    notes: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      planType: {
        type: String,
      },
    },
  },
  { timestamps: true },
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
