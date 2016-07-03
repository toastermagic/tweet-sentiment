window.tweetSocket = (function (document) {
    "use strict";
    var socket = io();
    var countStream = Rx.Observable.create();
    var mySocket = {
        tweetStream: function () {
            var streamSource = Rx.Observable.create(function (observer) {
                socket.on("tweet", function (tweet) {
                    observer.onNext(tweet);
                });
            });
            return streamSource.pausable();
        },
        statusStream: Rx.Observable.create(function (observer) {
            socket.on("trainingStatus", function (status) {
                observer.onNext({
                    training: status.status === "RUNNING",
                    message: status.message
                });
            });
        }),
        countStream: Rx.Observable.create(function (observer) {
            socket.on("counts", function (counts) {
                observer.onNext(counts);
            });
        }),
        requestTweets: function (afterTweetId, limit) {
            return Rx.Observable.create(function (observer) {
                socket
                    .emit("tweetRequest", {
                    afterTweetId: afterTweetId,
                    limit: limit
                }, function (tweets) {
                    observer.onNext(tweets);
                });
            });
        },
        classifyTweet: function (options) {
            socket.emit("classify", {
                tweetId: options.tweetId,
                class: options.classification
            });
        },
        sendCommand: function (commandName, options) {
            socket.emit(commandName, options);
        }
    };
    return mySocket;
})(document);
