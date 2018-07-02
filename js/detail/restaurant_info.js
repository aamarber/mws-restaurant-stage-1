let restaurant;
var map;


document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL().then(restaurant => {
    fillRestaurantHTML(restaurant);
    initLazyLoading();
  });

  fetchAndShowReviews();

  initServiceWorker();
});

let fetchAndShowReviews = () =>{
  fetchRestaurantReviewsFromURL().then(reviews => {
    fillReviewsHTML(reviews);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
let initMap = () => {
  fetchRestaurantFromURL().then(restaurant => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: restaurant.latlng,
      scrollwheel: false
    });
    fillBreadcrumb();
    dbHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  });
}

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL'
    return Promise.reject(error);
  }

  return dbHelper.fetchRestaurantById(id).then(
    restaurant => {
      self.restaurant = restaurant;

      return restaurant;
    },
    error => {
      if (!restaurant) {
        console.error(error);
        return error;
      }
    });
}

/**
 * Get current restaurant reviews from page URL.
 */
let fetchRestaurantReviewsFromURL = () => {

  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL'
    return Promise.reject(error);
  }

  return dbHelper.fetchReviews(Number(id)).then(
    reviews => {
      self.reviews = reviews;

      return reviews;
    },
    error => {
      if (!reviews) {
        console.error(error);
        return error;
      }
    });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
let fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  const mapToggler = document.getElementById('mapToggler');

  const restaurantName = document.createElement('span');
  restaurantName.innerText = restaurant.name;

  name.insertBefore(restaurantName, mapToggler);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  fillRestaurantPicture(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

let fillRestaurantPicture = (restaurant) => {
  const picture = document.getElementById('restaurant-img');
  picture.className = 'restaurant-img'
  const altText = `Image of restaurant ${restaurant.name}`;
  const image_large = document.createElement('source');
  image_large.setAttribute('media', '(min-width: 1000px)');
  image_large.setAttribute('srcset', dbHelper.imageUrlForRestaurant(restaurant, 'large'));
  image_large.setAttribute('alt', altText);

  const image_medium = document.createElement('source');
  image_medium.setAttribute('media', '(min-width: 650px)');
  image_medium.setAttribute('srcset', dbHelper.imageUrlForRestaurant(restaurant, 'medium'));
  image_medium.setAttribute('alt', altText);

  const image = document.createElement('img');
  image.setAttribute('srcset', dbHelper.imageUrlForRestaurant(restaurant, 'small'));
  image.setAttribute('src', dbHelper.imageUrlForRestaurant(restaurant, 'small'));
  image.setAttribute('alt', altText);

  picture.appendChild(image_large);
  picture.appendChild(image_medium);
  picture.appendChild(image);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.className = 'restaurant-day';
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.className = 'restaurant-time';
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
let fillReviewsHTML = (reviews) => {
  fillReviewStars(reviews);

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const reviewsList = document.createElement('ul');
  reviewsList.className = 'reviews-list';

  reviews.forEach(review => {
    reviewsList.appendChild(createReviewHTML(review));
  });
  container.appendChild(reviewsList);
}

/**
 * Create review HTML and add it to the webpage.
 */
let createReviewHTML = (review) => {

  const li = document.createElement('li');
  li.className = 'review';

  const reviewArticle = document.createElement('article');

  li.appendChild(reviewArticle);

  const reviewHeader = document.createElement('div');
  reviewHeader.className = 'review-header';
  reviewArticle.appendChild(reviewHeader);

  const name = document.createElement('h3');
  name.innerHTML = review.name;
  reviewHeader.appendChild(name);

  const date = document.createElement('h4');
  date.innerHTML = moment(review.updatedAt).format('L');
  reviewHeader.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  reviewArticle.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  reviewArticle.appendChild(comments);

  return li;
}

/**
 * Calculates the average rating and fills the corresponding stars based on that average
 * @param {*} reviews 
 */
let fillReviewStars = (reviews) => {
  var ratings = reviews.map(x => {
    return Number(x.rating);
  });

  var average = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  var absoluteAverage = Math.round(average);

  setRating(absoluteAverage);
}

let showReviewsForm = () => {

  var reviewsForm = document.getElementById('review-form');

  reviewsForm.style.display = '';

  var starsLabel = document.getElementById('stars-value-review-form');

  starsLabel.innerText = getRating();
}

let hideReviewsForm = () => {

  var reviewsForm = document.getElementById('review-form');

  reviewsForm.style.display = 'none';

  document.getElementById('name').value = '';

  document.getElementById('comments').value = '';
}

let setRating = (rating) => {
  const container = document.getElementById('stars-container');

  container.setAttribute('data-stars', rating);
}

let getRating = () => {
  const container = document.getElementById('stars-container');

  return container.getAttribute('data-stars');
}

let sendReview = (event) => {
  event.preventDefault();

  var name = document.getElementById('name').value;

  var comments = document.getElementById('comments').value;

  var rating = getRating();

  var review = {
    "name": name,
    "rating": rating,
    "comments": comments,
    "restaurant_id": Number(getParameterByName('id'))
  };

  return dbHelper.postReview(review).then(() => {
    hideReviewsForm();

    showSuccessMessage();

    fetchAndShowReviews();
  });
}

let showSuccessMessage = () =>{
  var successMessage = document.getElementById('review-submit-success');

  successMessage.style.display = '';

  window.setTimeout(() => {
    successMessage.style.display = 'none';
  }, 2000);
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
let fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
