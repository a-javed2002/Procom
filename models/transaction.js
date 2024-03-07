const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost:27017/Procom', { useNewUrlParser: true, useCreateIndex: true, });
mongoose.connect('mongodb+srv://user123:user123@cluster0.hjjg8dd.mongodb.net/Procom', { useNewUrlParser: true, useCreateIndex: true, });
var conn = mongoose.Collection;

var transactionSchema = new mongoose.Schema({
    cust_name: {
        type: String,
        required: true
    },
    cust_email: {
        type: String,
        required: false
    },
    cust_acc: {
        type: String,
        required: true
    },
    mer_acc: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    bank: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default:"Pending"
    },
    date: {
        type: String,
    },
    time: {
        type: String,
    },
});

var transactionModel = mongoose.model('transactions', transactionSchema);
module.exports = transactionModel;