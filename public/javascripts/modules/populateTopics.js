import axios from 'axios';
import { $ } from './bling';

function populateTopics(topicsForm, topicsDiv) {
    topicsForm.on('submit', function(e) {
        e.preventDefault();
        topicsDiv.innerText = "Fetching Topics...";
        axios
        .get(this.action)
        .then(res => {
            topicsDiv.innerText = res.data.length;
        })
        .catch(console.error);
    });        
}

export default populateTopics;