"use strict";
var Twitter = require("twitter");
const EventEmitter = require("wolfy87-eventemitter");
class TwitterWatcher extends EventEmitter {
    constructor(config) {
        super();
        this.tApi = new Twitter({
            consumer_key: config.consumer_key,
            consumer_secret: config.consumer_secret,
            access_token_key: config.access_token_key,
            access_token_secret: config.access_token_secret
        });
    }
    track(term) {
        console.log("tracking", term);
        this.tweetStream = this.tApi.stream("statuses/filter", { track: term });
        this.tweetStream.on("data", (tweet) => {
            this.emitEvent("tweet", [tweet]);
        });
    }
}
exports.TwitterWatcher = TwitterWatcher;
//# sourceMappingURL=index.js.map