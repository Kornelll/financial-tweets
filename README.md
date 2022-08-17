# Assignment - Financial Tweets

### MEAN STACK APPLICATION
> Technologies
- Frontend App
    - Angular8
    - Typescript
    - Bootstrap 4
    - HTML5 / SCSS (sass)
    - Angular Material 8
- Backend API
    - Node.js / Express.js
    - Mongodb / Mongoose

> Tools
- VSCODE
- Git / Github


> Setup
- cd project directory
- `npm i`
- `npm start`
- cd public folder in project directory
- `npm i`
- `npm start`
- Go to browser and hit http://localhost:4200/


> Deployment
- cd public folder in project directory
- `ng build --prod`
- cd project directory

*Basic deploy command to deploy*
```
APP_URL=https://assignment-financial-tweets.herokuapp.com/#  BASE_URL=https://assignment-financial-tweets.herokuapp.com  SEED=true  NODE_ENV=production pm2 start server.js
```

*Deploy command without seed and with port*
```
APP_URL=https://assignment-financial-tweets.herokuapp.com/#  BASE_URL=https://assignment-financial-tweets.herokuapp.com PORT=9050 NODE_ENV=production pm2 start server.js
```

*Deploy command with cluster mode*
```
APP_URL=https://assignment-financial-tweets.herokuapp.com/#  BASE_URL=https://assignment-financial-tweets.herokuapp.com PORT=9050 NODE_ENV=production pm2 start server.js -i max
```
``-i max`` automatically configures available number of instances calculated from the available number of cores on the server. Similary you may specify exact number of instances e.g. ``-i 4`` if you want `4` instances