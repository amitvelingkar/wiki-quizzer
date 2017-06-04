const mongoose = require('mongoose');
const Category = mongoose.model('Category');
var Xray = require('x-ray');

exports.getCategories = async (req, res) => {
    // 1. Query the db for list of all stores
    const categories = await Category.find().sort({ name: 'desc' });
    res.render('categories', { title: 'Categories', categories });
};

exports.addCategory = (req, res) => {
    res.render('editCategory', { title: 'Add Category' });
};

exports.createCategory = async (req, res) => {
    const category = await (new Category(req.body)).save();
    req.flash('success',`Sucessfully created <Strong>${category.name}</Strong>. Go ahead and populate topics!`);
    res.redirect(`/categories`);
};

exports.getCategoryBySlug = async (req, res, next) => {
    // 1. find the store given the id
    const category = await Category
    .findOne({ slug: req.params.slug })
    .populate('topics');
    if (!category) return next();

    // 2. render the page to view the category
    res.render('category', { title: `${category.name}`, category });
};

exports.populateTopics = async (req,res) => {
    const category = await Category.findOne({ slug: req.params.slug });

    // TDOD - if you remove bold you will get everything
    // solution is to filter for each row if needed
    // let us see if we need this.
    var x = Xray();
    x(category.wikiUrl, '.wikitable td > b > a', [{
        name: '',
        url: '@href'
    }])(function(err, results) {
        if (err) {
            console.log("xray error");
            console.log(err);
            return;
        }
        res.render('populateTopics', { title: `Populating ${category.name}`, category: category, topics: results } );
    });
};
