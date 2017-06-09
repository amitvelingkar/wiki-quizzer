const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const Topic = mongoose.model('Topic');
const {scrapeTopics, scrapeClues, addCluesToTopic} = require('../handlers/wikiscraper');

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

exports.createTopics = async(req,res) => {
    //res.json(req.body);
    let topicPromises = [];
    for (topic of req.body.topics) {
        const topicPromise = (new Topic({name: topic.name, wikiUrl: topic.wikiUrl, category: topic.category})).save();
        topicPromises.push(topicPromise);
    }

    // wait till all saves are done
    await Promise.all(topicPromises);
    req.flash('success', 'Added Topics!');
    res.redirect('back');
};

exports.scrapeTopics = async (req,res, next) => {
    const category = await Category.findOne({ _id: req.params.id });
    req.body.topics = await scrapeTopics(category);
    next();
};

exports.scrapeCluesForAllTopics = async (req,res) => {
    const category = await Category.findOne({ _id: req.params.id });
    if (!category.topics) {
        req.flash('error', `Did not find any topics for ${category.name}. First populate the topics!`);
        res.redirect(`back`);
    }

    let cluePromises = [];
    category.topics.forEach( (topic) => cluePromises.push(scrapeClues(topic)) );
    const results = await Promise.all(cluePromises);
    
    // save results to topics
    let topicPromises = [];
    category.topics.forEach( (topic, i) => topicPromises.push(addCluesToTopic(topic, results[i])) );
   
    await Promise.all(topicPromises);
    
    req.flash('success', 'Added Clues!');
    res.redirect('back');
};
