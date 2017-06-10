const mongoose = require('mongoose');
const Topic = mongoose.model('Topic');
const {scrapeClues, addCluesToTopic} = require('../handlers/wikiscraper');

exports.addTopic = async (req, res) => {
    req.body.topic = req.params.id;
    
    // TODO - do not create if already exists
    const newTopic = new Topic(req.body);
    const topic = await newTopic.save();

    req.flash('success', 'Topic Saved');
    res.redirect('back');
};

exports.getTopicBySlug = async (req, res) => {
    // 1. find the store given the id
    const topic = await Topic.findOne({ slug: req.params.slug });
    if (!topic) return;

    // 2. render the page to view the topic
    res.render('topic', { title: `${topic.name}`, topic });
};

exports.populateClues = async (req,res) => {
    const topic = await Topic.findOne({ _id: req.params.id });
    const results = await scrapeClues(topic);
    
    await addCluesToTopic(topic, results);
    
    req.flash('success', 'Added Clues!');
    res.redirect('back');
};
