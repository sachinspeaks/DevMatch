import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import "./utils/cronJob.js";
import http from "http";
import { initializeSocket } from "./utils/socket.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (error) {}
};

startServer();
