var express = require('express');
var router = express.Router();
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var jwt = require('jsonwebtoken');

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


router.get('/', checkLoginUser,function(req, res, next) {
    var loginUser=localStorage.getItem('loginUser');
    passModel.countDocuments({}).exec((err,count)=>{
      passCatModel.countDocuments({}).exec((err,countasscat)=>{    
    res.render('dashboard', { title: 'PayHabib', loginUser:loginUser,msg:'',totalPassword:count, totalPassCat:countasscat });
    });
  });
  });

  module.exports = router;