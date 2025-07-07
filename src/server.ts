import { Server } from "http";
import mongoose from "mongoose";
import config from "./app/config";
import { app } from "./app";

let server: Server;

const startServer = async () => { 
  if (!config.MONGO_URI) {
    console.error("MONGO_URI is not defined in the environment variables.");
    return;
  }
  if (!config.PORT) {
    console.error("PORT is not defined in the environment variables.");
    return;
  }

  try {
    await mongoose.connect(config.MONGO_URI);

    server = app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

startServer();
