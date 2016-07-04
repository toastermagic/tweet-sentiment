"use strict";

import {Config} from "../config";

let dependable = require("dependable");
let path = require("path");
let gcloud = require("gcloud");
let google = require("googleapis");
let config = new Config();

let key;
try {
  if (process.env.NODE_ENV === "test") {
    key = {
      client_email: "",
      client_id: "",
      private_key: "",
      private_key_id: "",
      type: "service_account"
    };
  } else {
    key = require(config.gcloud.keyFile);
  }
} catch (err) {
  console.error(`Could not read key file! 
  Did you download one from 
  https://console.developers.google.com/project/${config.gcloud.projectId}/apiui/credential ?`);
  throw err;
}

let container = dependable.container();

container.register("Promise", function () {
  return require("bluebird");
});

container.register("request", function (Promise: any) {
  return Promise.promisify(require("request"));
});

container.register("config", config);

//  interface for communicating with the GCP DataStore.
container.register("dataset", function (Promise) {
  return Promise.promisifyAll(gcloud.datastore.dataset({
    keyFilename: config.gcloud.keyFile,
    projectId: config.gcloud.projectId
  }));
});

//  interface for communicating with the GCP PubSub.
container.register("pubsub", function (Promise) {
  return Promise.promisifyAll(gcloud.pubsub({
    keyFilename: config.gcloud.keyFile,
    projectId: config.gcloud.projectId
  }));
});

//  interface for communicating with the GCP Prediction API.
container.register("trainedModelsApi", function (Promise) {
  let trainedmodels = google.prediction("v1.6").trainedmodels;
  Promise.promisifyAll(trainedmodels);
  return trainedmodels;
});

//  authorization tool for the Google APIs.
container.register("jwtClient", function (Promise) {
  return Promise.promisifyAll(new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ["https://www.googleapis.com/auth/prediction"],
    null
  ));
});

//  interface for communicating with the Twitter API.
container.register("twitterwatcher", function () {
  let r = require("../twitterWatcher");
  return new r.TwitterWatcher(config.twitter);
});

//  interface for communicating with the Predictions API.
container.register("prediction", function () {
  return google.prediction("v1.6");
});

//  interface for communicating with the Predictions API.
container.register("predictor", function () {
  let p = require("../cloudprediction");
  return new p.CloudPredictor();
});

//  register all of the files in these folders with the container, using each
//  file's name as its registered name in the container.
container.load(path.join(`${__dirname}/app`, "../../cloudprediction"));
container.load(path.join(`${__dirname}/app`, "../../config"));
container.load(path.join(`${__dirname}/app`, "../../twitterwatcher"));

//  register the container with itself so it can be depended upon.
container.register("container", function () {
  return container;
});

module.exports = container;
