import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import "./utils/cronJob.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (error) {}
};

startServer();
