window.tweetSocket = (function (document) {
	"use strict";
	var socket = io();
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
				if (status.status === "ACCEPTED") {
					observer.onNext({
						training: true,
						message: status.message
					});
				} else if (status.status === "RUNNING") {
					// ignore these, there could be a lot of them
				} else if (status.status === "DONE") {
					observer.onNext({
						training: false,
						message: status.message
					});
				} else {
					// problem?
					observer.onNext({
						training: false,
						message: status.message
					});
				}
			});
		}),
		countStream: Rx.Observable.create(function (observer) {
			socket.on("counts", function (counts) {
				observer.onNext(counts);
			});
		}),
		trackingStream: Rx.Observable.create(function (observer) {
			socket.on("tracking", function (term) {
				observer.onNext(term);
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
