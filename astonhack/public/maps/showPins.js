// showPins.js
// Bu dosya, veritabanındaki koordinatları map.html'deki haritaya konum emojisi olarak ekler.

import { getLocations } from './lostLocationsFirebase.js';

export function showPins(map) {
    const locations = getLocations();
    locations.forEach(loc => {
        L.marker([loc.lat, loc.lng]).addTo(map);
    });
}
