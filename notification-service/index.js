import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import amqp from "amqplib/callback_api";

const app = express();
const port = 5001;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongodb:27017/tasks")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error : ", err));
