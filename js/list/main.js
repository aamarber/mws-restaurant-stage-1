const dbHelper = new DBHelper('localhost', 1337);

let restaurantsCached = null;

const imageSizes = {
  'medium': 999,
  'small': 649,
  'large': 0
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initRestaurants();
});

let initRestaurants = () => {
  updateRestaurants();

  fetchNeighborhoods();
  fetchCuisines();

  initServiceWorker();
}

let initLazyLoading = () => {
  let breakpoints = [];

  for (var size in imageSizes) {
    if (!imageSizes[size]) {
      continue;
    }

    breakpoints.push({
      width: imageSizes[size], // max-width
      src: `data-src-${size}`
    });
  }
  if (!Blazy) {
    window.setTimeout(() => {
      initLazyLoading();
    }, 100);
    return;
  }
  var bLazy = new Blazy({
    breakpoints: breakpoints
  });
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
let fetchNeighborhoods = (restaurants) => {
  dbHelper.fetchNeighborhoods(restaurants).then(
    neighborhoods => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    },
    error => {
      console.error(error);
    });
}

/**
 * Set neighborhoods HTML.
 */
let fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.appendChild(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
let fetchCuisines = (restaurants) => {
  return dbHelper.fetchCuisines(restaurants).then(
    cuisines => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    },
    error => {
      console.error(error);
    });
}

/**
 * Set cuisines HTML.
 */
let fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.appendChild(option);
  });
}

let initServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js');
  });
}


let toggleMap = () => {
  if (!mapIsEnabled()) {
    document.getElementById('map').style.display = 'block';
    initMap();
  }
  else { 
    document.getElementById('map').style.display = 'none';
  }
}

const mapIsEnabled = () => {
  return document.getElementById('map').style.display !== 'none';
}

/**
 * Initialize Google map, called from HTML.
 */
let initMap = () => {
  if(!mapIsEnabled()){
    return;
  }

  window.setTimeout(() => {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    addMarkersToMap();
  }, 100);
}

let getSelectedCuisine = () => {
  const cSelect = document.getElementById('cuisines-select');

  const cIndex = cSelect.selectedIndex;

  return cSelect[cIndex].value;
}

let getSelectedNeighborhood = () => {
  const nSelect = document.getElementById('neighborhoods-select');

  const nIndex = nSelect.selectedIndex;

  return nSelect[nIndex].value;
}

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = (firstLoad) => {
  const cuisine = getSelectedCuisine();

  const neighborhood = getSelectedNeighborhood();

  return dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(
    restaurants => {
      if (!firstLoad) {
        resetRestaurants(restaurants);
      }

      restaurantsCached = restaurants;

      fillRestaurantsHTML(restaurantsCached);

      return restaurantsCached;
    }, error => {
      // Got an error!
      console.error(error);
    });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurants) => {
  // Remove all restaurants
  const ul = document.getElementById('restaurants-list');
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  restaurantsCached = null;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
let fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.appendChild(createRestaurantHTML(restaurant));
  });

  initLazyLoading();

  if(mapIsEnabled()){
    initMap();
  }
}

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  appendRestaurantImage(restaurant, li);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.appendChild(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.appendChild(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.appendChild(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = dbHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View details of ${restaurant.name}`);
  li.appendChild(more)

  return li
}

let appendRestaurantImage = (restaurant, rootElement) => {
  const altText = `Image of restaurant ${restaurant.name}`;

  const restaurantImage = document.createElement('img');
  restaurantImage.className = 'restaurant-img b-lazy';
  restaurantImage.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');
  restaurantImage.setAttribute('alt', altText);

  for (var size in imageSizes) {
    restaurantImage.setAttribute(`data-src${imageSizes[size] ? `-${size}` : ''}`, dbHelper.imageUrlForRestaurant(restaurant, size));
  }

  rootElement.appendChild(restaurantImage);
}

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = () => {
  if (restaurantsCached) {
    addMarkersToMapWithRestaurants(restaurantsCached);
    return;
  }

  const cuisine = getSelectedCuisine();

  const neighborhood = getSelectedNeighborhood();

  dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(
    restaurants => {
      addMarkersToMapWithRestaurants(restaurants);
    },
    error => {
      console.error(error);
    });
}

let addMarkersToMapWithRestaurants = (restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = dbHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
  });
}
