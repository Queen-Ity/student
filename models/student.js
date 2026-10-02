const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
name: {
    type: String,
    required: true,
    trim: true
},
email: {
    type: String,
    required: true,
    unique: true,
    trim: true
},
age: {
    type: Number,
    required: true,
    min: 16,
    max: 100
},
course: {
    type: String,
    required: true,
    trim: true
}
}, {
timestamps: true    
})

module.exports = mongoose.model('Student', studentSchema);