const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

// Connect to MongoDB locally
mongoose.connect('mongodb://localhost:27017/Procom', { useNewUrlParser: true, useCreateIndex: true });

// Define schema
const productSchema = new mongoose.Schema({
    proName: {
        type: String,
        required: true,
    },
    proPics: [{
        name: String,  // File name
        url: String,   // URL or path to the image
        // You can add more properties like size, type, etc. if needed
    }],
    proPrice: {
        type: String,
        required: true,
    },
    cat_id_fk: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Assuming you have a Category model
        required: true
    },
    status: {
        type: String,
        default: "Active"
    },
    updated_date: {
        type: Date,
        default: Date.now
    },
    created_date: {
        type: Date,
        default: Date.now
    },
});

// Apply pagination plugin to the schema
productSchema.plugin(mongoosePaginate);

// Create and export model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
