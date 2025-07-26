import { createClient } from "redis";
import envVariables from "./env";

export const redisClient = createClient({
  username: envVariables.REDIS.REDIS_USERNAME,
  password: envVariables.REDIS.REDIS_PASSWORD,
  socket: {
    host: envVariables.REDIS.REDIS_HOST,
    port: Number(envVariables.REDIS.REDIS_PORT),
  },
});

// eslint-disable-next-line no-console
redisClient.on("error", (err) => console.log("Redis Client Error", err));

// await client.set("foo", "bar");
// const result = await client.get("foo");
// console.log(result); // >>> bar

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    // eslint-disable-next-line no-console
    console.log("Connected to Redis");
  }
};
