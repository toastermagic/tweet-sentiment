"use strict";

var Twitter = require("twitter");
import * as EventEmitter from "wolfy87-eventemitter";
import { ITweet } from "./ITweet";

interface ITwitterConfig {
    consumer_key: String;
    consumer_secret: String;
    access_token_key: String;
    access_token_secret: String;
}

export class TwitterWatcher extends EventEmitter {
    tApi: any;
    tweetStream: any;

    constructor(config: ITwitterConfig) {
        super();

        this.tApi = new Twitter({
            consumer_key: config.consumer_key,
            consumer_secret: config.consumer_secret,
            access_token_key: config.access_token_key,
            access_token_secret: config.access_token_secret
        });
    }

    public track(term: String) {
        console.log("tracking", term);
        this.tweetStream = this.tApi.stream("statuses/filter", { track: term });

        this.tweetStream.on("data", (tweet: ITweet) => {
            this.emitEvent("tweet", [tweet]);
        });
    }
}