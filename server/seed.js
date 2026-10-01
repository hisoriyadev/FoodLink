import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './models/User.js';
import Donation from './models/Donation.js';
import Notification from './models/Notification.js';
import Chat from './models/Chat.js';
import Message from './models/Message.js';
import Tracking from './models/Tracking.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodlink';

export const seedData = async () => {
  await Promise.all([
    User.deleteMany({}),
    Donation.deleteMany({}),
    Notification.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Tracking.deleteMany({}),
  ]);

  console.log('🌱 Seeding Users...');
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // 1. Admin
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@foodlink.org',
    password: hashedPassword,
    role: 'admin',
    isVerified: true,
    phone: '+1 800-555-0199',
  });

  // 2. Donor
  const donor = await User.create({
    name: 'Grand Horizon Hotel',
    organizationName: 'Grand Horizon Hotel & Banquet',
    email: 'donor@foodlink.org',
    password: hashedPassword,
    role: 'donor',
    isVerified: true,
    phone: '+1 555-0144',
    address: '45 Connaught Place, Central Market',
    location: { coordinates: { lat: 28.6139, lng: 77.2090 } },
  });

  // 3. NGO
  const ngo = await User.create({
    name: 'Hope Foundation',
    organizationName: 'Hope Foundation Shelter',
    email: 'ngo@foodlink.org',
    password: hashedPassword,
    role: 'ngo',
    isVerified: true,
    phone: '+1 555-0188',
    address: '12 Community Care Lane',
    location: { coordinates: { lat: 28.6250, lng: 77.2150 } },
    operatingRadius: 15,
  });

  // 4. Volunteer
  const volunteer = await User.create({
    name: 'Alex Transport Driver',
    email: 'volunteer@foodlink.org',
    password: hashedPassword,
    role: 'volunteer',
    isVerified: true,
    phone: '+1 555-0177',
    isAvailable: true,
    vehicleType: 'Four Wheeler Van',
    location: { coordinates: { lat: 28.6180, lng: 77.2110 } },
  });

  console.log('🌱 Seeding Sample Food Donations...');
  const now = new Date();
  const expiryFresh = new Date(now.getTime() + 18 * 3600 * 1000);
  const expiryUrgent = new Date(now.getTime() + 2 * 3600 * 1000);

  const donation1 = await Donation.create({
    donor: donor._id,
    title: '50 Servings Cooked Rice & Curry Banquet Excess',
    category: 'Cooked',
    mealType: 'Dinner',
    quantity: 25,
    unit: 'Kg',
    peopleServed: 50,
    description: 'High-quality freshly cooked basmati rice and dal curry from evening banquet event.',
    preparationDate: now,
    expiryDate: expiryFresh,
    pickupWindow: { start: now, end: expiryFresh },
    location: {
      address: '45 Connaught Place, Central Market',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      coordinates: { lat: 28.6139, lng: 77.2090 },
    },
    specialInstructions: 'Please bring thermal insulated food containers.',
    foodCondition: 'Fresh',
    dietary: { isVeg: true, allergens: [] },
    contactNumber: '+1 555-0144',
    status: 'claimed',
    assignedTo: { ngo: ngo._id, volunteer: volunteer._id },
    freshnessScore: 92,
    priorityScore: 78,
    recommendationScore: 95,
  });

  const donation2 = await Donation.create({
    donor: donor._id,
    title: '30 Boxes Assorted Fresh Bakery Items',
    category: 'Baked',
    mealType: 'Snacks',
    quantity: 15,
    unit: 'Packets',
    peopleServed: 30,
    description: 'Freshly baked bread loaves, croissants, and muffins from morning shelf clearance.',
    preparationDate: now,
    expiryDate: expiryUrgent,
    pickupWindow: { start: now, end: expiryUrgent },
    location: {
      address: '45 Connaught Place, Central Market',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      coordinates: { lat: 28.6139, lng: 77.2090 },
    },
    specialInstructions: 'Ready for immediate pickup.',
    foodCondition: 'Fresh',
    dietary: { isVeg: true, allergens: ['Gluten'] },
    contactNumber: '+1 555-0144',
    status: 'available',
    freshnessScore: 35,
    priorityScore: 88,
    recommendationScore: 90,
  });

  console.log('🌱 Seeding Live Tracking Session...');
  await Tracking.create({
    donation: donation1._id,
    volunteer: volunteer._id,
    currentLocation: { lat: 28.6180, lng: 77.2110 },
    status: 'travelling_to_pickup',
    etaMinutes: 12,
    distanceRemainingKm: 2.4,
    routeHistory: [{ lat: 28.6180, lng: 77.2110, timestamp: now }],
  });

  console.log('🌱 Seeding Notifications...');
  await Notification.create({
    recipient: donor._id,
    title: 'Donation Claimed!',
    message: `${ngo.organizationName} claimed your donation "${donation1.title}".`,
    type: 'donation_accepted',
    relatedUser: ngo._id,
    relatedDonation: donation1._id,
  });

  await Notification.create({
    recipient: ngo._id,
    title: 'Volunteer Assigned!',
    message: `${volunteer.name} accepted transport job for "${donation1.title}".`,
    type: 'volunteer_assigned',
    relatedUser: volunteer._id,
    relatedDonation: donation1._id,
  });

  console.log('🌱 Seeding Direct Chat Session...');
  const chat = await Chat.create({
    participants: [donor._id, ngo._id],
    donation: donation1._id,
    unreadCounts: { [donor._id.toString()]: 0, [ngo._id.toString()]: 0 },
  });

  const msg1 = await Message.create({
    chat: chat._id,
    sender: ngo._id,
    content: 'Hello! Thank you for the donation. Our volunteer is en route for pickup.',
    readBy: [ngo._id, donor._id],
  });

  chat.lastMessage = msg1._id;
  await chat.save();

  console.log('----------------------------------------------------');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log('🔑 TEST ACCOUNTS (Password for all: Password@123):');
  console.log('  • Admin:     admin@foodlink.org');
  console.log('  • Donor:     donor@foodlink.org');
  console.log('  • NGO:       ngo@foodlink.org');
  console.log('  • Volunteer: volunteer@foodlink.org');
  console.log('----------------------------------------------------');
};

const runStandaloneSeed = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to MongoDB.');
    } catch {
      console.warn('⚠️ Could not connect to local MongoDB. Starting In-Memory MongoDB Server...');
      const memServer = await MongoMemoryServer.create();
      await mongoose.connect(memServer.getUri());
      console.log('✅ In-Memory MongoDB connected.');
    }
    await seedData();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  runStandaloneSeed();
}

