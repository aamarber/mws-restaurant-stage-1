/**
 * Common database helper functions.
 */
class DBHelper {
  constructor(domain, port) {
    this.fetchOnGoing = null;
    this.domain = domain || '127.0.0.1';
    this.port = port || 8887;

    this.dbPromise = idb.open('restaurants-store', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaurants');
    });
  }

  /**
   * The url to get the list of restaurants
   */
  get restaurantsListUrl() {
    return `http://${this.domain}${this.port ? `:${this.port}` : ''}/restaurants`;
  }

  /**
   * The url to get the detail of a restaurant
   * @param {number} restaurantId 
   */
  restaurantsDetailUrl(restaurantId) {
    return `http://${this.domain}${this.port ? `:${this.port}` : ''}/restaurants/${restaurantId}`;
  }

  get restaurants() {
    return this.dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').getAll();
    });

    return this._restaurants;
  }

  set restaurants(restaurants) {
    this.dbPromise.then(db => {
      const transaction = db.transaction('restaurants', 'readwrite');

      restaurants.forEach(restaurant => {
        transaction.objectStore('restaurants').put(restaurant, restaurant.id);
      })

      return transaction.complete;
    });

    this._restaurants = restaurants;
  }

  getRestaurant(id) {
    return this.dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').get(Number(id));
    });
  }

  set restaurant(restaurant) {
    this._restaurant = restaurant;
  }

  /**
   * Fetch all restaurants.
   */
  fetchRestaurants(callback) {
    return this.restaurants.then(
      restaurants => {
        return restaurants;
      },
      error => {
        if (this.fetchOnGoing) {
          //To avoid making twice the restaurants request without passing through the cache
          return this.fetchOnGoing.then(() => {
            return this.fetchRestaurants(callback);
          });
        }

        this.fetchOnGoing = fetch(this.restaurantsListUrl).then(result => {
          if (result.status === 200) {
            return result.json().then(restaurants => {
              return Promise.resolve(restaurants);
              //callback(null, restaurants);
            });
          } else { // Oops!. Got an error from server.
            const error = (`Request failed. Returned status of ${result.status}`);
            return Promise.reject(error);
          }
        });

        return this.fetchOnGoing;
      }
    );
  }

  /**
   * Fetch a restaurant by its ID.
   * @param {number} id 
   * @param {function} callback 
   */
  fetchRestaurantById(id, callback) {
    return this.getRestaurant(id).then(
      restaurant => {
        if (restaurant) {
          return restaurant;
        }
        return fetch(this.restaurantsDetailUrl(id)).then(result => {
          if (result.status === 200) {
            return result.json();
          }
          else {
            Promise.reject(error);
          }
        });
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants().then(
      restaurants => {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      },
      error => {
        callback(error, null);
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants().then(
      restaurants => {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      },
      error => {
        callback(error, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants().then(
      restaurants => {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      },
      error => {
        callback(error, null);
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants().then(
      restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      },
      error => {
        callback(error, null);
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants().then(
      restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      },
      error => {
        callback(error, null);
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
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

}
