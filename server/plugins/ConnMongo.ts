import mongoose from "mongoose";

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) return;
    // 连接 MongoDB
    await mongoose.connect(config.mongoUrl);
    console.log("MongoDB Connect Successfully!");
  } catch (error) {
    console.log("Not found MongoDB Server");
  }
});
