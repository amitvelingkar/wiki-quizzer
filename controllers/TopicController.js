const mongoose = require('mongoose');
const Topic = mongoose.model('Topic');
const osmosis = require('osmosis');

exports.addTopic = async (req, res) => {
    req.body.topic = req.params.id;
    
    // TODO - do not create if already exists
    const newTopic = new Topic(req.body);
    const topic = await newTopic.save();

    res.json(topic);
    /*
    req.flash('sucess', 'Topic Saved');
    res.redirect('back');
    */
};

exports.getTopicBySlug = async (req, res, next) => {
    // 1. find the store given the id
    const topic = await Topic.findOne({ slug: req.params.slug });
    if (!topic) return next();

    // 2. render the page to view the topic
    res.render('topic', { title: `${topic.name}`, topic });
};

// a quick and directy function to score each clue
// Points for - 
// appeaing early in the article
// contains topic name  
// length of sentence - medium sized
// normalized - 0 to 1
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

exports.createClues = async (req,res) => {
    //const topic = await Topic.findOne({ slug: req.params.slug });
    const results = req.body.clues;
    const topicName = req.body.topic;

    // add score for each clue and choose top 30
    const clues = results.map((clue, index) => ({
        text: clue, 
        score: scoreClue(topicName, clue, index, results.length),
        index: index,
        docLen: results.length,
        topic: topicName
    }));

    // add top scoring 30 clues to the topic
    const topic = await Topic.findByIdAndUpdate(req.params.id,
        { $push: {
            clues: { 
                $each: clues,
                $sort: { score: -1 },
                $slice: 30
            }
        } }, // will erase previous values
        { new: true }
    );
    res.redirect('back');
};

exports.populateClues = async (req,res,next) => {
    // find the topic and remove the old clues
    const topic = await Topic.findByIdAndUpdate(req.params.id,
        { clues: [] }
    ).exec();

    console.log(topic);

    let results = [];
    const baseUrl = 'https://en.wikipedia.org/';
    const limit = ':lt(10)'; //increase limit to 10 paragraphs

    osmosis
    .get(topic.wikiUrl)
    .find('p'+limit) 
    .set('text')
    .data(function(result) {
        // remove anything in brackets ( and )
        result.text = result.text.replace(/ *\([^)]*\) */g, ' ');
        // remove anything in brackets [ and ]
        result.text = result.text.replace(/ *\[[^\]]*]/g, ' ');
        // split sentences but be smart about decimal points
        const clues = result.text
            .trim()
            .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
            .split("|")
            .filter(clue => clue.length > 12);
        results = results.concat(clues);
    }).done( function() {
        if (!results) {
            req.flash('error', `Did not find any topics for ${category.name}. Check your url and selector!`);
            res.redirect(`back`);
        }
        req.body.topic = topic.name;
        req.body.clues = results;
        next();
    });
};
