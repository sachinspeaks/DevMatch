import { Server, type DefaultEventsMap } from "socket.io";
import { parseCookie } from "cookie";
import { randomUUID } from "node:crypto";
import type { Server as HttpServer } from "http";
import type { ChatMessage, SocketData } from "../types/socket/index.js";
import jwt from "jsonwebtoken";
import { ChatModel } from "../models/chatModel.js";
import { ConnectionRequestModel, Status } from "../models/connectionRequest.js";

type ChatServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

export const initializeSocket = (server: HttpServer): ChatServer => {
  const io: ChatServer = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error("No cookie."));
    }
    const { token } = parseCookie(cookieHeader);
    if (!token) {
      return next(new Error("Unauthorized."));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        _id: string;
      };
      socket.data.user = { _id: decoded._id };
      next();
    } catch (error) {
      next(new Error("Unauthorized."));
    }
  });

  io.on("connection", (socket) => {
    // Identity comes from the verified JWT, never from the event payload — a
    // client could otherwise name any fromUserId and speak as that user.
    const fromUserId = socket.data.user._id;

    socket.on("joinChat", async ({ firstName, toUserId }) => {
      const connection = await ConnectionRequestModel.findOne({
        $or: [
          {
            fromUserId,
            toUserId,
            status: Status.Accepted,
          },
          {
            fromUserId: toUserId,
            toUserId: fromUserId,
            status: Status.Accepted,
          },
        ],
      });
      if (!connection) return;
      const room = [fromUserId, toUserId].sort().join("_");
      console.log(`User ${firstName} ${fromUserId} joined room ${room}`);
      socket.join(room);
    });

    socket.on("sendMessage", async ({ firstName, toUserId, text }) => {
      try {
        const room = [fromUserId, toUserId].sort().join("_");
        if (!socket.rooms.has(room)) {
          socket.emit("chatError", {
            message: "Join the chat before sending a message.",
          });
          return;
        }

        let chat = await ChatModel.findOne({
          participants: { $all: [fromUserId, toUserId] },
        });
        if (!chat) {
          chat = new ChatModel({
            participants: [fromUserId, toUserId],
            messages: [],
          });
          await chat.save();
        }
        chat.messages.push({
          firstName,
          senderId: fromUserId,
          text,
        });
        await chat.save();

        // Identify the author, not a fixed "side" — which side a message renders
        // on is relative to whoever is viewing it, so the client decides that.
        const message: ChatMessage = {
          id: randomUUID(),
          fromUserId,
          firstName,
          text,
          createdAt: new Date().toISOString(),
        };
        io.to(room).emit("newMessage", message);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};
