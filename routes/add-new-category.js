var express = require('express');
var router = express.Router();
var passCatModel = require('../modules/password_category');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

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

router.get('/',checkLoginUser, function(req, res, next) {
    var loginUser=localStorage.getItem('loginUser');
    
    res.render('addNewCategory', { title: 'PayHabib',loginUser: loginUser,errors:'',success:'' });
  
    });

router.post('/',checkLoginUser, [ check('passwordCategory','Enter Password Category Name').isLength({ min: 1 })],function(req, res, next) {
        var loginUser=localStorage.getItem('loginUser');
        const errors = validationResult(req);
        if(!errors.isEmpty()){
         
          res.render('addNewCategory', { title: 'PayHabib',loginUser: loginUser, errors:errors.mapped(),success:'' });
      
        }else{
           var passCatName =req.body.passwordCategory;
           var passcatDetails =new passCatModel({
            passord_category: passCatName
           });
      
           passcatDetails.save(function(err,doc){
             if(err) throw err;
             res.render('addNewCategory', { title: 'PayHabib',loginUser: loginUser, errors:'', success:'Password category inserted successfully' });
      
           })
          
        }
        });

        router.get('/autocomplete/',function(req,res,next){
          var regex = new RegExp(req.query["term"],'i');

          var filter = passCatModel.find({passord_category:regex},{'passord_category':1}).sort({"date":-1}).limit(3);

          filter.exec(function(err,data){
            console.log(data);
            var result=[];
            if(!err){
              if(data&&data.length&&data.length>0){
                data.forEach(x=>{
                  let obj={
                    // id:x.id,
                    label:x.passord_category
                  }
                  result.push(obj);
                });
              }
              res.jsonp(result);
              console.log(result);
            }
          });
        })
  
  module.exports = router;