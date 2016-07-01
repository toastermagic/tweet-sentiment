import {ITweet} from "./ITweet";

export interface ITweetAnalysed {
    tweet: ITweet;
    classification: String;

    output: String;
    output_multi: any[];
}

export class TweetAnalysed implements ITweetAnalysed {
    constructor(tweet: ITweet) {
        this.tweet = tweet;
    }

    tweet: ITweet;
    classification: String;

    output: String;
    output_multi: any[];
}