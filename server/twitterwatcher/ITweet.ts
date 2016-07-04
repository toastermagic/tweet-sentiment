export interface ITweet {
    //  unused. Future/beta home for status annotations.  
    annotations: Object;

    //  collection of Contributors nullable. 
    contributors?: any;

    //  represents the geographic location of this Tweet
    coordinates?: any;

    //  time (UTC) when this Tweet was created.
    created_at:	String;

    current_user_retweet: Object;

    entities: any;

    //  approximately how many times this Tweet has been “liked” by Twitter users.
    favorite_count?: Number;

    //  whether this Tweet has been liked by the authenticating user.
    favorited?: Boolean;

    //  the maximum value of the filter_level parameter which may be used and 
    //  still stream this Tweet. So a value of medium will be streamed on none, 
    //  low, and medium streams.
    filter_level: String;

    //  deprecated. Use the “coordinates” field instead.
    geo?: Object;

    //  integer representation of the unique identifier for this Tweet
    //  this number is greater than 53 bits and some programming languages may have 
    //  difficulty/silent defects in interpreting it.
    //  using a signed 64 bit integer for storing this identifier is safe.
    //  use id_str for fetching the identifier to stay on the safe side.
    id: Number;

    //  the string representation of the unique identifier for this Tweet.
    id_str:	String;

    //  if the represented Tweet is a reply, this field will contain the screen name of the original Tweet’s author.
    in_reply_to_screen_name?: String;

    //  if the represented Tweet is a reply, this field will contain the string
    //  representation of the original Tweet’s ID.
    in_reply_to_status_id_str?: String;

    //  if the represented Tweet is a reply, this field will contain the string representation
    //  of the original Tweet’s author ID. This will not necessarily always be the user directly mentioned in the Tweet.
    in_reply_to_user_id_str?: String;

    //  when present, indicates a BCP 47 language identifier corresponding to the 
    //  machine-detected language of the Tweet text, or “und” if no language could be detected.
    lang?: String;

    place?: any;

    //  this field only surfaces when a tweet contains a link. 
    //  the meaning of the field doesn’t pertain to the tweet content itself, 
    //  but instead it is an indicator that the URL contained in the tweet may contain 
    //  content or media identified as sensitive content.
    possibly_sensitive?: Boolean;

    //  this field only surfaces when the Tweet is a quote Tweet. This field contains the integer value 
    //  Tweet ID of the quoted Tweet.
    quoted_status_id?: Number;

    //  this field only surfaces when the Tweet is a quote Tweet. This is the string representation 
    //  Tweet ID of the quoted Tweet.
    quoted_status_id_str?: String;

    //  set of key-value pairs indicating the intended contextual delivery of the containing Tweet. 
    //  currently used by Twitter’s Promoted Products.
    scopes:	any;

    //  number of times this Tweet has been retweeted
    retweet_count: Number;

    //  indicates whether this Tweet has been retweeted by the authenticating user.
    retweeted: Boolean;

    retweeted_status: any;
    //  utility used to post the Tweet, as an HTML-formatted string. Tweets from the Twitter website 
    //  have a source value of web.
    source: String;

    //  actual UTF-8 text of the status update. See twitter-text for details on what is currently
    //  considered valid characters.
    text: String;

    //  indicates whether the value of the text parameter was truncated,
    //  since Twitter now rejects long Tweets vs truncating them, the large majority of Tweets will 
    //  have this set to false. 
    truncated: Boolean;

    //  user who posted this Tweet. Perspectival attributes embedded within this object are unreliable.
    user: any;

    //  when present and set to “true”, it indicates that this piece of content has been
    //   withheld due to a DMCA complaint.
    withheld_copyright?: Boolean;

    //  indicates a list of uppercase two-letter country codes this content is withheld from.
    withheld_in_countries?: any;

    //  indicates whether the content being withheld is the “status” or a “user.”
    withheld_scope?:	String;
}
