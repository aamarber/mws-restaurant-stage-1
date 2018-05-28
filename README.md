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
