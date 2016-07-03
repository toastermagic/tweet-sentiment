# Simple Sentiment Analysis of Tweets

<img src="app/images/predictionapi.png" style="height:24px"/> 

## What it does

Tweets should appear on screen, you can classify them by hovering over them and
clicking any of the buttons that appear.

After classifying some tweets, you can click the train button to pass this data to
the Google cloud prediction api.

Now you can select the 'predict' option, and Google will make it's best guesses at each new
tweets sentiment.

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

## This Project Uses:

* [Polymer](https://www.polymer-project.org/), [Paper](https://elements.polymer-project.org/browse?package=paper-elements), [Iron](https://elements.polymer-project.org/browse?package=iron-elements) and [Neon](https://elements.polymer-project.org/browse?package=neon-elements) elements
* [Google Cloud Prediction](https://cloud.google.com/prediction/)
* [twitter](https://www.npmjs.com/package/twitter)
* [twitter-widgets](https://dev.twitter.com/web/embedded-tweets)
* [couchDB](http://couchdb.apache.org/)
