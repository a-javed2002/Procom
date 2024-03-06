var express = require('express');
var router = express.Router();
var passCatModel = require('../modules/password_category');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

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
    const cart = req.session.cart || [];
    // Here you can fetch details of products in the cart from your database using the product IDs stored in the session
    res.render('cart', { cart });
});

router.post('/add-to-cart/:id', checkLoginUser, (req, res) => {
    const productId = req.params.id;
    // Get or create a cart in the session
    if (!req.session.cart) {
        req.session.cart = [];
    }
    // Add the product to the cart
    req.session.cart.push(productId);
    res.redirect('/cart'); // Redirect to products page or wherever you want
});


module.exports = router;