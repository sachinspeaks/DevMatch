import express, { type Request, type Response } from "express";
import type { QueryFilter } from "mongoose";
import validator from "validator";
import { ChatModel } from "../models/chatModel.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  ConnectionRequestModel,
  type IConnectionRequest,
  Status,
} from "../models/connectionRequest.js";

const chatRouter = express.Router();

chatRouter.get(
  "/chat/:targetUserId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { targetUserId } = req.params;
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (
        !targetUserId ||
        Array.isArray(targetUserId) ||
        !validator.isMongoId(targetUserId)
      ) {
        return res.status(400).json({ message: "Invalid target user ID" });
      }

      const connectionFilter: QueryFilter<IConnectionRequest> = {
        $or: [
          {
            toUserId: targetUserId,
            fromUserId: userId,
            status: Status.Accepted,
          },
          {
            toUserId: userId,
            fromUserId: targetUserId,
            status: Status.Accepted,
          },
        ],
      };
      const connection = await ConnectionRequestModel.findOne(connectionFilter);
      if (!connection) throw new Error("Not allowed");

      let chat = await ChatModel.findOne({
        participants: { $all: [userId, targetUserId] },
      }).populate({
        path: "messages.senderId",
        select: "firstName lastName",
      });
      if (!chat) {
        chat = new ChatModel({
          participants: [userId, targetUserId],
          messages: [],
        });
        await chat.save();
      }
      return res.json({
        chat,
      });
    } catch (error: any) {
      return res.status(403).json({ message: error.message || "Not allowed" });
    }
  },
);

export default chatRouter;
