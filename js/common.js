const dbHelper = new DBHelper('localhost', 1337);

const imageSizes = {
  'medium': 999,
  'small': 649,
  'large': 0
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

const mapIsEnabled = () => {
  return document.getElementById('map').style.display !== 'none';
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

let isOnline = () => {
  return window.navigator.onLine;
}

let doDeferredOfflineTasks = () => {
  if (!isOnline()) {
    return Promise.resolve(false);
  }

  const restaurantId = getRestaurantId();

  dbHelper.getDeferredRestaurantRevies(restaurantId).then(reviews => {
    reviews.forEach(review => {
      const deferredReviewId = review.id;

      review.id = null;

      return dbHelper.postReview(review).then(() => {
        return dbHelper.deleteDeferredReview(deferredReviewId);
      });
    });
  });

  dbHelper.getDeferredFavorites().then(favorites => {
    favorites.forEach(favorite => {
      return dbHelper.setRestaurantFavorite(favorite.restaurantId, favorite.isFavorite).then(() => {
        return dbHelper.deleteDeferredFavorite(favorite.restaurantId);
      });
    })
  })
}

let getRestaurantId = () => {
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    return null;
  }

  return Number(id);
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

let appendFavoriteIcons = (restaurant, nameHeaderElement, insertBeforeElement) => {
  var isFavorite = restaurant.is_favorite === 'false' ? false : true;

  const likeAlt = `Unmark ${restaurant.name} as favorite restaurant`;
  const likeButton = document.createElement('button');
  likeButton.id = `like-${restaurant.id}`;
  likeButton.className = 'button-with-icon';
  likeButton.title = likeAlt;
  likeButton.onclick = function () { unfavoriteRestaurant(restaurant.id); };
  likeButton.style.display = isFavorite ? '' : 'none';

  const like = document.createElement('img');
  like.className = 'favorite';
  like.setAttribute('src', '/icons/like.svg');
  like.setAttribute('alt', likeAlt);
  likeButton.appendChild(like);


  const heartAlt = `Mark ${restaurant.name} as favorite restaurant`;
  const heartButton = document.createElement('button');
  heartButton.id = `heart-${restaurant.id}`;
  heartButton.className = 'button-with-icon';
  heartButton.title = heartAlt;
  heartButton.onclick = function () { favoriteRestaurant(restaurant.id); };
  heartButton.style.display = !isFavorite ? '' : 'none';

  const heart = document.createElement('img');
  heart.className = 'not-favorite';
  heart.setAttribute('src', '/icons/heart.svg');
  heart.setAttribute('alt', heartAlt);
  heartButton.appendChild(heart);

  if (insertBeforeElement) {
    nameHeaderElement.insertBefore(likeButton, insertBeforeElement);
    nameHeaderElement.insertBefore(heartButton, insertBeforeElement);
  }
  else {
    nameHeaderElement.appendChild(likeButton);
    nameHeaderElement.appendChild(heartButton);
  }
}

let unfavoriteRestaurant = (restaurantId) => {
  dbHelper.setRestaurantFavorite(restaurantId, false)
    .then(
      restaurant => {
        toggleFavoriteButtons(restaurant);
      });
}

let favoriteRestaurant = (restaurantId) => {
  dbHelper.setRestaurantFavorite(restaurantId, true).then(
    restaurant => {
      toggleFavoriteButtons(restaurant);
    });
}

let toggleFavoriteButtons = (restaurant) => {
  const likeButton = document.getElementById(`like-${restaurant.id}`);
  const heartButton = document.getElementById(`heart-${restaurant.id}`);

  likeButton.style.display = restaurant.is_favorite ? '' : 'none';
  heartButton.style.display = !restaurant.is_favorite ? '' : 'none';
}