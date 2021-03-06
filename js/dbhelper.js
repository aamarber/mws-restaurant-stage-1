/**
 * Common database helper functions.
 */
class DBHelper {
  constructor(domain, port, protocol) {
    this.fetchOnGoing = null;
    this.domain = domain || '127.0.0.1';
    this.port = port || 8887;
    this.protocol = protocol || 'http';

    this.dbPromise = idb.open('restaurants-store', 2, upgradeDB => {
      upgradeDB.createObjectStore('restaurants');

      const reviewsStore = upgradeDB.createObjectStore('restaurantReviews');
      reviewsStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      const deferredReviewsStore = upgradeDB.createObjectStore('deferredReviews');
      deferredReviewsStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      upgradeDB.createObjectStore('deferredFavorites');
    });
  }

  get restaurants() {
    if (this._restaurants) {
      return Promise.resolve(this._restaurants);
    }

    return this.dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').getAll().then(
        restaurants => {
          if (!restaurants || restaurants.length <= 0) {
            return Promise.reject();
          }

          this._restaurants = restaurants;

          return this._restaurants;
        });
    });
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
  fetchRestaurants() {
    return this.restaurants.then(
      restaurants => {
        return restaurants;
      },
      error => {
        if (this.fetchOnGoing) {
          //To avoid making twice the restaurants request without passing through the cache
          return this.fetchOnGoing.then(() => {
            return this.fetchRestaurants();
          });
        }

        this.fetchOnGoing = fetch(this.restaurantsListUrl).then(result => {
          if (result.status === 200) {
            return result.json().then(restaurants => {
              this.restaurants = restaurants;
              return restaurants;
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
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return this.fetchRestaurants().then(
      restaurants => {
        if (cuisine === 'all' && neighborhood === 'all') {
          return this.restaurants;
        }

        if (cuisine != 'all') { // filter by cuisine
          return restaurants.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          return restaurants.filter(r => r.neighborhood == neighborhood);
        }
        return restaurants;
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods(existingRestaurants) {
    const getNeighborhoods = (restaurants) => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
      // Remove duplicates from neighborhoods
      return neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    }

    if (existingRestaurants) {
      return Promise.resolve(getNeighborhoods(existingRestaurants));
    }

    // Fetch all restaurants
    return this.fetchRestaurants().then(
      restaurants => {
        return getNeighborhoods(restaurants);
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines(existingRestaurants) {
    const getCuisines = (restaurants) => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
      // Remove duplicates from cuisines
      return cuisines.filter((v, i) => cuisines.indexOf(v) == i)
    }

    if (existingRestaurants) {
      return Promise.resolve(getCuisines(existingRestaurants));
    }

    // Fetch all restaurants
    return this.fetchRestaurants().then(
      restaurants => {
        return getCuisines(restaurants);
      });
  }

  /**
   * Returns the restaurant reviews from IDB, even if they have been deferred because there's no connection
   * @param {Number} restaurantId 
   */
  getRestaurantReviews(restaurantId) {
    return this.dbPromise.then(db => {
      return db.transaction('restaurantReviews').objectStore('restaurantReviews').index('restaurant_id').getAll(restaurantId).then(reviews => {

        return this.getDeferredRestaurantRevies(restaurantId, db).then(deferredReviews => {

          reviews = reviews.concat(deferredReviews);

          if (!reviews || reviews.length <= 0) {
            return Promise.reject();
          }

          return reviews;
        });
      });
    });
  }

  getDeferredRestaurantRevies(restaurantId, db) {
    if (!db) {
      return this.dbPromise.then(db => {
        return db.transaction('deferredReviews').objectStore('deferredReviews').index('restaurant_id').getAll(restaurantId);
      });
    }

    return db.transaction('deferredReviews').objectStore('deferredReviews').index('restaurant_id').getAll(restaurantId);
  }

  setRestaurantReviews(restaurantId, reviews) {
    this._restaurantReviews = this._restaurantReviews || {};

    return this.dbPromise.then(db => {
      const transaction = db.transaction('restaurantReviews', 'readwrite');

      reviews.forEach(review => {
        transaction.objectStore('restaurantReviews').put(review, review.id);
      })


      return transaction.complete.then(() => {
        this._restaurantReviews[restaurantId] = reviews;

        return Promise.resolve(this._restaurantReviews[restaurantId]);
      });
    });
  }

  /**
   * Fetch a restaurant reviews by the restaurant ID.
   * @param {number} id 
   * @param {function} callback 
   */
  fetchReviews(restaurantId) {
    return this.getRestaurantReviews(restaurantId).then(
      reviews => {
        return reviews
      },
      error => {
        return fetch(this.urlForRestaurantReviews(restaurantId)).then(result => {
          if (result.status === 200) {
            return result.json().then(reviews => {
              return this.setRestaurantReviews(restaurantId, reviews);
            });
          }
          else {
            Promise.reject(error);
          }
        });
      });

  }

  /**
   * Sends a review to be saved
   * @param {*} review 
   */
  postReview(review) {
    if (!isOnline()) {
      return this.deferReview(review).then(() => {
        return Promise.reject('OFFLINE');
      })
    }

    return fetch(this.urlForPostRestaurantReviews(), {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    }).then(response => {
      return response.json().then(review => {
        return this.appendReview(review);
      });

    });
  }

  appendReview(review) {
    return this.getRestaurantReviews(review.restaurant_id).then(updatedReviews => {
      updatedReviews.push(review);

      return this.setRestaurantReviews(review.restaurant_id, updatedReviews);
    })
  }

  deferReview(review) {
    return this.dbPromise.then(db => {
      const transaction = db.transaction('deferredReviews', 'readwrite');

      review.id = Date.now();

      transaction.objectStore('deferredReviews').put(review, review.id);

      return transaction.complete;
    });
  }

  deleteDeferredReview(reviewId) {
    return this.dbPromise.then(db => {
      const transaction = db.transaction('deferredReviews', 'readwrite');

      transaction.objectStore('deferredReviews').delete(reviewId);

      return transaction.complete;
    });
  }

  deferFavorite(restaurantId, isFavorite) {
    return this.dbPromise.then(db => {
      const transaction = db.transaction('deferredFavorites', 'readwrite');

      const favorite = { restaurantId: restaurantId, isFavorite: isFavorite };

      transaction.objectStore('deferredFavorites').put(favorite, favorite.restaurantId);

      return transaction.complete;
    });
  }

  deleteDeferredFavorite(restaurantId) {
    return this.dbPromise.then(db => {
      const transaction = db.transaction('deferredFavorites', 'readwrite');

      transaction.objectStore('deferredFavorites').delete(restaurantId);

      return transaction.complete;
    });
  }

  getDeferredFavorites() {
    return this.dbPromise.then(db => {
      const transaction = db.transaction('deferredFavorites', 'readwrite');

      return transaction.objectStore('deferredFavorites').getAll();
    });
  }

  setRestaurantFavorite(restaurantId, isFavorite) {
    if (!isOnline()) {
      return this.deferFavorite(restaurantId, isFavorite).then(() => {
        return this.updateRestaurantFavorite(restaurantId, isFavorite);
      });
    }

    return fetch(this.urlForMarkRestaurantFavorite(restaurantId, isFavorite), {
      method: "PUT",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.json().then(review => {
        return this.updateRestaurantFavorite(restaurantId, isFavorite);
      });

    });
  }

  updateRestaurantFavorite(restaurantId, isFavorite) {
    return this.fetchRestaurants().then(restaurants => {
      var restaurant = restaurants.find(x => x.id === restaurantId);

      restaurant.is_favorite = isFavorite;

      this.restaurants = restaurants;

      return restaurant;
    });
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

  /**
  * The url to get the list of restaurants
  */
  get restaurantsListUrl() {
    return `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}/restaurants`;
  }

  /**
   * The url to get the detail of a restaurant
   * @param {number} restaurantId 
   */
  restaurantsDetailUrl(restaurantId) {
    return `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}/restaurants/${restaurantId}`;
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
  * Restaurant reviews URL.
  */
  urlForRestaurantReviews(restaurantId) {
    return `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}/reviews/?restaurant_id=${restaurantId}`;
  }

  /**
  * Restaurant reviews POST URL.
  */
  urlForPostRestaurantReviews() {
    return `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}/reviews/`;
  }

  /**
  * Restaurant reviews POST URL.
  */
  urlForMarkRestaurantFavorite(restaurantId, isFavorite) {
    return `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}/restaurants/${restaurantId}?is_favorite=${isFavorite}`;
  }

}
