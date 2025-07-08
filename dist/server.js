"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const env_1 = __importDefault(require("./app/config/env"));
let server;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!env_1.default.MONGO_URI) {
        console.error("MONGO_URI is not defined in the environment variables.");
        return;
    }
    if (!env_1.default.PORT) {
        console.error("PORT is not defined in the environment variables.");
        return;
    }
    try {
        yield mongoose_1.default.connect(env_1.default.MONGO_URI);
        server = app_1.app.listen(env_1.default.PORT, () => {
            console.log(`Server is running on port ${env_1.default.PORT}`);
        });
    }
    catch (error) {
        console.error("Error connecting to the database:", error);
    }
});
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
    }
    else {
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
    }
    else {
        process.exit(0);
    }
});
