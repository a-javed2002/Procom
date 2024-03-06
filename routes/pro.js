const express = require('express');
const router = express.Router();
const Product = require('../modules/pro');
const Category = require('../modules/cat');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Middleware to check if the user is logged in
function checkLoginUser(req, res, next) {
    const userToken = localStorage.getItem('userToken');
    try {
        const decoded = jwt.verify(userToken, 'loginToken');
    } catch (err) {
        res.redirect('/');
    }
    next();
}

if (typeof localStorage === 'undefined' || localStorage === null) {
    const LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

// Set up storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Route to render the products page with inner join to fetch product category name
router.get('/', checkLoginUser, function (req, res, next) {
    const loginUser = localStorage.getItem('loginUser');
    Product.find({})
        .populate('cat_id_fk') // Populate the category information
        .exec(function (err, products) {
            if (err) {
                console.error(err);
                res.status(500).send('Error fetching products');
            } else {
                res.render('pro', { title: 'Products', loginUser: loginUser, products: products });
            }
        });
});


// GET route to render add product form
router.get('/add', checkLoginUser, async function (req, res, next) {
    const loginUser = localStorage.getItem('loginUser');
    const categories = await Category.find();
    res.render('pro-add', { title: 'Add Product', loginUser: loginUser, loginUser, categories });
});

// POST route to add a new product
router.post('/add', checkLoginUser, upload.array('proPics', 5), function (req, res, next) {
    const loginUser = localStorage.getItem('loginUser');
    const proName = req.body.proName;
    const proPics = req.files.map(file => {
        return {
            name: file.filename,
            url: '/uploads/' + file.filename
        };
    });
    const proPrice = req.body.proPrice;
    const cat_id_fk = req.body.cat_id_fk;
    const status = req.body.status || 'Active'; // Default status to Active if not provided

    const newProduct = new Product({
        proName: proName,
        proPics: proPics,
        cat_id_fk: cat_id_fk,
        proPrice: proPrice,
        status: status
    });

    newProduct.save(function (err, doc) {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving product');
        } else {
            res.redirect('/product');
        }
    });
});


// GET route to render the edit product form
router.get('/edit/:id', checkLoginUser, function(req, res, next) {
    const productId = req.params.id;
    Product.findById(productId, function(err, product) {
        if (err || !product) {
            console.error(err);
            res.status(404).send('Product not found');
        } else {
            // Fetch categories to populate the dropdown
            Category.find({}, function(err, categories) {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error fetching categories');
                } else {
                    res.render('pro-edit', { title: 'Edit Product', product: product, categories: categories });
                }
            });
        }
    });
});


// POST route to update a product
router.post('/edit/:id', checkLoginUser, function(req, res, next) {
    const productId = req.params.id;
    const updatedProductData = {
        proName: req.body.proName,
        proPrice: req.body.proPrice,
        status: req.body.status,
        cat_id_fk: req.body.cat_id_fk, // Update the category ID
        updated_at: new Date() 
        // Update other fields as needed
    };
    Product.findByIdAndUpdate(productId, updatedProductData, function(err, product) {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating product');
        } else {
            res.redirect('/product');
        }
    });
});


// POST route to delete a product
router.get('/delete/:id', checkLoginUser, function(req, res, next) {
    const productId = req.params.id;
    Product.findByIdAndDelete(productId, function(err, product) {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting product');
        } else {
            res.redirect('/product');
        }
    });
});

module.exports = router;
