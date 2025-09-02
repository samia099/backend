const mongoose = require("mongoose");

// const mongo_url = process.env.MONGO_CONN;

mongoose
  .connect(process.env.MONGO_CONN, {
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    socketTimeoutMS: 45000, // Socket inactivity timeout
  })
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });
