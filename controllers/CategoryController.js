const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const Topic = mongoose.model('Topic');
const {scrapeTopics, scrapeClues, addCluesToTopic} = require('../handlers/wikiscraper');

exports.getCategories = async (req, res) => {
    // 1. Query the db for list of all stores
    const categories = await Category.find({}, {name:1, slug:1, wikiUrl: 1}).populate('topics', { _id:1 }).sort({ name: 'desc' });
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
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return;

    req.body.category = category;
    next();
}

exports.getCategoryByID = async (req, res, next) => {
    // 1. find the store given the id
    const category = await Category.findOne({ _id: req.params.id });
    if (!category) return;

    req.body.category = category;
    next();
}

exports.getCategoryTopics = async (req, res, next) => {
    // 1. find all the topics that match the category id
    const category = req.body.category;
    const topics = await Topic.aggregate(
        [{
            $match: {
                category: category._id
            }
        },
        {
            $project: { 
                name: 1,
                wikiUrl: 1,
                slug: 1,
                clueCount: { $size: "$clues" }
            }
        }]
    );

    // 2. render the page to view the category
    res.render('category', { title: `${category.name}`, category, topics });
};

exports.createTopics = async(req,res) => {
    //res.json(req.body);
    let topicPromises = [];
    for (topic of req.body.topics) {
        const existingTopic = await Topic.findOne({ wikiUrl: topic.wikiUrl });
        // only add if topic does not exist
        // TODO - do we need to update some properties?
        if (!existingTopic) {
            const topicPromise = (new Topic({name: topic.name, wikiUrl: topic.wikiUrl, category: topic.category})).save();
            topicPromises.push(topicPromise);
        }
    }

    // wait till all saves are done
    await Promise.all(topicPromises);
    req.flash('success', `${req.body.topics.length} Topics were found. ${topicPromises.length} were unique and added!`);
    res.redirect('back');
};

exports.scrapeTopics = async (req,res, next) => {
    const category = await Category.findOne({ _id: req.params.id });
    req.body.topics = await scrapeTopics(category);
    next();
};

exports.scrapeCluesForAllTopics = async (req,res) => {
    const topics = await Topic.find({ category: req.params.id });
    if (!topics) {
        req.flash('error', `Did not find any topics. First populate the topics!`);
        res.redirect(`back`);
    }

    let cluePromises = [];
    topics.forEach( (topic) => cluePromises.push(scrapeClues(topic)) );
    const results = await Promise.all(cluePromises);
    
    // save results to topics
    let topicPromises = [];
    topics.forEach( (topic, i) => topicPromises.push(addCluesToTopic(topic, results[i])) );
   
    await Promise.all(topicPromises);
    
    req.flash('success', 'Added Clues!');
    res.redirect('back');
};
