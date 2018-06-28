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

let initServiceWorker = () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }
  
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js');
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