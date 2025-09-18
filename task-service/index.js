import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import amqp from "amqplib";

const app = express();
const port = 5001;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongodb:27017/tasks")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error : ", err));

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Task = mongoose.model("Task", TaskSchema);

let channel, connection;

async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
      return;
    } catch (e) {
      console.error("RabbitMQ connection error : ", e.message);
      retries--;
      console.error("Retries : ", retries);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

app.get("/task", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post("/task", async (req, res) => {
  const { title, description, userId } = req.body;

  try {
    const task = new Task({ title, description, userId });
    await task.save();

    const message = {
      taskId: task._id,
      userId,
      title,
    };

    if (!channel) {
      return res.status(503).json({ error: "RabbitMQ not connected" });
    }

    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));

    res.status(201).json(task);
  } catch (err) {
    console.log("Error : ", err);
    res.json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("All good in task service");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
  connectRabbitMQWithRetry();
});
