"use strict";

export class Config {
  port: String = "8080";
  host: String = "0.0.0.0";

  gcloud: any = {
    projectId: "cloudprediction",
    keyFile: "../../../cloudPredictionServiceAccount.json",
    namespace: "LabelCat"
  };

  twitter: any = require("../../../twitter-config.json");
};
