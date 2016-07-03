# Simple Sentiment Analysis

> Using Google's Cloud Prediction API <img src="app/images/predictionApiLogo_small.png"/> 
> to classify comments on Twitter

## This Project Uses:

* [Polymer](https://www.polymer-project.org/), [Paper](https://elements.polymer-project.org/browse?package=paper-elements), [Iron](https://elements.polymer-project.org/browse?package=iron-elements) and [Neon](https://elements.polymer-project.org/browse?package=neon-elements) elements
* [Google Cloud Prediction](https://cloud.google.com/prediction/)
* [twitter](https://www.npmjs.com/package/twitter)
* [twitter-widgets](https://dev.twitter.com/web/embedded-tweets)
* [couchDB](http://couchdb.apache.org/)

## Getting Started

* get the repo:
```
git clone https://github.com/toastermagic/tweet-sentiment.git
```

* install the dependencies:
```
npm i
```

* build with gulp:
```
gulp
```

* run with:
```
node dist/server/app.js
```