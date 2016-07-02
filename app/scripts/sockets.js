var socket = io();

var mySocket = {
    tweetStream: () => {
        let streamSource = Rx.Observable.create((observer) => {
            socket.on("tweet", (tweet) => {
                observer.onNext(tweet);
            });
        });

        return streamSource;
    },
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
                    observer.onNext(tweets);
                });
        });
    },
    classifyTweet: (options) => {
        socket.emit("classify", {
            tweetId: options.tweetId,
            class: options.classification
        });
    },
    sendCommand: (commandName, options) => {
        socket.emit(commandName, options);
    }
};
