const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const Category = mongoose.model('Category');

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
    const category = await Category.findOne({ _id: req.params.id });
    
    axios.get(category.wikiUrl).then( (response) => {
    let $ = cheerio.load(response.data);
    let topics = [];
    $('.wikitable td > b > a').each( (i, elm) => {
        if ($(elm).text().trim().length > 1) {
            topics.push( {
            text: $(elm).text(),
            url: $(elm).attr('href'),
            accept: true
            });
        }
    });
    
    $('.wikitable tr').each(function(i, row) {
        $(this).find('td > a').eq(0).each( (j, elm) => {
            if ($(elm).text().trim().length > 1) {
                topics.push( {
                text: $(elm).text(),
                url: $(elm).attr('href'),
                accept: true
                });
            }
        });
    });
    return(topics);
    })
    .then ( (topics) => {
        res.json(topics);
    });
};
