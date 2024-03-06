var express = require('express');
var router = express.Router();
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var jwt = require('jsonwebtoken');
var multer = require('multer');
var path = require('path');

var getPassCat= passCatModel.find({});
/* GET home page. */

function checkLoginUser(req,res,next){
  var userToken=localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch(err) {
    res.redirect('/');
  }
  next();
}

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}



// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: 'public/uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });





router.get('/', checkLoginUser,function(req, res, next) {
    var loginUser=localStorage.getItem('loginUser');
    getPassCat.exec(function(err,data){
  if(err) throw err;
  res.render('add-new-password', { title: 'PayHabib',loginUser: loginUser,records: data,success:''});
  
    });
    });
  
    router.post('/', checkLoginUser,upload.single('imagefile'),function(req, res, next) {

      // if (!req.file) {
      //   return res.status(400).send('No file uploaded.');
      // }

      var loginUser=localStorage.getItem('loginUser');
  var pass_cat= req.body.pass_cat;
  var project_name= req.body.project_name;
  var pass_details= req.body.pass_details;
  var img = req.body.imagefile;
  var password_details= new passModel({
    password_category:pass_cat,
    project_name:project_name,
    password_detail:pass_details,
    pass_img:img
  });
      
    password_details.save(function(err,doc){
      getPassCat.exec(function(err,data){
        if(err) throw err;
      res.render('add-new-password', { title: 'PayHabib',loginUser: loginUser,records: data,success:"Password Details Inserted Successfully"});
    
    });
    
      });
      });
  
  module.exports = router;