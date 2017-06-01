function autocomplete(input, latInput, lngInput) {
    console.log(input, latInput, lngInput);
    if(!input) return; // skip if no input on page

    const dropdown = new google.maps.places.Autocomplete(input);

    dropdown.addListener('place_changed', () =>{
        const place = dropdown.getPlace();
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    });

    // don't submit form if someone hits the enter key
    input.on('keydown', (e) => {
        if (e.keycode === 13) e.preventDefault();
    });
}

export default autocomplete;
