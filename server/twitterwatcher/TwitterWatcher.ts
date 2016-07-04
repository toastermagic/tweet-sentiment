"use strict";

let Twitter = require("twitter");
import * as EventEmitter from "wolfy87-eventemitter";
import { ITweet } from "./ITweet";
import { ITwitterConfig } from "./ITwitterConfig";

export class TwitterWatcher extends EventEmitter {
    private tApi: any;
    private tweetStream: any;

    constructor(config: ITwitterConfig) {
        super();

        this.tApi = new Twitter({
            access_token_key: config.access_token_key,
            access_token_secret: config.access_token_secret,
            consumer_key: config.consumer_key,
            consumer_secret: config.consumer_secret
        });
    }

    public track(term: String) {
        console.log("tracking", term);
        this.tweetStream = this.tApi.stream("statuses/filter", { track: term });

        this.tweetStream.on("error", (err: Error) => {
            console.log("twitter stream error", err.message);
        });

        this.tweetStream.on("data", (tweet: ITweet) => {
            this.emitEvent("tweet", [tweet]);
        });
    }
}
