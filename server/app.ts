/// <reference path="../typings/index.d.ts"/>
"use strict";

import { Config } from "./config";
import { CloudPredictor } from "./cloudprediction";
import { ITweet, TweetAnalysed, TwitterWatcher } from "./twitterwatcher";
import { Database } from "./database";
import * as socketIo from "socket.io";
import * as express from "express";
import * as http from "http";
import * as ejs from "ejs";

let config = new Config();
let PROD = process.env.NODE_ENV === "production";
let PORT = process.env.PORT || 8000;

//  initialize IOC container
import container = require("./container");

let db = new Database();
let app = express();
let server = http.createServer(app);
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

//  we need a view engine because we want to inject our configs into the client side html
app.set("view engine", "ejs");

//  this next line allows us to render using ejs whilst using a .js file extension 
app.engine("js", ejs.renderFile);

//  this line tells us where to find the views
app.set("views", staticPath);

process.on("uncaughtException", (err: Error) => {
  console.log("Uncaught exception:", err);
});

//  special case where we want to inject our apikeys
app.get("/scripts/app.js",
  (req, res) => {
    res.render("scripts/app.js", {
      firebaseApiKey: config.firebase.apiKey,
      firebaseDomain: config.firebase.authDomain,
      firebaseUrl: config.firebase.databaseURL
    });
  });

//  serve all other requests for files that exist
console.log("serving static files from " + staticPath);
app.use(express.static(staticPath, { maxAge: "1d" }));

//  if it doesn't exist, serve a 404
app.get("*", (req: express.Request, res: express.Response) => {
  res.sendStatus(404);
});

console.log("listening on port " + PORT);
server.listen(PORT, function (err: Error) {
  if (err) {
    console.log("express couldn't start", err);
    return;
  }
  console.log("express listening on port " + PORT);
});

let trackingTerm = process.argv.length > 2 ? process.argv[2] : "";
if (trackingTerm) {
  tweetWatcher.track(trackingTerm);
}

function pollStatus() {
  "use strict";
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
  "use strict";
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
          casted.output = err.message;
          res(casted);
        });
    } else {
      res(casted);
    }
  });
}

function getTimeOfDay(tweet: any): String {
  "use strict";
  let myDate: Date = new Date(tweet.tweet.created_at.toString());
  let hours: String = "0" + myDate.getHours();
  let minutes: String = "0" + myDate.getMinutes();
  return hours.substr(hours.length - 2) + ":" + minutes.substr(minutes.length - 2);
}

mySocket.on("connection", (socket: SocketIO.Socket) => {
  console.log("user connected", socket.id);

  socket.on("setTrack", (newTerm) => {
    console.log("new tracking term", newTerm);
    tweetWatcher.track(newTerm);
    mySocket.emit("tracking", newTerm);
    trackingTerm = newTerm;
  });

  socket.on("getTrack", (callback) => {
    console.log("tracking", trackingTerm);
    callback(trackingTerm);
  });

  socket.on("classify", (options, callback) => {
    console.log("classify", options.tweetId, options.class);
    db.updateTweet(options.tweetId, options.class)
      .then(() => {
        db.getClassificationCounts()
          .then((counts) => {
            socket.emit("counts", counts);
          });
      });
  });

  socket.on("counts", () => {
    console.log("counts");
    db.getClassificationCounts()
      .then((counts) => {
        console.log("counted", counts);
        socket.emit("counts", counts);
      });
  });

  socket.on("train", () => {
    console.log("training");

    db.getTweets().then((tweets: any[]) => {
      let instances = [];
      let exp = /(\b(https?|ftp|file):\/\/)([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

      for (let index = 0; index < tweets.length; index++) {
        let stripped = tweets[index].tweet.text.replace(exp, "");
        let wordCount = stripped.split(/\s+/).length;
        let lower = stripped.replace(/[A-Z]/g, "").length;
        let upper = stripped.replace(/[a-z]/g, "").length;
        let upperCaseRatio = upper / (upper + lower);

        let trainingInstance = {
          "csvInstance": [
            stripped,
            getTimeOfDay(tweets[index]),
            JSON.stringify(tweets[index].tweet.geo),
            tweets[index].tweet.user.screen_name,
            wordCount,
            upperCaseRatio
          ],
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

  socket.on("tweetRequest", (options, callback) => {
    console.log("tweetRequest");

    db.getNextUnclassifiedTweet(options.afterTweetId).then((tweet: ITweet) => {
      if (!tweet) {
        console.log("no new unclassified tweets to send");
        callback([]);
        return;
      }

      console.log("sending", tweet.id_str);
      convertTweet(tweet)
        .then((newTweet) => callback([newTweet]));
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
  db.storeTweet(trackingTerm, tweet);

  convertTweet(tweet)
    .then((newTweet) => mySocket.emit("tweet", newTweet));
});
