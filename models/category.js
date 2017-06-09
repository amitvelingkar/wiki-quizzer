const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');
const validator = require('validator');

const categorySchema = new mongoose.Schema({
    name : {
        type: String,
        trim: true,
        required: 'Please enter a category name'
    },
    slug: String,
    created: {
        type: Date,
        default: Date.now
    },
    wikiUrl: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isURL, 'Invalid URL address'],
        required: 'Please supply a wiki URL'
    },
    selector : {
        type: String,
        trim: true
    }
},
{
    toJSON: { virtuals: true },
    toObject: { vistuals: true }
});

// find topics where topic._id property === topic.category property
categorySchema.virtual('topics', {
    ref: 'Topic', // model to link
    localField: '_id',
    foreignField: 'category'
});

categorySchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;

    }

    this.slug = slug(this.name);

    // make slug unique
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`,'i');
    const categoriesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (categoriesWithSlug.length) {
        this.slug = `${this.slug}-${categoriesWithSlug.length + 1}`;
    }


    next();
});

function autoPopulate(next) {
    this.populate('topics');
    next();
}

categorySchema.pre('find', autoPopulate);
categorySchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Category', categorySchema);
