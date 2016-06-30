/// <reference path="./typings/index.d.ts"/>

"use strict";

import {ITweet} from "./server/twitterwatcher/ITweet";
import {CloudPredictor} from "./server/cloudprediction";

//  initialize IOC container
let container = require("./app/container");
var express = require("express");

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(7654);

//  , { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] })(server);

container.resolve(function (config: any, twitterwatcher: any) {
    let predictor = new CloudPredictor(null, config, container);

    twitterwatcher
        .track("nhs");

    twitterwatcher.on("tweet", (tweet: ITweet) => {

        let trainingInstance = {
            "csvInstance": [tweet.text],
            "output": "supportive"
        }

        predictor
            .predict(1, [tweet.text])
            .then((result) => {
                console.log(result);
            }, (err) => {
                console.log(err);
            })
            .catch((err) => {
                console.log(err);
            });

        console.log(tweet.text);
    });
});

