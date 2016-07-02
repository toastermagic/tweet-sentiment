var socket = io();

var mySocket = {
    tweetStream: Rx.Observable.create((observer) => {
        socket.on("tweet", (tweet) => {
            observer.onNext(tweet);
        });
    }),
    statusStream: Rx.Observable.create((observer) => {
        socket.on("trainingStatus", (status) => {
            observer.onNext({
                training: status.status === "RUNNING",
                message: status.message
            });
        });
    }),
    requestTweets: (afterTweetId, limit) => {
        return Rx.Observable.create((observer) => {
            socket
                .emit("tweetRequest", {
                    afterTweetId,
                    limit
                }, (tweets) => {
                    for (var index = 0; index < tweets.length; index++) {
                        observer.onNext(tweets[index]);
                    }
                });
        });
    },
    classifyTweet: (tweetId, classification) => {
        socket.emit("classify", {
            tweetId: tweetId,
            class: classification
        });
    },
    sendCommand: (commandName, options) => {
        socket.emit("commandName", options);
    }
};
