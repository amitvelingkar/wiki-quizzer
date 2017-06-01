const mongoose = require('mongoose');
const Category = mongoose.model('Category');

exports.getCategories = async (req, res) => {
    // 1. Query the db for list of all stores
    const categories = await Category.find().sort({ name: 'desc' });

    
    res.render('categories', { title: 'Categories', categories });
};

/*
exports.addCategory = (req, res) => {
    res.render('editCategory', { title: 'Add Category' });
};
*/

exports.createCategory = async (req, res) => {
    const category = await (new Category(req.body)).save();
    req.flash('success',`Sucessfully created <Strong>${category.name}</Strong>. Care to leave a review?`);
    res.redirect(`/store/${category.slug}`);
};

