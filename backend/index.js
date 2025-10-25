const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { authenticateToken } = require("./Middleware/auth");

const app = express();
const port = 7000;
const mongoDB = require("./db");
mongoDB();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://foodiii.vercel.app",
      "*",
      "http://localhost:5173",
    ],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`Azzay Your Foodiii app listening on port ${port}`);
});

app.use("/api/", require("./Routes/refreshToken"));
app.use("/api/", require("./Routes/CreateUser"));
app.use("/api/", require("./Routes/foodData"));
app.use("/api/", require("./Routes/OrderData"));
app.use("/api/", require("./Routes/RestOrder"));
app.use("/api/", require("./Routes/UpdateState"));

app.use("/api/", authenticateToken, require("./Routes/BabesOrder"));

app.listen(port, () => {
  console.log(`Your app listening on port ${port}`);
});
