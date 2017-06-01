const mongoose = require('mongoose');
mongoose.Promise - global.Promise;

const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name : {
        type: String,
        trim: true,
        required: 'Please enter a store name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply location coordinates'
        }],
        address: {
            type: String,
            required: 'You must supply an address'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'you must always supply an author'
    }
},
{
    toJSON: { virtuals: true },
    toObject: { vistuals: true }
});

// find reviews where store._id property === review.store property
storeSchema.virtual('reviews', {
    ref: 'Review', // model to link
    localField: '_id', // which field on the store to match a review
    foreignField: 'store' // which field on the review to match the store
});

// setup indexes so that search can work faster
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({ location: '2dsphere'});


storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;

    }

    this.slug = slug(this.name);

    // make slug unique
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`,'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }


    next();
});

storeSchema.statics.getTagsList = function() {
    // https://docs.mongodb.com/manual/meta/aggregation-quick-reference/
    return this.aggregate([
        { $unwind: '$tags'},
        { $group: { _id: '$tags', count: { $sum: 1 } }},
        { $sort: {count: -1 } }
    ]);
};

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // lookup stores and populate their reviews
        // note - mongodb takes model name and puts an 's' at the end - 'Review' => 'reviews'
        { $lookup:
            {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        // filter only for staores that have 2 or more reviews
        { $match: { 'reviews.1': { $exists: true } }},
        // add the average reviews field
        { $project: {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            slug: '$$ROOT.slug',
            reviews: '$$ROOT.reviews',
            averageRating: {$avg: '$reviews.rating'}
        }},
        // sort it by our new average field, hieghest review fields
        { $sort: { averageRating: -1 }},
        // limit to at most 10 stores
        { $limit: 10 }
    ]);
};

function autoPopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);
