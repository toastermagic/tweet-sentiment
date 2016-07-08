# Simple Sentiment Analysis of Tweets

<a href="https://cloud.google.com/prediction/">
  <img src="app/images/predictionapi.png" style="height:24px"/> 
</a>

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

## Credentials

If you want to run the project yourself you'll need two credentials files that are not in this repository

*   `cloudPredictionServiceAccount.json` 
get this from google, you'll need a google cloud engine account (free)
https://cloud.google.com/prediction/docs/quickstart
```
{
    "type": "service_account",
    "project_id": "",
    "private_key_id": "",
    "private_key": "",
    "client_email": "service@cloudprediction.iam.gserviceaccount.com",
    "client_id": "",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service%40cloudprediction.iam.gserviceaccount.com"
}
```

*   `twitter-config.json` 
get these keys from https://dev.twitter.com/
```
{
    "consumer_key": "",
    "consumer_secret": "",
    "access_token_key": "",
    "access_token_secret": ""
}
```

## This Project Uses:

* [Google Cloud Prediction](https://cloud.google.com/prediction/)
* [twitter](https://www.npmjs.com/package/twitter)
* [twitter-widgets](https://dev.twitter.com/web/embedded-tweets)
* [couchDB](http://couchdb.apache.org/)
* [Polymer](https://www.polymer-project.org/), [Paper](https://elements.polymer-project.org/browse?package=paper-elements), [Iron](https://elements.polymer-project.org/browse?package=iron-elements) and [Neon](https://elements.polymer-project.org/browse?package=neon-elements) elements
* [packery](http://packery.metafizzy.co/)
