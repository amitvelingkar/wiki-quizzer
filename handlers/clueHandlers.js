const osmosis = require('osmosis');

const scoreClue = (topic, clue, index, total) => {
    // Position - needs to decay 1, 0.99, 0.95, 0.8, etc.
    const positionScore = (Math.exp((total-index) / total) / Math.E);

    // topic name - needs a penalty
    const topicScore = (clue.toLowerCase().includes(clue.toLowerCase()) ? 1 : 0.25);

    // see length of sentence 0.5, 0.6 .... 1 ... 0.6, 0.5
    const optimalLen =80, multiplier=6, maxLen=190; 
    const lenScore = Math.sin(Math.PI / (multiplier * (Math.abs(optimalLen - Math.min(maxLen, clue.length)) / optimalLen) + 2));

    return (positionScore * topicScore * lenScore);
};

exports.scrapeClues = (topic) => {
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
};

exports.addCluesToTopic = (topic, clues) => {
    // add score for each clue and choose top 30
    const scoredClues = clues.map((clue, index) => ({
        text: clue, 
        score: scoreClue(topic.name, clue, index, clues.length),
        index: index,
        docLen: clues.length,
        topic: topic.name
    }));

    // TODO - Sort by score and limit to top 30

    topic.clues = scoredClues;
    topic.updatedClues = Date.now();
    return topic.save(); // returns a promise
};