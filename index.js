const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const AuthRouter = require("./Routes/AuthRouter.js");
const ProfileRouter = require("./Routes/ProfileRouter.js");
const JobRouter = require("./Routes/JobRouter.js");
const AdminRouter = require("./Routes/AdminRouter.js");
const ApplicationRouter = require("./Routes/ApplicationRouter.js");
const NotifcationRouter = require("./Routes/NotificationRouter.js");

require("dotenv").config();
require("./Models/db");

const PORT = process.env.PORT || 9000;

app.get("/", (req, res) => {
  res.send(`BDJOBBOX Server is running at port ${PORT}`);
});

app.use(bodyParser.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://bdjobboxe.netlify.app"],
    credentials: true,
  })
);
app.use("/auth", AuthRouter);
app.use("/update", ProfileRouter);
app.use("/jobs", JobRouter);
app.use("/admin", AdminRouter);
app.use("/applications", ApplicationRouter);
app.use("/notification", NotifcationRouter);



app.listen(PORT, () => {
  console.log(`BDJOBBOX Server is running at port ${PORT}`);
});
