import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import foodRouter from './routers/food.router.js';
import userRouter from './routers/user.router.js';
import orderRouter from './routers/order.router.js';
import uploadRouter from './routers/upload.router.js';
import { dbconnect } from './config/database.config.js';
import path, { dirname } from 'path';
import crypto from 'crypto'; // Moved import statement for crypto to the top

dotenv.config();
dbconnect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: ['http://localhost:3000'] }));

app.use('/api/foods', foodRouter);
app.use('/api/users', userRouter);
app.use('/api/orders', orderRouter);
app.use('/api/upload', uploadRouter);

const publicFolder = path.join(__dirname, 'public');
app.use(express.static(publicFolder));

// RAZORPAY GATEWAY
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET // Replace with your Razorpay Key Secret
});

// Create order endpoint
app.post("/create-order", async (req, res) => {
  const { amount, currency } = req.body; // amount in paise (e.g., 50000 for INR 500)

  try {
    const options = {
      amount: amount, // amount in the smallest currency unit
      currency: currency,
      receipt: "receipt#1" // unique receipt id
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating order: ", error);
    res.status(500).send("Something went wrong!");
  }
});

// Verify payment endpoint
app.post("/verify-payment", async (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  // Verify the signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(order_id + "|" + payment_id) // Corrected variable names to match destructured req.body
    .digest("hex");

  if (generatedSignature === signature) {
    // Signature is valid; process the payment
    res.status(200).json({ message: "Payment verified", order_id }); // Sending order_id in the response
  } else {
    res.status(400).json({ message: "Invalid signature" });
  }
});

// Serving the React app
app.get('*', (req, res) => {
  const indexFilePath = path.join(publicFolder, 'index.html');
  res.sendFile(indexFilePath);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
