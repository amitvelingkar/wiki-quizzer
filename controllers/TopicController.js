const mongoose = require('mongoose');
const Topic = mongoose.model('Topic');

exports.addTopic = async (req, res) => {
    req.body.category = req.params.id;
    
    // TODO - do not create if already exists
    const newTopic = new Topic(req.body);
    await newTopic.save();

    req.flash('sucess', 'Topic Saved');
    res.redirect('back');
};