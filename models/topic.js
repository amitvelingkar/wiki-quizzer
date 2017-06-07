const mongoose = require('mongoose');
mongoose.Promise - global.Promise;

const slug = require('slugs');
const validator = require('validator');

const clueSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true
    },
    score: {
        type: Number
    },
    index: {
        type: Number
    },
    docLen: {
        type: Number
    },
    topic: {
        type: String,
        trim: true
    },
    visible: {
        type: Boolean,
        default: true
    }
});

const topicSchema = new mongoose.Schema({
    name : {
        type: String,
        trim: true,
        required: 'Please enter a topic name'
    },
    slug: String,
    created: {
        type: Date,
        default: Date.now
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: 'You must supply a category'
    },
    wikiUrl: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isURL, 'Invalid URL address'],
        required: 'Please supply a wiki URL'
    },
    clues: [clueSchema]
});

topicSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;

    }

    this.slug = slug(this.name);

    // make slug unique
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`,'i');
    const topicsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (topicsWithSlug.length) {
        this.slug = `${this.slug}-${topicsWithSlug.length + 1}`;
    }


    next();
});

module.exports = mongoose.model('Topic', topicSchema);
