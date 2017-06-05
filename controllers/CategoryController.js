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

exports.updateCategory = async (req, res) => {

    // 1. find and update the store given the id
    const category = await Category.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec();

    req.flash('success',`Sucessfully updated <Strong>${category.name}</Strong>. <a href="/category/${category.slug}">View Category</a>`);
    res.redirect(`/category/${category._id}/edit`);
};

exports.editCategory = async (req, res) => {
    // 1. find the store given the id
    const category = await Category.findOne({ _id: req.params.id });

    // 2. confirm they are the owner of the store
    //confirmOwner(store, req.user);

    // 3. render edit form for users to edit the store
    res.render('editCategory', { title: `Edit ${category.name}`, category });
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
    x(category.wikiUrl, category.selector || '.wikitable td > b > a', [{
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
