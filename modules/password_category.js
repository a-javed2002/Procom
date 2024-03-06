const mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://user123:123@cluster0.hjjg8dd.mongodb.net/PMS', {useNewUrlParser: true, useCreateIndex: true,});
mongoose.connect('mongodb://localhost:27017/Procom', {useNewUrlParser: true, useCreateIndex: true,});

var conn =mongoose.Collection;

var passcatSchema =new mongoose.Schema({
    passord_category: {type:String, 
        required: true,
        index: {
            unique: true,        
        }},

    date:{
        type: Date, 
        default: Date.now }
});

var passCateModel = mongoose.model('password_categories', passcatSchema);
module.exports=passCateModel;