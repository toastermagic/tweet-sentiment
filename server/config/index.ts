// Copyright 2015, Google, Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

export class Config {
  port: String = "8080";
  host: String = "0.0.0.0";

  // Secret is used by cookie-session and csurf.
  // Set it to something more secure.
  secret: String = "your-secret-here";

  // Configuration for the gcloud-node and googleapis libraries
  gcloud: any = {
    // This is the id of the project you created in Google Cloud.
    // e.g. https://console.developers.google.com/project/<projectId>
    projectId: "cloudprediction",
    // Path to the JSON key file you downloaded when you created the Service Account
    // credentials for your Google Cloud project.
    // See https://console.developers.google.com/project/<projectId>/apiui/credential
    keyFile: "../../cloudPredictionServiceAccount.json",
    // Datastore Namespace
    namespace: "LabelCat"
  };

  // Configuration for GitHub authentication
  twitter: any = {
    consumer_key: "0BtxpLJ1RlTtp1XL9LduRNezd",
    consumer_secret: "vjPJYDofLsmOmYw6izgFhgRThMtiwv15Hu1DDbqYJDoV491e7l",
    access_token_key: "17777662-IPtB8f69aLlJd0iFYZaWatM16uMOOXm6gdDRAJfbw",
    access_token_secret: "7ZhnZTgPD1naCgSmfrnfEaTHRrgIsEnJd4JlfeCUjERGo"
  };
};
