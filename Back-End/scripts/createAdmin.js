import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../model/user_model.js';

async function makeAdmin() {
  await mongoose.connect('YOUR_MONGODB_URI');
  const hash = await bcrypt.hash('MyStrongAdminPass', 12);
  await new User({
    name: 'Site Admin',
    email: 'admin@cakesbliss.com',
    password: hash,
    phoneNumber: '0000000000',
    role: 'admin'
  }).save();
  console.log('Admin user created');
  process.exit();
}

makeAdmin();
