/*eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaXZhbnljc3VuZyIsImEiOiJjbGo1aGRra3kwYW12M2dtbWJ2ZHRmOHIzIn0.sOZWh1VkJpMvTyrZNf2gyQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ivanycsung/clj5hpe5r000y01pz9z03e3xy',
    scrollZoom: false,
    // center: [-118113491, 34.111745],
    // zoom: 10,
    // interative: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
