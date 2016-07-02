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
        setTimeout(() => { pollStatus(); }, 1000);

        return;
      }

      mySocket.emit("trainingStatus", {
        message: `Training complete - ${status.trainingStatus} (${elapsed} seconds)`,
        status: status.trainingStatus
      });
    });
}

function convertTweet(tweet: ITweet): Promise<TweetAnalysed> {
  let casted: TweetAnalysed = new TweetAnalysed(tweet);

  return new Promise((res, rej) => {
    if (apiMode === "predict") {
      predictor.predict("tweetSentiment", { "csvInstance": [tweet.text] })
        .then((result: any) => {
          let analysis = result[0];

          casted.output = analysis.outputLabel;
          casted.output_multi = analysis.outputMulti;

          res(casted);
        })
        .catch((err) => {
          rej(err);
        });
    } else {
      res(casted);
    }
  });
}

function getTimeOfDay(tweet: any): String {
  let myDate: Date = new Date(tweet.tweet.created_at.toString());
  let hours: String = "0" + myDate.getHours();
  let minutes: String = "0" + myDate.getMinutes();
  return hours.substr(hours.length - 2) + ":" + minutes.substr(minutes.length - 2);
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

    db.getTweets().then((tweets: any[]) => {
      let instances = [];
      for (var index = 0; index < tweets.length; index++) {
        let trainingInstance = {
          "csvInstance": [tweets[index].tweet.text,
            getTimeOfDay(tweets[index]),
            JSON.stringify(tweets[index].tweet.geo),
            tweets[index].tweet.user.screen_name],
          "output": tweets[index].classification
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

  socket.on("badTweet", (tweetId) => {
    console.log("badTweet", tweetId);
    db.deleteTweet(tweetId);
  });

  socket.on("tweetRequest", (tweetId, callback) => {
    console.log("tweetRequest");

    db.getNextUnclassifiedTweet(tweetId).then((tweet: ITweet) => {
      console.log("sending", tweet.id_str);
      convertTweet(tweet)
        .then((newTweet) => callback(newTweet));
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

  convertTweet(tweet)
    .then((newTweet) => mySocket.emit("tweet", newTweet));
});
