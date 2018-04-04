'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Common database helper functions.
 */
var DBHelper = function () {
  function DBHelper(domain, port) {
    _classCallCheck(this, DBHelper);

    // The 'cache' of the restaurants json result
    this.data = '';
    this.domain = domain || '127.0.0.1';
    this.port = port || 8887;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */


  _createClass(DBHelper, [{
    key: 'fetchRestaurants',


    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants(callback) {
      var _this = this;

      if (this.data) {
        callback(null, this.data.restaurants);
        return;
      }

      //This is to avoid multiple requests for the restaurant.json
      if (this.xhr && this.xhr.readyState === 1) {
        var originalCallback = this.xhr.onload;

        /** The original onload callback is stored, I change it by a new one which calls the callback passed as an argument and the original callback
         * Example
         * Request 1 onload: function() { fetchRestaurantById() };
         * Request 2 onload: function(){ request1Callback(); fetchRestaurantByCuisine(); }
         */
        this.xhr.onload = function () {
          originalCallback();
          _this.fetchRestaurantsOnLoad(callback, _this.xhr);
        };
        return;
      }

      this.xhr = new XMLHttpRequest();
      this.xhr.open('GET', this.DATABASE_URL, true);
      this.xhr.onload = function () {
        _this.fetchRestaurantsOnLoad(callback, _this.xhr);
      };
      this.xhr.send();
    }
  }, {
    key: 'fetchRestaurantsOnLoad',
    value: function fetchRestaurantsOnLoad(callback, xhr) {
      if (xhr.status === 200) {
        // Got a success response from server!
        this.data = JSON.parse(xhr.responseText);
        var restaurants = this.data.restaurants;
        callback(null, restaurants);
      } else {
        // Oops!. Got an error from server.
        var error = 'Request failed. Returned status of ' + xhr.status;
        callback(error, null);
      }
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      this.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var restaurant = restaurants.filter(function (r) {
            return r.id == id;
          });
          if (restaurant && restaurant.length > 0) {
            // Got the restaurant
            callback(null, restaurant[0]);
          } else {
            // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      this.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      this.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      this.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;
          if (cuisine != 'all') {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != 'all') {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      this.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      this.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant, size) {
      var sizesSuffixes = {
        'large': '1600_large',
        'medium': '800_medium',
        'small': '350_small'
      };

      return '/img/' + restaurant.id + '-' + sizesSuffixes[size] + '.jpg';
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant, map) {
      var marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: this.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP });
      return marker;
    }
  }, {
    key: 'DATABASE_URL',
    get: function get() {
      return 'http://' + this.domain + (this.port ? ':' + this.port : '') + '/data/restaurants.json';
    }
  }]);

  return DBHelper;
}();
//# sourceMappingURL=dbhelper.js.map
