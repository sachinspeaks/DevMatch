import { Schema, Document, model } from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";

const messageSchema: Schema<any> = new Schema<any>(
  {
    firstName: { type: String, required: true, trim: true },
    senderId: { type: Schema.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const chatSchema: Schema<any> = new Schema<any>({
  participants: [{ type: Schema.ObjectId, ref: "User", required: true }],
  messages: [messageSchema],
});

export const ChatModel = model<any>("Chat", chatSchema);
