import axios from 'axios';
import { $ } from './bling';

function ajaxAddTopic(e) {
    e.preventDefault();
    this.display = 'none';
    axios
    .post(this.action, {
        name: this.name.value,
        wikiUrl: this.wikiUrl.value
    })
    .then(res => {
        const isAdded = this.add.classList.toggle('add__button--added');
        // $('.heart-count').textContent = res.data.hearts.length;
        this.display = 'block';
    })
    .catch(console.error);

}

export default ajaxAddTopic;
