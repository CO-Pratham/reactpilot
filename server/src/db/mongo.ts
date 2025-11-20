import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://atlas-sql-691eb48d32a37e11dbaacb4d-bkjtew.g.query.mongodb.net/sample_mflix?ssl=true&authSource=admin";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
