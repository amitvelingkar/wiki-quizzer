const mongoose = require('mongoose');
const Topic = mongoose.model('Topic');

exports.getCategories = async (req, res) => {
    // 1. Query the db for list of all stores
    const topics = await Topic.find().sort({ name: 'desc' });
    res.render('topics', { title: 'Topics', topics });
};

exports.addTopic = (req, res) => {
    res.render('editTopic', { title: 'Add Topic' });
};

exports.createTopic = async (req, res) => {
    const topic = await (new Topic(req.body)).save();
    req.flash('success',`Sucessfully created <Strong>${topic.name}</Strong>. Go ahead and populate topics!`);
    res.redirect(`/categories`);
};
