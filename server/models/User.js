 // server/models/User.js
 const mongoose = require('mongoose');
 const bcrypt = require('bcryptjs');

 const UserSchema = new mongoose.Schema({
   name: {
     type: String,
     required: [true, 'Please add a name'],
   },
   email: {
     type: String,
     required: [true, 'Please add an email'],
     unique: true,
     match: [ // Basic email format validation
       /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
       'Please add a valid email',
     ],
   },
   password: {
     type: String,
     required: [true, 'Please add a password'],
     minlength: 6,
     select: false, // Do not return password by default
   },
   createdAt: {
     type: Date,
     default: Date.now,
   },
 });

 // Encrypt password using bcrypt before saving
 UserSchema.pre('save', async function (next) {
   // Only run this function if password was actually modified
   if (!this.isModified('password')) {
     return next();
   }
   // Hash the password with cost factor 10
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
   next();
 });

 // Method to compare entered password with hashed password in DB
 UserSchema.methods.matchPassword = async function (enteredPassword) {
   return await bcrypt.compare(enteredPassword, this.password);
 };

 module.exports = mongoose.model('User', UserSchema);