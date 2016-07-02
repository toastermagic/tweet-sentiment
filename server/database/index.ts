"use strict";

import {ITweet} from "../twitterwatcher/ITweet";

let NodeCouchDb = require("node-couchdb");
let couch: any = new NodeCouchDb();

export class Database {
    trainingDb: any;

    constructor() {
        console.log("couchdb initialising");
        this.checkDbExists();
    }

    storeTweet(tweet: ITweet) {
        couch.uniqid()
            .then(ids => {
                couch.insert("training", {
                    _id: ids[0],
                    tweet
                }).then((result) => {
                    // console.log("training data stored");
                }, err => {
                    console.log("could not add training data", err);
                });
            });
    }

    deleteTweet(tweetId: String) {
        return new Promise((res, rej) => {
            couch
                .get("training", "_design/trainingTweets/_view/by_tweetId", { keys: [tweetId] })
                .then((result) => {
                    if (result.data.rows.length === 0) {
                        console.log("Could not find tweet with id", tweetId);
                        rej(`Could not find tweet with id ${tweetId}`);
                    }

                    let doc = result.data.rows[0];

                    couch.del("training", doc.value._id, doc.value._rev)
                    .then(() => {
                        console.log("bad tweet deleted");
                        res();
                    }, err => {
                        console.log("couldn't delete bad tweet", err);
                        rej(err);
                    });
                }, err => {
                    console.log("error locationg tweet with id", tweetId, err);
                    rej(err);
                });
        });
    }

    updateTweet(tweetId: String, classification: String) {
        return new Promise((res, rej) => {
            couch
                .get("training", "_design/trainingTweets/_view/by_tweetId", { keys: [tweetId] })
                .then((result) => {
                    if (result.data.rows.length === 0) {
                        console.log("Could not find tweet with id", tweetId);
                        rej(`Could not find tweet with id ${tweetId}`);
                    }

                    let doc = result.data.rows[0];

                    couch.update("training", {
                        _id: doc.value._id,
                        _rev: doc.value._rev,
                        classification,
                        tweet: doc.value.tweet
                    }).then(() => {
                        res();
                        console.log("tweet classified");
                    }, err => {
                        rej(err);
                        console.log("tweet classification error", err);
                    });
                }, err => {
                    console.log("error locationg tweet with id", tweetId, err);
                    rej(err);
                });
        });
    }

    getTweets() {
        return new Promise((res, rej) => {
            couch.get("training", "_design/trainingTweets/_view/by_classification")
                .then((results) => {
                    var tweets = results.data.rows.map((row) => row.value);
                    res(tweets);
                },
                (err) => {
                    rej(err);
                });
        });
    }

    getNextUnclassifiedTweet(lastTweetId?: String) {
        return new Promise((res, rej) => {
            let options: any = {
                limit: 1
            };

            if (lastTweetId) {
                options.skip = 1;
                options.startkey = lastTweetId;
            };

            couch.get("training", "_design/trainingTweets/_view/unclassified", options)
                .then((results) => {
                    if (results.data.rows.length === 0) {
                        rej("No unclassified tweets found");
                    } else {
                        res(results.data.rows[0].value.tweet);
                    }
                },
                (err) => {
                    rej(err);
                });
        });
    }

    private createTrainingDb() {
        couch.createDatabase("training")
            .then(() => {
                console.log("training database created");
                couch.insert("training", {
                    _id: "_design/trainingTweets",
                    views: {
                        "all": {
                            "map": "function(doc){ if (doc.tweet) { emit(null, doc) }}"
                        },
                        "by_classification": {
                            "map": "function(doc){ if (doc.classification) { emit(doc.classification, doc) }}"
                        },
                        "by_tweetId": {
                            "map": "function(doc){ if (doc.tweet.id_str) { emit(doc.tweet.id_str, doc) }}"
                        }
                    }
                }).then((result) => {
                    console.log("design view created");
                }, err => {
                    console.log("could not create design view", err);
                });
            }, err => {
                console.log("could not create database", err);
            });
    }

    private checkDbExists() {
        couch.listDatabases()
            .then(dbs => {
                let trainingDb = dbs.filter((db) => db === "training")[0];

                if (trainingDb) {
                    console.log("training db exists");
                } else {
                    console.log("training db does not exist, creating");
                    this.createTrainingDb();
                }
            }, err => {
                console.log("could not enumerate databases", err);
            });
    }
}