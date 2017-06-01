import axios from 'axios';
import dompurify from 'dompurify'; // to clean html JS and prevent attacks

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join('');
}

function typeAhead(search) {
    if (!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function() {
        if (!this.value) {
            searchResults.style.display = 'none';
            return;
        }

        // show search results
        searchResults.style.display = 'block';
        searchResults.innerHTML = '';

        axios
        .get(`/api/v1/search?q=${this.value}`)
        .then(res => {
            if (res.data.length) {
                // show results
                searchResults.innerHTML = dompurify.sanitize(
                    searchResultsHTML(res.data)
                );
                return;
            }

            // tell that no results came back
            searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for <strong>${this.value}</strong> found!</div>`);
        })
        .catch(err => {
            console.error(err);
        });
    });

    // handle keyboard error
    searchInput.on('keyup', (e) => {
        // skip verything not up, down or enter
        if (![38,40,13].includes(e.keyCode)) {
            return;
        }

        const activeClass = 'search__result--active';
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        let next;
        if (e.keyCode === 40 && current) {
            // down
            next = current.nextElementSibling || items[0];
        } else if (e.keyCode === 40) {
            // down
            next = items[0];
        } else if (e.keyCode === 38 && current) {
            // up
            next = current.previousElementSibling || items[items.length - 1];
        } else if (e.keyCode === 38) {
            // up
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            // enter
            window.location = current.href;
            return;
        }

        // remove active class from old selection / add active class to new selection
        if (current) {
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass);
    })
}

export default typeAhead;
