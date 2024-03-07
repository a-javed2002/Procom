var express = require('express');
var userModule = require('../models/user');
var transactionModel = require('../models/transaction');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');
const qr = require('qrcode');
const nodemailer = require('nodemailer');
const os = require('os');


function checkLoginMerchant(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
    // const userRole = localStorage.getItem('userRole');
    // if(userRole!=0){
    // res.redirect('/merchant');
    // }
  } catch (err) {
    res.redirect('/merchant');
  }
  next();
}

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

router.get('/dashboard', checkLoginMerchant, function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  var getuserAcc = localStorage.getItem('userAcc');
  res.render('dashboard', { title: 'PayHabib', loginUser: loginUser, errors: '', success: '' });
});

router.get('/', function (req, res, next) {
  res.render('merchantLogin', { title: 'PayHabib', msg: '', });
});


// router.get('/users', checkLoginMerchant, function (req, res, next) {
//   const loginUser = localStorage.getItem('loginUser');
//   const userRole = localStorage.getItem('userRole');
//   const acc = localStorage.getItem('userAcc');
//     if(userRole!=0){
//     res.redirect('/merchant');
//     }
//   userModule.find({}, function (err, user) {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Error fetching categories');
//     } else {
//       res.render('users', { title: 'List of Users', loginUser: loginUser, userss: user });
//     }
//   });
// });

router.get('/users', checkLoginMerchant, async function (req, res, next) {
  try {
    const loginUser = localStorage.getItem('loginUser');
    const userRole = localStorage.getItem('userRole');
    const acc = localStorage.getItem('userAcc');

    if (userRole != 0) {
      return res.redirect('/merchant');
    }

    console.log(acc);

    // Fetch transactions that have mer_acc matching acc
    const transactions = await transactionModel.find({ mer_acc: acc });

    // Array to hold users
    let users = [];

    // Iterate through transactions and fetch users with matching AccountNo
    for (const transaction of transactions) {
      var count = 0;
      const user = await userModule.findOne({ AccountNo: transaction.cust_acc });
      if (user) {
        for (const x of users) {
          if (x.AccountNo == user.AccountNo) {
            count++;
          }
        }
        if (count == 0) {
          users.push(user);
        }
      }
    }

    // Render the view with filtered user data
    res.render('users', { title: 'List of Users', loginUser: loginUser, userss: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    // Handle error appropriately, e.g., render an error page
    next(error);
  }
});




// router.get('/users', checkLoginMerchant, async function (req, res, next) {
//   try {
//     const loginUser = localStorage.getItem('loginUser');
//     const userRole = localStorage.getItem('userRole');
//     const acc = localStorage.getItem('userAcc');

//     if (userRole != 0) {
//       return res.redirect('/merchant');
//     }

//     console.log(acc);

//     // Fetch users whose account number matches in transactions
//     const users = await userModule.aggregate([
//       {
//         $lookup: {
//           from: "transactions",
//           localField: "AccountNo",
//           foreignField: "mer_acc",
//           as: "transactions"
//         }
//       },
//       {
//         $match: {
//           "transactions.mer_acc": acc
//         }
//       }
//     ]);

//     // Render the view with filtered user data
//     res.render('users', { title: 'List of Users', loginUser: loginUser, userss: users });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     // Handle error appropriately, e.g., render an error page
//     next(error);
//   }
// });



router.get('/payments', checkLoginMerchant, async function (req, res, next) {
  try {
    const loginUser = localStorage.getItem('loginUser');
    const userRole = localStorage.getItem('userRole');
    const acc = localStorage.getItem('userAcc');
    if (userRole != 0) {
      res.redirect('/merchant');
    }

    // Find all transactions
    const payments = await transactionModel.find({ mer_acc: acc });

    // Calculate the total number of records
    const totalRecords = payments.length;

    // Filter payments based on status and calculate the total records for each status
    const totalRecordsPending = payments.filter(payment => payment.status === 'Pending').length;
    const totalRecordsPay = payments.filter(payment => payment.status === 'Succeeded').length;
    const totalRecordsReject = payments.filter(payment => payment.status === 'Reject').length;

    // Calculate the total sum of payments
    const totalPayments = payments.reduce((total, payment) => total + payment.amount, 0);

    // Calculate the sum of amounts for each type of transaction
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
    res.render('payments', {
      title: 'Payments',
      payments: payments,
      loginUser: loginUser,
      totalRecords: totalRecords,
      totalPayments: totalPayments,
      totalRecordsPending: totalRecordsPending,
      totalRecordsPay: totalRecordsPay,
      totalRecordsReject: totalRecordsReject,
      sumPendingAmounts: sumPendingAmounts,
      sumPayAmounts: sumPayAmounts,
      sumRejectAmounts: sumRejectAmounts,
      msg: ""
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    // Handle error appropriately, e.g., render an error page
    next(error);
  }
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

// Middleware to check if account number exists in the database
function checkAccountNo(req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  const userAcc = localStorage.getItem('userAcc');
  var acc = req.body.cust_acc;
  console.log(acc);
  var checkExistingAccount = userModule.findOne({ AccountNo: acc });

  checkExistingAccount.exec((err, data) => {
    if (err) {
      console.error('Error checking account:', err);
      return res.status(500).send('Internal Server Error');
    }

    console.log(data);

    if (!data) {
      // If account does not exist, render a message or redirect
      return res.render('create', {
        title: 'PayHabib',
        msg: 'Customer Account Not Found',
        status: false,
        loginUser: loginUser,
        merAcc: userAcc,
        input: { uname: req.body.uname, email: req.body.email, }
      });
    }

    // If account exists, proceed to the next middleware or route handler
    next();
  });
}


router.post('/payments', checkLoginMerchant, checkAccountNo, async function (req, res, next) {
  const { cust_acc, mer_acc, desc, amount, cust_name, cust_email, bank } = req.body;

  const userRole = localStorage.getItem('userRole');
  const userAcc = localStorage.getItem('userAcc');
  if (userRole != 0) {
    res.redirect('/merchant');
  }
  const dateTime = new Date();
  // Assuming transactionModel is your Mongoose model for transactions
  const newTransaction = new transactionModel({
    cust_name: cust_name,
    cust_email: cust_email,
    cust_acc: cust_acc,
    mer_acc: userAcc,
    bank: bank,
    desc: desc,
    amount: amount,
    date: dateTime.toLocaleDateString(),
    time: dateTime.toLocaleTimeString()
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

      // Get network interfaces
      // const networkInterfaces = os.networkInterfaces();

      // // Filter out internal and non-IPv4 addresses
      // const localIP = Object.keys(networkInterfaces)
      //   .map(interfaceName => networkInterfaces[interfaceName].find(address => address.family === 'IPv4' && !address.internal))
      //   .filter(Boolean)[0].address;

      // console.log(localIP);

      // Get network interfaces
      const networkInterfaces = os.networkInterfaces();

      // Filter out the wireless adapter by name
      const wirelessInterface = Object.keys(networkInterfaces)
        .map(interfaceName => networkInterfaces[interfaceName].find(address => !address.internal && address.family === 'IPv4' && interfaceName.includes('Wi-Fi')))
        .filter(Boolean)[0];

      // Get the IP address if the wireless interface is found
      const wirelessIP = wirelessInterface ? wirelessInterface.address : 'No wireless adapter found';
      console.log(wirelessIP);

      // const qrUrl = `http://${wirelessIP}:3000/read?p_id=${newTransaction._id}`;//main
      const qrUrl = `https://procom-production.up.railway.app/read?p_id=${newTransaction._id}`;



      // const qrUrl = `http://localhost:3000/read?p_id=${newTransaction._id}`;
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


router.get('/create', checkLoginMerchant, function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  const userRole = localStorage.getItem('userRole');
  const userAcc = localStorage.getItem('userAcc');
  if (userRole != 0) {
    res.redirect('/merchant');
  }
  res.render('create', { title: 'Create Payment', loginUser: loginUser, errors: '', success: '', merAcc: userAcc, msg: "" });

});

module.exports = router;
