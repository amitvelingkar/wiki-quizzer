const mongoose = require('mongoose');
const Topic = mongoose.model('Topic');
var Xray = require('x-ray');

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
    
    if (index < 10) {
        console.log(topic,clue,index,total,positionScore,topicScore,lenScore);
    }
    
    return (positionScore * topicScore * lenScore);
}

exports.populateClues = async (req,res) => {
    const topic = await Topic.findOne({ slug: req.params.slug });

    // TDOD - if you remove bold you will get everything
    // solution is to filter for each row if needed
    // let us see if we need this.
    // res.json(topic);
    
    var x = Xray({
        filters: {
            removeBracket1: function (value) {
                return typeof value === 'string' ? value.replace(/ *\([^)]*\) */g, ' ') : value
            },
            removeBracket2: function (value) {
                return typeof value === 'string' ? value.replace(/ *\[[^\]]*]/g, ' ') : value
            }
        }
    });
    x(topic.wikiUrl, 'p', [{
        text: ' | removeBracket1 | removeBracket2'
    }]).limit(10)(function(err, results) {
        if (err) {
            console.log("xray error");
            console.log(err);
            return;
        }
        
        // split paragraphs in senetnces
        const clueArrays = results.map((clue) => {
            // return clue.text.trim().split('.');
            return clue.text.trim().replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
        });
        // flatten array of arrays in a single array, remove any sentence with less than 12 characters
        let clues = [].concat.apply([], clueArrays).filter(clue => clue.length > 12);
        clues = clues.map((clue, index) => (
            { text: clue, score: scoreClue(topic.name, clue, index, clues.length) }
        )).sort((a,b) => b.score - a.score);
        
        //console.log(results);
        res.render('populateClues', { title: `Populating ${topic.name}`, topic: topic, clues: clues } );
    });
};
