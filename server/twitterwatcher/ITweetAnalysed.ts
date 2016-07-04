import {ITweet} from "./ITweet";

export interface ITweetAnalysed {
    tweetId: String;
    classification: String;

    output: String;
    output_multi: any[];
}

export class TweetAnalysed implements ITweetAnalysed {
    public tweetId: String;
    public classification: String;

    public output: String;
    public output_multi: any[];

    constructor(tweet: ITweet) {
        this.tweetId = tweet.id_str;
    }
}
