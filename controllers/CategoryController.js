const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const Topic = mongoose.model('Topic');
const osmosis = require('osmosis');

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
    for (let i=0; i<req.body.topics.length; i++) {
        const topic = req.body.topics[i];
        const topicPromise = (new Topic({name: topic.name, wikiUrl: topic.wikiUrl, category: topic.category})).save();
        topicPromises.push(topicPromise);
    }

    // wait till all saves are done
    await Promise.all(topicPromises);
    res.redirect('back');
};

exports.scrapeTopics = async (req,res, next) => {
    const category = await Category.findOne({ _id: req.params.id });

    
    let results = [];
    const baseUrl = 'https://en.wikipedia.org';
    const testLimit = ':lt(4)'; //TODO - temporary - test limit

    osmosis
    .get(category.wikiUrl)
    .find((category.selector || '.wikitable td > b > a')+testLimit) 
    .set('name')
    .set({
        wikiUrl: '@href'
    }).data(function(result) {
        result.wikiUrl = result.wikiUrl.trim().toLowerCase().startsWith(baseUrl) ? result.wikiUrl : (baseUrl + result.wikiUrl);
        result.category = category._id;
        results.push(result);
    }).done( function() {
        if (!results) {
            req.flash('error', `Did not find any topics for ${category.name}. Check your url and selector!`);
            res.redirect(`back`);
        }
        req.body.topics = results;
        next();
    });
};

// a quick and directy function to score each clue
// Points for - 
// * appeaing early in the article
// * contains topic name  
// * length of sentence - medium sized
// Score range is from 0 to 1
function scoreClue(topic, clue, index, total) {
    // Position - needs to decay 1, 0.99, 0.95, 0.8, etc.
    const positionScore = (Math.exp((total-index) / total) / Math.E); 

    // topic name - needs a penalty
    const topicScore = (clue.toLowerCase().includes(clue.toLowerCase()) ? 1 : 0.25);

    // see length of sentence 0.5, 0.6 .... 1 ... 0.6, 0.5
    const optimalLen = 80;
    const multiplier = 6;
    const maxLen = 190; 
    const lenScore = Math.sin(Math.PI / (multiplier * (Math.abs(optimalLen - Math.min(maxLen, clue.length)) / optimalLen) + 2));

    return (positionScore * topicScore * lenScore);
}

function scrapeClues(topic) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        const limit = ':lt(10)';
        let results = [];
    
        osmosis
        .get(topic.wikiUrl)
        .find('p'+limit) 
        .set('text')
        .data(function(result) {
            // remove anything in brackets ( and )
            result.text = result.text.replace(/ *\([^)]*\)+ */g, ' ');
            // remove anything in brackets [ and ]
            result.text = result.text.replace(/ *\[[^\]]*\]+ */g, ' ');
            // split sentences but be smart about decimal points
            const clues = result.text
                .trim()
                .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
                .split("|")
                .filter(clue => clue.length > 12);
            results = results.concat(clues);
        }).done( function() {
            if (!results) {
                console.log(`Did not find any topics for ${topic.name}. Check your url and selector!`);
            }
            console.log(results);
            resolve(results);
        }).error( function(err) {
            reject(Error(`Error - Failed to get clues for ${topic.name}`));
        });
    });
}

exports.scrapeCluesForAllTopics = async (req,res) => {
    const limit = ':lt(10)';
    const category = await Category.findOne({ _id: req.params.id });

    if (!category.topics) {
        req.flash('error', `Did not find any topics for ${category.name}. First populate the topics!`);
        res.redirect(`back`);
    }

    let cluePromises = [];
    category.topics.forEach((topic) => {
        const cluePromise = scrapeClues(topic);
        cluePromises.push(cluePromise);
    });
    const results = await Promise.all(cluePromises);
    
    // save results to topics
    let topicPromises = [];
    category.topics.forEach((topic, i) => {
        // add score for each clue and choose top 30
        const clues = results[i].map((clue, index) => ({
            text: clue, 
            score: scoreClue(topic.name, clue, index, results[i].length),
            index: index,
            docLen: results[i].length,
            topic: topic.name
        }));

        topic.clues = clues;
        topic.updatedClues = Date.now();
        const topicPromise = topic.save();
        topicPromises.push(topicPromise);
    });
   
    await Promise.all(topicPromises);
    res.redirect('back');
};
