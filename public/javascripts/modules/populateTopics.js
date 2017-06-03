import axios from 'axios';
import { $ } from './bling';

function populateTopics(topicsForm, topicsDiv) {
    if (!topicsForm) return;

    topicsForm.on('submit', function(e) {
        e.preventDefault();
        axios
        .get(this.action)
        .then(res => {
            const topics = res.data.topics;
            const html = topics.map((topic) => {
                return `
                <div class="topic">
                    <form action="/category/${res.data.categoryId}/topic/add/" method="POST">
                        <div class="topic__content">
                            <input type="text" name="name" value="${topic.text}">
                            <input type="url" class="topic__content--url" name="wikiUrl" value="${topic.url}">
                        </div>
                        <div class="topic__action">
                            <input class="topic__action--add" type="submit" value="Save">
                        </div>
                    </form>
                </div>`;
            }).join('');
            
            topicsDiv.innerHTML = html;
        })
        .catch(console.error);
    });        
}

export default populateTopics;