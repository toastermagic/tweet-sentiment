"use strict";

export class Config {
  public port: String = "8080";
  public host: String = "0.0.0.0";

  public firebase: any = require("./firebase-config.json");

  public gcloud: any = {
    keyFile: require("./cloudPredictionServiceAccount.json"),
    namespace: "LabelCat",
    projectId: "cloudprediction"
  };

  public twitter: any = require("./twitter-config.json");

};
