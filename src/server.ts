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

//  handle unhandledRejection error // try  catch block error

process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection at Promise, shutting down server...", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

//uncaughtException error -- local error

process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception, shutting down server...", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

//  signal termination error -- server owner termination signal

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// manually close the server by user - sigint

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
