const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

// Connect to MongoDB locally
mongoose.connect('mongodb://localhost:27017/Procom', { useNewUrlParser: true, useCreateIndex: true });

// Define schema
const passSchema = new mongoose.Schema({
    catName: {
        type: String,
        required: true,
    },
    catPic: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "Active"
    },
    date: {
        type: Date,
        default: Date.now
    },
});

// Apply pagination plugin to the schema
passSchema.plugin(mongoosePaginate);

// Create and export model
const Category = mongoose.model('Category', passSchema);
module.exports = Category;
