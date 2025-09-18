import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";

const app = express();
const port = 5000;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongodb:27017/users")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error : ", err));

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", UserSchema);

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal server error", details: e });
  }
});

app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get("/", (req, res) => {
  res.send("All good in user service");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
