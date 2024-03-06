const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
// mongoose.connect('mongodb+srv://user123:123@cluster0.hjjg8dd.mongodb.net/PMS', {useNewUrlParser: true, useCreateIndex: true,});
mongoose.connect('mongodb://localhost:27017/Procom', {useNewUrlParser: true, useCreateIndex: true,});
var conn =mongoose.Collection;

var passSchema =new mongoose.Schema({
    password_category: {type:String, 
        required: true,
        },
        project_name: {type:String, 
            required: true,
           },
        password_detail: {type:String, 
            required: true,
           },
    date:{
        type: Date, 
        default: Date.now },
    pass_img:{
        type: String,  }
});

passSchema.plugin(mongoosePaginate);

var passModel = mongoose.model('password_details', passSchema);
module.exports=passModel;