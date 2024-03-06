const express = require('express');
const router = express.Router();
const passCatModel = require('../modules/cat');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const getPassCat = passCatModel.find({});

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

// Route to render the category page
router.get('/', checkLoginUser, function (req, res, next) {
    const loginUser = localStorage.getItem('loginUser');
    passCatModel.find({}, function (err, categories) {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching categories');
        } else {
            res.render('cat', { title: 'Categories', loginUser: loginUser, categories: categories });
        }
    });
});

// GET route to render add category form
router.get('/add', checkLoginUser, function (req, res, next) {
    const loginUser = localStorage.getItem('loginUser');
    getPassCat.exec(function (err, data) {
        if (err) throw err;
        res.render('cat-add', { title: 'PayHabib', loginUser: loginUser, records: data, success: '' });
    });
});

// POST route to add a new category
router.post('/add', checkLoginUser, upload.single('imagefile'), function (req, res, next) {
    const loginUser = localStorage.getItem('loginUser');
    const catName = req.body.catName;
    const catPic = req.file.filename; // Get the filename of the uploaded image

    const newCategory = new passCatModel({
        catName: catName,
        catPic: catPic
    });

    newCategory.save(function (err, doc) {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving category');
        } else {
            getPassCat.exec(function (err, data) {
                if (err) throw err;
                // res.render('cat', { title: 'PayHabib', loginUser: loginUser, records: data, success: 'Category Added Successfully' });
                res.redirect('/category'); 
            });
        }
    });
});

// GET route to render the edit category form
router.get('/edit/:id', checkLoginUser, function(req, res, next) {
    const categoryId = req.params.id;
    passCatModel.findById(categoryId, function(err, category) {
        if (err || !category) {
            console.error(err);
            res.status(404).send('Category not found');
        } else {
            res.render('cat-edit', { title: 'Edit Category', category: category });
        }
    });
});

// POST route to update a category
router.post('/edit/:id', checkLoginUser, function(req, res, next) {
    const categoryId = req.params.id;
    const updatedCategoryData = {
        catName: req.body.catName,
        status: req.body.status
        // Update other fields as needed
    };
    passCatModel.findByIdAndUpdate(categoryId, updatedCategoryData, function(err, category) {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating category');
        } else {
            res.redirect('/category');
        }
    });
});

// POST route to delete a category
router.get('/delete/:id', checkLoginUser, function(req, res, next) {
    const categoryId = req.params.id;
    passCatModel.findByIdAndDelete(categoryId, function(err, category) {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting category');
        } else {
            res.redirect('/category');
        }
    });
});

module.exports = router;
