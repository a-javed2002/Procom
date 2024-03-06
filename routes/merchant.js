var express = require('express');
var userModule = require('../modules/user');
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var transactionModel = require('../modules/transaction');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');
const qr = require('qrcode');
const nodemailer = require('nodemailer');



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

router.get('/', checkLoginUser, function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  passModel.countDocuments({}).exec((err, count) => {
    passCatModel.countDocuments({}).exec((err, countasscat) => {
      res.render('dashboard', { title: 'PayHabib', loginUser: loginUser, msg: '', totalPassword: count, totalPassCat: countasscat });
    });
  });
});


router.get('/users', checkLoginUser, function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  userModule.find({}, function (err, user) {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching categories');
    } else {
      res.render('users', { title: 'List of Users', loginUser: loginUser, userss: user });
    }
  });
});

router.get('/payments', checkLoginUser, function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  transactionModel.find({}, function (err, payments) {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching payments');
    } else {
      // Preprocess the payments data
      const processedPayments = payments.map(payment => {
        const dateTime = new Date(payment.date);
        const properDate = dateTime.toLocaleDateString();
        const properTime = dateTime.toLocaleTimeString();

        return {
          ...payment.toObject(), // Convert Mongoose document to plain object
          properDate: properDate,
          properTime: properTime
        };
      });

      // Render the view with processed payments data
      res.render('payments', {
        title: 'Payments',
        loginUser: loginUser,
        payments: processedPayments
      });
    }
  });
});



// Function to generate QR code and return the image data
async function generateQR(text) {
  try {
    // Generate QR code as a Data URI
    const qrDataURI = await qr.toDataURL(text);
    return qrDataURI.split(',')[1]; // Return the base64 encoded image data
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

router.post('/payments', checkLoginUser, async function (req, res, next) {
  const { cust_acc, mer_acc, desc, amount, cust_name, cust_email, bank } = req.body;

  // Assuming transactionModel is your Mongoose model for transactions
  const newTransaction = new transactionModel({
    cust_name: cust_name,
    cust_email: cust_email,
    cust_acc: cust_acc,
    mer_acc: mer_acc,
    bank: bank,
    desc: desc,
    amount: amount,
  });

  try {
    await newTransaction.save(); // Wait for transaction to be saved

    if (cust_email != "") {
      // Generate QR code
      // const qrImageData = await generateQR(`http://localhost:3000/merchant/payments?${cust_name},${cust_email},${cust_acc},${mer_acc},${desc},${bank},${amount}`);

      const cust_name_encoded = encodeURIComponent(cust_name);
      const cust_email_encoded = encodeURIComponent(cust_email);
      const cust_acc_encoded = encodeURIComponent(cust_acc);
      const mer_acc_encoded = encodeURIComponent(mer_acc);
      const desc_encoded = encodeURIComponent(desc);
      const bank_encoded = encodeURIComponent(bank);
      const amount_encoded = encodeURIComponent(amount);

      const qrUrl = `http://localhost:3000/read?p_id=${newTransaction._id}`;
      // const qrUrl = `http://localhost:3000/read?cust_name=${cust_name_encoded}&cust_email=${cust_email_encoded}&cust_acc=${cust_acc_encoded}&mer_acc=${mer_acc_encoded}&desc=${desc_encoded}&bank=${bank_encoded}&amount=${amount_encoded}`;

      const qrImageData = await generateQR(qrUrl);


      // Nodemailer transporter setup
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'abdjav2002@gmail.com',
          pass: 'cram tbhi uhth xzul'
        }
      });

      // Email options
      const mailOptions = {
        from: 'abdjav2002@gmail.com',
        to: cust_email,
        subject: 'Payment QR Code',
        text: `Please find the QR code for your payment attached.`,
        attachments: [{
          filename: 'payment_qr_code.png',
          content: qrImageData,
          encoding: 'base64'
        }]
      };

      // Send email
      await transporter.sendMail(mailOptions);

      console.log('Email sent successfully');
    }

    res.redirect('/merchant/payments');
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Error occurred while processing payment');
  }
});


router.get('/create', checkLoginUser, function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  res.render('create', { title: 'Create Payment', loginUser: loginUser, errors: '', success: '' });

});

module.exports = router;
