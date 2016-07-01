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

let google = require("googleapis");

export class CloudPredictor {
  trainedmodels: any = google.prediction("v1.6").trainedmodels;

  constructor(prom: any, private config: any, private container: any) {
    this.config = config;
  }

  /**
   * Authorize and execute the specified Prediction API method.
   *
   * @private
   *
   * @param {string} method - The name of the Prediction API method to execute.
   * @param {object} params - Params to pass to the Prediction API.
   */
  private execute(method: String, params: any) {
    //  TODO: Does this authorization need to be done on every call?
    let jwtClient = this.container.get("jwtClient");
    var self = this;
    return jwtClient.authorizeAsync().then(() => {
      params.auth = jwtClient;
      params.project = this.config.gcloud.projectId;
      return this.container.get("trainedModelsApi")[`${method}Async`](params);
    });
  }

  /**
   * Return the analysis of the trained model with the given id.
   *
   * @param {number} id - The id of the model analysis to retrieve.
   */
  analyzeModelById(id: String) {
    return this.execute("analyze", {
      id
    });
  }

  /**
   * Return the trained model with the given id.
   *
   * @param {number} id - The id of the model to retrieve.
   */
  getModelById(id: String) {
    return this.execute("get", {
      id
    });
  }

  /**
   * Destroy model with the given id.
   *
   * @param {number} id - The id of the model to destroy.
   */
  destroyModelById(id: String) {
    return this.execute("delete", {
      id
    });
  }

  /**
   * Train the model with the given id and the provided examples.
   *
   * @param {number} id - The id of the model to train.
   * @param {array} examples - The examples with which to train the model.
   */
  trainModel(id: String, examples: any[]) {
    return this.execute("insert", {
      resource: {
        id,
        modelType: "classification",
        trainingInstances: examples
      }
    });
  }

  /**
   * Update the model with the given id and the provided examples.
   *
   * @param {string} id - The id of the model to train.
   * @param {array} examples - The examples with which to train the model.
   */
  updateModel(id: String, csvInstance: string, output: string) {
    return this.execute("update", {
      id,
      resource: {
        csvInstance: [csvInstance],
        output
      }
    });
  }

  /**
   * Predict a class for the given example using the model with the provided id.
   *
   * @param {number} id - The id of the model to train.
   * @param {obejct} example - The example for which to predict a class.
   */
  predict(id: String, example: any) {
    return this.execute("predict", {
      id,
      resource: {
        input: {
          csvInstance: example.csvInstance
        }
      }
    });
  }
}