const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    notes: Array
});

module.exports = mongoose.model("User", userSchema);