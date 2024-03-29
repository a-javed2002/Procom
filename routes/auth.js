var express = require('express');
var router = express.Router();
var userModule = require('../models/user');
var bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
var transactionModel = require('../models/transaction');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');


/* GET home page. */

function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch (err) {
    res.redirect('/');
  }
  next();
}

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}



router.get('/', function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    const userRole = localStorage.getItem('userRole');
    if(userRole==0){
    res.redirect('/merchant/dashboard');
    }
    else{
      res.redirect('/payments');
    }

  } else {
    res.render('login', { title: 'PayHabib', msg: '' });
  }
});

router.post('/', function (req, res, next) {
  var username = req.body.uname;
  var password = req.body.password;
  var checkUser = userModule.findOne({ username: username });
  checkUser.exec((err, data) => {
    if (data == null) {
      //username does,not found in database 
      res.render('login', { title: 'PayHabib', msg: "Invalid Username and Password." });

    } else {
      if (err) throw err;
      var getUserID = data._id;
      var getPassword = data.password;
      var getUserRole = data.role;
      var getUserEmail = data.email;
      var getUserAcc = data.AccountNo;
      if (bcrypt.compareSync(password, getPassword)) {
        // var token = jwt.sign({ userID: getUserID }, 'loginToken');
        var token = jwt.sign({ userID: getUserID, role: getUserRole, email: getUserEmail }, 'loginToken');
        localStorage.setItem('userToken', token);
        localStorage.setItem('loginUser', username);
        localStorage.setItem('userID', getUserID);
        localStorage.setItem('userRole', getUserRole);
        localStorage.setItem('userAcc', getUserAcc);
        if(getUserRole==0){
          res.redirect('/merchant/dashboard');
        }else{
          res.redirect('/payments');
        }
      } else {
        //password does,not match 
        if(getUserRole==0){
          res.render('merchantLogin', { title: 'PayHabib', msg: "Invalid Username and Password." });
        }else{
          res.render('login', { title: 'PayHabib', msg: "Invalid Username and Password." });
        }
      }
    }
  });

});


router.get('/signup', function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    res.redirect('./dashboard');
  } else {
    res.render('signup', { title: 'PayHabib', msg: '', status: false, input: { uname: '', email: '' } });
  }
});

// Middleware to check if passwords Matches
function checkPassword(req, res, next) {
  if (req.body.password != req.body.confpassword) {
    return res.render('signup', { title: 'PayHabib', msg: 'Password Does Not Match', status: false, input: { uname: req.body.uname, email: req.body.email } });
  }
  next();
}

// Middleware to check if username exists in the database --> i in regex,makes it case-Sensitive
function checkUsername(req, res, next) {
  var uname = req.body.uname;
  var checkExistingUsername = userModule.findOne({ username: { $regex: new RegExp('^' + uname + '$', 'i') } });

  checkExistingUsername.exec((err, data) => {
    if (err) throw err;
    if (data) {
      return res.render('signup', { title: 'PayHabib', msg: 'Username Already Exists', status: false, input: { uname: req.body.uname, email: req.body.email } });
    }
    next();
  });
}

// Middleware to check if email exists in the database --> i in regex,makes it case-Sensitive
function checkEmail(req, res, next) {
  var email = req.body.email;
  var checkExistingEmail = userModule.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });

  checkExistingEmail.exec((err, data) => {
    if (err) throw err;
    if (data) {
      return res.render('signup', { title: 'PayHabib', msg: 'Email Already Exists', status: false, input: { uname: req.body.uname, email: req.body.email } });
    }
    next();
  });
}

// Middleware to check if account exists in the database --> i in regex,makes it case-Sensitive
function checkAccountNo(req, res, next) {
  var acc = req.body.AccountNo;
  var checkExistingAccountNo = userModule.findOne({ AccountNo: { $regex: new RegExp('^' + acc + '$', 'i') } });

  checkExistingAccountNo.exec((err, data) => {
    if (err) throw err;
    if (data) {
      return res.render('signup', { title: 'PayHabib', msg: 'Account Number Already Exists', status: false, input: { uname: req.body.uname, email: req.body.email, AccountNo: req.body.AccountNo, PhoneNo: req.body.PhoneNo } });
    }
    next();
  });
}


router.post('/signup', checkPassword, checkUsername, checkAccountNo, checkEmail, function (req, res, next) {
  var username = req.body.uname;
  var email = req.body.email;
  var password = req.body.password;
  var AccountNo = req.body.AccountNo;
  var PhoneNo = req.body.PhoneNo;
  var confpassword = req.body.confpassword;

  password = bcrypt.hashSync(req.body.password, 10);

  var userDetails = new userModule({
    username: username,
    email: email,
    AccountNo: AccountNo,
    PhoneNo: PhoneNo,
    password: password,
  });
  userDetails.save((err, doc) => {
    if (err) throw err;
    // Redirect to login page after successful signup
    res.redirect('/');
  });
});

router.get('/logout', function (req, res, next) {
  const userRole = localStorage.getItem('userRole');
    
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  if(userRole!=1){
    res.redirect('/merchant');
    }
  res.redirect('/');
});


// router.get('/payments', checkLoginUser, function (req, res, next) {
//   const loginUser = localStorage.getItem('loginUser');
//   const userRole = localStorage.getItem('userRole');
//     if(userRole!=1){
//     res.redirect('/merchant');
//     }
//   var getUserID = localStorage.getItem('userID');
//   var getuserAcc = localStorage.getItem('userAcc');
//   transactionModel.find({ cust_acc: getuserAcc }, function (err, payments) {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Error fetching payments');
//     } else {
//       // Preprocess the payments data
//       const processedPayments = payments.map(payment => {
//         const dateTime = new Date(payment.date);
//         const properDate = dateTime.toLocaleDateString();
//         const properTime = dateTime.toLocaleTimeString();

//         return {
//           ...payment.toObject(), // Convert Mongoose document to plain object
//           properDate: properDate,
//           properTime: properTime
//         };
//       });

//       // Render the view with processed payments data
//       res.render('paymentsUsers', {
//         title: 'Payments',
//         loginUser: loginUser,
//         payments: processedPayments
//       });
//     }
//   });
// });

router.get('/payments', checkLoginUser, function (req, res, next) {
  try {
    const loginUser = localStorage.getItem('loginUser');
    const userRole = localStorage.getItem('userRole');

    if (userRole != 1) {
      return res.redirect('/merchant');
    }

    const userAcc = localStorage.getItem('userAcc');

    transactionModel.find({ cust_acc: userAcc }, function (err, payments) {
      if (err) {
        console.error('Error fetching payments:', err);
        return res.status(500).send('Error fetching payments');
      }

      // Calculate statistics
      const totalRecords = payments.length;

      const totalRecordsPending = payments.filter(payment => payment.status === 'Pending').length;
      const totalRecordsPay = payments.filter(payment => payment.status === 'Succeeded').length;
      const totalRecordsReject = payments.filter(payment => payment.status === 'Reject').length;

      const totalPayments = payments.reduce((total, payment) => total + payment.amount, 0);

      const sumPendingAmounts = payments.reduce((total, payment) => {
        if (payment.status === 'Pending') {
          return total + payment.amount;
        }
        return total;
      }, 0);

      const sumPayAmounts = payments.reduce((total, payment) => {
        if (payment.status === 'Succeeded') {
          return total + payment.amount;
        }
        return total;
      }, 0);

      const sumRejectAmounts = payments.reduce((total, payment) => {
        if (payment.status === 'Reject') {
          return total + payment.amount;
        }
        return total;
      }, 0);

      // Render the view with processed payments data
      res.render('paymentsUsers', {
        title: 'Payments',
        loginUser: loginUser,
        payments: payments,
        totalRecords: totalRecords,
        totalPayments: totalPayments,
        totalRecordsPending: totalRecordsPending,
        totalRecordsPay: totalRecordsPay,
        totalRecordsReject: totalRecordsReject,
        sumPendingAmounts: sumPendingAmounts,
        sumPayAmounts: sumPayAmounts,
        sumRejectAmounts: sumRejectAmounts
      });
    });
  } catch (error) {
    console.error('Error handling request:', error);
    // Handle error appropriately, e.g., render an error page
    next(error);
  }
});


router.get('/paymentDetail/pay/:id', checkLoginUser, function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  const paymentId = req.params.id;
  var getuserAcc = localStorage.getItem('userAcc');

  const userRole = localStorage.getItem('userRole');
    if(userRole!=1){
    res.redirect('/merchant');
    }

  // Assuming you're using Mongoose
  transactionModel.findById(paymentId, function (err, payment) {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching payment');
    } else {
      if (!payment) {
        res.status(404).send('Payment not found');
      } else {
        const dateTime = new Date(payment.date);
        const properDate = dateTime.toLocaleDateString();
        const properTime = dateTime.toLocaleTimeString();

        if(payment.AccountNo == getuserAcc){
          res.status(404).send('You Dont have permisssion to access this');
        }

        if (payment.status!="Pending") {
          res.redirect("/payments");
        }

        const processedPayment = {
          ...payment.toObject(), // Convert Mongoose document to plain object
          properDate: properDate,
          properTime: properTime
        };

        // Render the view with processed payment data
        res.render('paymentDetail', {
          title: 'Payment Detail',
          loginUser: loginUser,
          payment: processedPayment
        });
      }
    }
  });
});


router.post('/pay', checkLoginUser, function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  const { paymentId } = req.body;

  
  const userRole = localStorage.getItem('userRole');
    if(userRole!=1){
    res.redirect('/merchant');
    }

  // Update the status of the payment
  transactionModel.findByIdAndUpdate(paymentId, { status: 'Succeeded' }, { new: true }, function (err, updatedPayment) {
    if (err) {
      console.error(err);
      return res.status(500).send('Error updating status');
    }
    if (!updatedPayment) {
      return res.status(404).send('Payment not found');
    }

    res.redirect('/payments');
  });
});

router.get('/reject/:id', checkLoginUser, function (req, res, next) {
  
  const userRole = localStorage.getItem('userRole');
    if(userRole!=1){
    res.redirect('/merchant');
    }
  const loginUser = localStorage.getItem('loginUser');
  const paymentId = req.params.id;

  // Update the status of the payment
  transactionModel.findByIdAndUpdate(paymentId, { status: 'Reject' }, { new: true }, function (err, updatedPayment) {
    if (err) {
      console.error(err);
      return res.status(500).send('Error updating status');
    }
    if (!updatedPayment) {
      return res.status(404).send('Payment not found');
    }

    res.redirect('/payments');
  });
});


router.get('/upload', checkLoginUser, function (req, res, next) {
  const userRole = localStorage.getItem('userRole');
    if(userRole!=1){
    res.redirect('/merchant');
    }
  var loginUser = localStorage.getItem('loginUser');

  res.render('uploads', { title: 'PayHabib', loginUser: loginUser, errors: '', success: '' });

});


// Define route to handle the incoming request with parameters
router.get('/read', (req, res) => {
  const loginUser = localStorage.getItem('loginUser');
  var getuserAcc = localStorage.getItem('userAcc');

  // Retrieve query parameters
  const p_id = req.query.p_id;
  const cust_name = req.query.cust_name;
  const cust_email = req.query.cust_email;
  const cust_acc = req.query.cust_acc;
  const mer_acc = req.query.mer_acc;
  const desc = req.query.desc;
  const bank = req.query.bank;
  const amount = req.query.amount;

  // Decode parameter values if needed
  // In this example, assume that decoding is necessary
  const decoded_cust_name = decodeURIComponent(cust_name);
  const decoded_cust_email = decodeURIComponent(cust_email);
  const decoded_cust_acc = decodeURIComponent(cust_acc);
  const decoded_mer_acc = decodeURIComponent(mer_acc);
  const decoded_desc = decodeURIComponent(desc);
  const decoded_bank = decodeURIComponent(bank);
  const decoded_amount = decodeURIComponent(amount);

  console.log(getuserAcc)

  // Create transaction object
  // const transaction = {
  //   cust_name: decoded_cust_name,
  //   cust_email: decoded_cust_email,
  //   cust_acc: decoded_cust_acc,
  //   mer_acc: decoded_mer_acc,
  //   desc: decoded_desc,
  //   bank: decoded_bank,
  //   amount: parseFloat(decoded_amount) // Assuming amount is a number
  // };

  // Now you can use the 'transaction' object as needed
  // console.log(transaction);

  // res.render('paymentDetail', {
  //   title: 'Payment Detail',
  //   loginUser: loginUser,
  //   payment: transaction
  // });


  res.redirect("/paymentDetail/pay/" + p_id);

});




module.exports = router;
