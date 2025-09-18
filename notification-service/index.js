import amqp from "amqplib";

let connection, channel;

async function startConsuming() {
  try {
    await channel.assertQueue("task_created");
    console.log("Notification service is listening to messages");
    channel.consume("task_created", (msg) => {
      const taskData = JSON.parse(msg.content.toString());
      console.log("Notification new task : ", taskData);
      channel.ack(msg);
    });
  } catch (e) {
    console.error("RabbitMQ consuming error : ", e);
  }
}

async function connectRabbitMQWithRetry(retries = 30, delay = 5000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("✅ Connected to RabbitMQ");
      startConsuming();
      return;
    } catch (e) {
      console.error("RabbitMQ connection error : ", e);
      retries--;
      console.error("Retries left : ", retries);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.error("❌ Could not connect to RabbitMQ after retries");
}

connectRabbitMQWithRetry();
