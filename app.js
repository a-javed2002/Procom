var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');


var authRouter = require('./routes/auth');
var merchantRouter = require('./routes/merchant');
var dashboardRouter = require('./routes/dashboard');
var addNewCateRouter = require('./routes/add-new-category');
var ViewPassCateRouter = require('./routes/passwordCategory');
var addNewPassRouter = require('./routes/add-new-password');
var viewAllPassRouter = require('./routes/view-all-password');
var passwordDetailsRouter = require('./routes/password-detail');
var joinRouter = require('./routes/join');
var cartRouter = require('./routes/cart');
var catRouter = require('./routes/cat');
var proRouter = require('./routes/pro');

var app = express();

app.use(session({
  secret: 'abd',
  resave: false,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Middleware to parse JSON and urlencoded request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', authRouter);
app.use('/cart', cartRouter);
app.use('/dashboard', dashboardRouter);
app.use('/add-new-category', addNewCateRouter);
app.use('/passwordCategory', ViewPassCateRouter);
app.use('/add-new-password', addNewPassRouter); 
app.use('/view-all-password', viewAllPassRouter);
app.use('/password-detail', passwordDetailsRouter);
app.use('/merchant', merchantRouter);
app.use('/join', joinRouter);
app.use('/category', catRouter);
app.use('/product', proRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
