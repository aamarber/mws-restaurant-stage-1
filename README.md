# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Dependencies
You will need to clone the next repository:
https://github.com/udacity/mws-restaurant-stage-2

After that, on that repository run:

node server


## Project Installation & Run

Add the /development_certificate/rootCA.pem and /development_certificate/server.crt to your trusted certificates.
This is to ensure that there will be no problems with htpps with the local, self-signed certificates I've created to test the PWA.

On the root folder, run:

npm install gulp

npm i

gulp dist


This should launch a navigator on https://localhost:3000

## Features

### Reviews
On the detail page of each restaurant, 5 stars are shown. The number of stars filled show the average rating that restaurant has.

If any star is clicked, a form to submit a review for that restaurant will be shown. The review rating will be the star number clicked (if the star is the 2nd, then 2 stars are given).

If no problem happens, then a success message will be shown to the user. BUT if the user is offline, a failure message will be shown and the review submission wil be deferred until the user is online again. When online, the submission will be done automatically (with no action to be made by the user).

### Favorite restaurants
Aside to the restaurant name a heart will appear. If filled, that means that that restaurant is one of your favorites. If the heart is clicked, then that restaurant will toggle its 'favorite' status.
