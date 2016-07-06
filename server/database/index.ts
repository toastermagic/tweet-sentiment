"use strict";

import {ITweet} from "../twitterwatcher/ITweet";
import NodeCouchDb = require("node-couchdb");
import * as _ from "lodash";

let couch: any = new NodeCouchDb();

export class Database {

    constructor() {
        console.log("couchdb initialising");
        this.checkDbExists();
    }

    public storeUserProfile(user: any) {
        return new Promise((res, rej) => {
            couch.uniqid()
                .then(ids => {
                    couch.insert("training", {
                        _id: ids[0],
                        _key: user.uid,
                        user,
                        eventTime: new Date().toUTCString()
                    }).then((result) => {
                        res("training data stored");
                    }, err => {
                        rej("could not add training data");
                    });
                });
        });
    }

    public storeAuthEvent(authEvent: any) {
        let p2 = new Promise((res, rej) => {
            couch.uniqid()
                .then(ids => {
                    couch.insert("training", {
                        _id: ids[0],
                        _key: authEvent.uid,
                        event: authEvent.event,
                        eventTime: new Date().toUTCString(),
                        uid: authEvent.uid
                    }).then((result) => {
                        res("authEvent stored");
                    }, err => {
                        rej("could not store authEvent");
                    });
                });
        });
        if (authEvent.event === "login") {
            return new Promise((res, rej) => {
                couch
                    .get("training", "_design/trainingTweets/_view/user_by_uid", { keys: [authEvent.uid] })
                    .then((result) => {
                        if (result.data.rows.length === 0) {
                            //  first login, let's store the user profile
                            this.storeUserProfile(authEvent.user)
                                .then(() => {
                                    res("new user profile stored");
                                }, err => {
                                    rej("could not user profile");
                                });
                        }
                    });
            }).then(() => p2);
        }
        else {
            return p2;
        }
    }


    public storeTweet(trackingTerm: String, tweet: ITweet) {
        return new Promise((res, rej) => {
            couch.uniqid()
                .then(ids => {
                    couch.insert("training", {
                        _id: ids[0],
                        tweet,
                        trackingTerm
                    }).then((result) => {
                        res("training data stored");
                    }, err => {
                        rej("could not add training data");
                    });
                });
        });
    }

    public deleteTweet(tweetId: String) {
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

    public updateTweet(tweetId: String, classification: String) {
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

    public getTweets() {
        return new Promise((res, rej) => {
            couch.get("training", "_design/trainingTweets/_view/classified")
                .then((results) => {
                    let tweets = results.data.rows.map((row) => row.value);
                    res(tweets);
                },
                (err) => {
                    rej(err);
                });
        });
    }

    public getClassificationCounts() {
        return new Promise((res, rej) => {
            couch.get("training", "_design/trainingTweets/_view/count_by_classification", {
                group_level: 999,
                reduce: true
            })
                .then((results) => {
                    let count = new Object();
                    results.data.rows.map((row) => {
                        count[row.key || "unclassified"] = row.value;
                    });
                    res(count);
                },
                (err) => {
                    rej(err);
                });
        });
    }

    public getNextUnclassifiedTweet(lastTweetId?: String) {
        return new Promise((res, rej) => {
            let options: any = {
                limit: 2
            };

            if (lastTweetId) {
                options.startkey = lastTweetId;
            }

            couch.get("training", "_design/trainingTweets/_view/unclassified", options)
                .then((results) => {
                    if (results.data.rows.length === 0) {
                        res([]);
                    } else if (!lastTweetId) {
                        res(results.data.rows[0].value.tweet);
                    } else {
                        res(_(results.data.rows).last().value.tweet);
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
                        "by_tweetId": {
                            "map": "function(doc){ if (doc.tweet.id_str) { emit(doc.tweet.id_str, doc) }}"
                        },
                        "unclassified": {
                            "map": "function(doc){ if (doc.tweet && !doc.classification) emit(doc.tweet.id_str, doc);}"
                        },
                        "count_by_classification": {
                            "map": "function(doc){ if (doc.tweet) {emit(doc.classification, 1); }}",
                            "reduce": "_sum"
                        },
                        "classified": {
                            "map": "function(doc) { if (doc.tweet && doc.classification) emit(null, doc);}"
                        },
                        "user_by_uid": {
                            "map": "function(doc) { if (doc.user && doc.uid) emit(doc.uid, doc);}"
                        },
                    }
                }).then((result) => {
                    console.log("design views created");
                }, err => {
                    console.log("could not create design views", err);
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
