import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// models
import Order from './model/order_model.js';
import User from './model/user_model.js';
import Product from './model/product_model.js';

// routes
import adminRoutes from "./routes/admin.js";
import recommendationsRoutes from "./routes/recommendations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// ========== MIDDLEWARE ==========
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: "http://localhost:5500"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static serving
app.use(express.static(path.join(__dirname, "..", 'Front-End')));

// Protect only admin API routes
app.use('/admin/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "secret");
    if (decoded.role !== "admin") throw new Error("not admin");
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
});

// create uploads folder if missing
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// ========== MULTER ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ========== MONGO DB ==========
mongoose.connect("mongodb+srv://lakhenaina:dzizz056KMfpwWsx@cluster0.0kxtmbo.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log("DB connected"))
  .catch(err => console.error("DB connection error", err));

// ========== AUTH ROUTES ==========
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const nameRegex = /^[A-Za-z\s]{1,20}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^[0-9]{10}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#?&])[A-Za-z\d@$!%#?&]{8,}$/;

    if (!nameRegex.test(name)) {
      return res.status(400).json({ success: false, message: 'Name must contain only letters, max 20 chars' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email must end with @gmail.com' });
    }
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8 chars, include uppercase, lowercase, number, symbol' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, phoneNumber, role: 'customer' });
    await user.save();

    res.json({ success: true, message: "Registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === "admin@cakesbliss.com" && password === "admin123") {
      const token = jwt.sign({ role: "admin" }, "secret", { expiresIn: "1d" });
      return res.json({ success: true, role: "admin", token });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).json({ success: false, message: "Wrong password" });

    res.json({ success: true, role: "customer", userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// protect admin routes
app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing token" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, "secret");
      if (decoded.role !== "admin") throw new Error("not admin");
      next();
    } catch {
      return res.status(403).json({ message: "Invalid token" });
    }
  } else {
    next();
  }
});

// ========== REGISTER ADMIN ROUTES ==========
app.use("/admin", adminRoutes);

// ========== PRODUCT ROUTES ==========
app.post('/add-product', upload.single('image'), async (req, res) => {
  try {
    const { title, price, category, description } = req.body;
    if (!title || !price || !category || !req.file) {
      return res.status(400).json({ message: "All fields required" });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const product = new Product({
      title,
      price: parseFloat(price),
      category,
      description,
      imageUrl
    });
    await product.save();
    res.status(201).json({ success: true, message: "Product added", product });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete error" });
  }
});

app.patch('/products/:id', async (req, res) => {
  try {
    const { title, price, description } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { title, price, description });
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ message: "Update error" });
  }
});

// ========== ORDER ROUTES ==========
app.post('/orders', async (req, res) => {
  try {
    const { userId, items, total, paymentMethod,
            senderName, senderEmail, deliveryLocation,
            receiverPhone, deliveryDate, timeSlot, orderNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }

    if (!senderName || !senderEmail || !deliveryLocation || !receiverPhone || !deliveryDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({ success: false, message: "Some products not found" });
    }

    const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).select('orderNumber');

    // Safely compute the next order number. Ensure numeric coercion and
    // fall back to aggregation or default starting value to avoid NaN.
    let nextOrderNumber = 101;
    if (lastOrder && lastOrder.orderNumber != null) {
      const lastNum = Number(lastOrder.orderNumber);
      if (Number.isFinite(lastNum)) {
        nextOrderNumber = Math.max(101, Math.floor(lastNum) + 1);
      } else {
        // Attempt an aggregation fallback to derive a numeric max orderNumber
        try {
          const agg = await Order.aggregate([
            { $group: { _id: null, maxOrder: { $max: "$orderNumber" } } }
          ]);
          const aggMax = agg && agg[0] && Number(agg[0].maxOrder);
          if (Number.isFinite(aggMax)) {
            nextOrderNumber = Math.max(101, Math.floor(aggMax) + 1);
          }
        } catch (e) {
          // if aggregation fails, keep default nextOrderNumber
          console.warn('Aggregation fallback for orderNumber failed:', e.message);
        }
      }
    }

    // Ensure nextOrderNumber is a finite number before saving
    const safeOrderNumber = Number.isFinite(Number(nextOrderNumber)) ? Number(nextOrderNumber) : 101;

    // Normalize paymentMethod (accept case-insensitive values like 'esewa')
    const normalizedPaymentMethod = typeof paymentMethod === 'string' ? paymentMethod : '';

    const order = new Order({
      orderNumber: safeOrderNumber,
      user: userId || null,
      items: items.map(i => ({
        product: i.product,
        quantity: i.quantity,
        price: i.price
      })),
      total,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: (typeof normalizedPaymentMethod === 'string' && normalizedPaymentMethod.toLowerCase() === "esewa") ? "paid" : "pending",
      status: "Pending",
      createdAt: new Date(),
      deliveryDetails: {
        senderName,
        senderEmail,
        deliveryLocation,
        receiverPhone,
        deliveryDate,
        timeSlot,
        orderNotes
      }
    });

    await order.save();
    res.json({ success: true, message: "Order placed", orderId: order._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

// ========== USER ROUTES ==========
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.get('/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate("items.product", "title price");
    res.json({ data: orders });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user orders" });
  }
});

// ========== SEARCH ==========
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query missing" });

    const words = query.split(/\s+/);
    const regexArray = words.map(word => ({
      title: { $regex: word, $options: "i" }
    }));
    const products = await Product.find({ $and: regexArray });
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ message: "Search error" });
  }
});

// ========== START ==========
// ========== RECOMMENDATIONS ROUTES ==========
app.use("/api", recommendationsRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
