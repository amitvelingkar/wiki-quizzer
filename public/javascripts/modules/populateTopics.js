import axios from 'axios';
import { $ } from './bling';
//import templateHandlers from '../../../handlers/templateHandlers';

function populateTopics(topicsForm, topicsDiv) {
    if (!topicsForm) return;

    topicsForm.on('submit', function(e) {
        e.preventDefault();
        const baseUrl = 'https://en.wikipedia.org';
        axios
        .get(this.action)
        .then(res => {
            const topics = res.data;
            const html = topics.map((topic) => {
                topic.url = topic.url.startsWith("http") ? topic.url : (baseUrl + topic.url);
                return `<div class="topic">
                    <div class="topic__body">
                        <div>${topic.text}</div>
                        <p>${topic.url}</p>
                    </div>
                </div>`;
            }).join('');
            
            topicsDiv.innerHTML = html;
        })
        .catch(console.error);
    });        
}

export default populateTopics;