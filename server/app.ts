/// <reference path="./typings/index.d.ts"/>

"use strict";

import { Config } from "./config";
import { CloudPredictor } from "./cloudprediction";
import { ITweet, TweetAnalysed, TwitterWatcher } from "./twitterwatcher";
import { Database } from "./database";
import * as socketIo from "socket.io";

let config = new Config();
let PROD = process.env.NODE_ENV === "production";

//  initialize IOC container
let container = require("./container");
let express = require("express");

let db = new Database();
let app = express();
let server = require("http").Server(app);
let apiMode = "learn";

let staticPath;

let mySocket = socketIo(server);
let tweetWatcher = new TwitterWatcher(config.twitter);
let predictor = new CloudPredictor(null, config, container);

let trainingStart = new Date();

if (PROD) {
  staticPath = __dirname + "/../../dist/";
} else {
  staticPath = __dirname + "/../../app/";
}

//  serve all other requests for files that exist
console.log("serving static files from " + staticPath);
app.use(express.static(staticPath, { maxAge: "1d" }));

server.listen(7654);

// tweetWatcher.track("nhs");

function pollStatus() {
  predictor.getModelById("tweetSentiment")
    .then((result) => {
      let status = result[0];
      console.log("Training status:", status.trainingStatus, new Date());

      let elapsed =
        Math.floor((new Date().getTime() - trainingStart.getTime()) / 1000);

      if (status.trainingStatus === "RUNNING") {
        mySocket.emit("trainingStatus", {
          message: `Training in progress(${elapsed} seconds)`,
          status: status.trainingStatus
        });
        setTimeout(() => { pollStatus(); }, 5000);

        return;
      }

      mySocket.emit("trainingStatus", {
        message: `Training complete(${elapsed} seconds)`,
        status: status.trainingStatus
      });
    });
}

function getTimeOfDay(tweet: ITweet) : String {
  let myDate: Date = new Date(tweet.created_at.toString());
  return myDate.getHours() + "." + myDate.getMinutes();
}

mySocket.on("connection", (socket: SocketIO.Socket) => {
  console.log("user connected", socket.id);

  socket.on("classify", (tweet, callback) => {
    console.log("classify", tweet.tweetId, tweet.class);

    db
      .updateTweet(tweet.tweetId, tweet.class)
      .then(() => {
        db.getNextUnclassifiedTweet(tweet.tweetId).then((nextTweet) => {
          callback(nextTweet);
        });
      });;
  });

  socket.on("train", () => {
    console.log("training");

    db.getTweets().then((tweets: ITweet[]) => {
      let instances = [];
      for (var index = 0; index < tweets.length; index++) {
        let trainingInstance = {
          "csvInstance": [tweets[index].text, getTimeOfDay(tweets[index]), tweets[index].geo],
          "output": tweets[index]
        };
        instances.push(trainingInstance);
      }

      mySocket.emit("trainingStatus", {
        message: "Training requested, " + tweets.length + " instances",
        status: "ACCEPTED"
      });

      predictor.trainModel("tweetSentiment", instances)
        .then((result) => {
          console.log("training accepted");
          trainingStart = new Date();
          mySocket.emit("trainingStatus", {
            message: "Training request accepted",
            status: "ACCEPTED"
          });
          setTimeout(() => { pollStatus(); }, 1000);
        },
        (err) => { console.log("training error", err); })
        .catch((err) => { console.log("training error2", err); });
    });
  });

  socket.on("tweetRequest", (callback) => {
    console.log("tweetRequest");

    db.getNextUnclassifiedTweet().then((tweet: ITweet) => {
      console.log("sending", tweet.id_str);
      callback(tweet);
    });
  });

  socket.on("apiMode", (mode) => {
    console.log("apiMode", mode);
    apiMode = mode;
  });

  socket.on("disconnect",
    () => { console.log("user disconnected", socket.id); });
});

tweetWatcher.on("tweet", (tweet: ITweet) => {

  if (tweet.retweeted_status) {
    // ignore retweets
    return;
  }

  console.log(new Date(), tweet.text);
  db.storeTweet(tweet);

  if (apiMode === "predict") {

    predictor.predict("tweetSentiment", { "csvInstance": [tweet.text] })
      .then((result: any) => {
        let analysis = result[0];
        let casted: TweetAnalysed = new TweetAnalysed(tweet);

        casted.output = analysis.outputLabel;
        casted.output_multi = analysis.outputMulti;

        mySocket.emit("tweet", casted);
      })
      .catch((err) => { console.log("prediction error", err); });
  } else {
    mySocket.emit("tweet", tweet);
  }
});
