/**
 * Common database helper functions.
 */
class DBHelper {
  constructor(){
    // The 'cache' of the restaurants json result
    this.data = '';
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  get DATABASE_URL() {
    const port = 8887 // Change this to your server port
    return `http://127.0.0.1:${port}/data/restaurants.json`;
  }

  
  
  /**
   * Fetch all restaurants.
   */
  fetchRestaurants(callback) {
    if(this.data){
      callback(null, this.data.restaurants);
      return;
    }

    //This is to avoid multiple requests for the restaurant.json
    if(this.xhr && this.xhr.readyState === 1){
      const originalCallback = this.xhr.onload;

      /** The original onload callback is stored, I change it by a new one which calls the callback passed as an argument and the original callback
       * Example
       * Request 1 onload: function() { fetchRestaurantById() };
       * Request 2 onload: function(){ request1Callback(); fetchRestaurantByCuisine(); }
       */
      this.xhr.onload = () => {
        originalCallback();
        this.fetchRestaurantsOnLoad(callback, this.xhr);
      };
      return;
    }

    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', this.DATABASE_URL, true);
    this.xhr.onload = () => {
      this.fetchRestaurantsOnLoad(callback, this.xhr);
    };
    this.xhr.send();
  }

  fetchRestaurantsOnLoad(callback, xhr){
    if (xhr.status === 200) { // Got a success response from server!
      this.data = JSON.parse(xhr.responseText);
      const restaurants = this.data.restaurants;
      callback(null, restaurants);
    } else { // Oops!. Got an error from server.
      const error = (`Request failed. Returned status of ${xhr.status}`);
      callback(error, null);
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.filter(r => r.id == id);
        if (restaurant && restaurant.length > 0) { // Got the restaurant
          callback(null, restaurant[0]);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant(restaurant, size) {
    var sizesSuffixes = {
      'large': '1600_large',
      'medium': '800_medium',
      'small': '350_small',
    }

    return (`/img/${restaurant.id}-${sizesSuffixes[size]}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: this.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
