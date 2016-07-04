import {ITweet} from "./ITweet";

export interface ITweetAnalysed {
    tweet: ITweet;
    classification: String;

    output: String;
    output_multi: any[];
}

export class TweetAnalysed implements ITweetAnalysed {
    public tweet: ITweet;
    public classification: String;

    public output: String;
    public output_multi: any[];

    constructor(tweet: ITweet) {
        this.tweet = tweet;
    }
}
