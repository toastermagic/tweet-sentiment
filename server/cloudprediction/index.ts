"use strict";

export class CloudPredictor {

  constructor(prom: any, private config: any, private container: any) {
    this.config = config;
  }

  /**
   * Return the analysis of the trained model with the given id.
   *
   * @param {number} id - The id of the model analysis to retrieve.
   */
  public analyzeModelById(id: String) {
    return this.execute("analyze", { id });
  }

  /**
   * Return the trained model with the given id.
   *
   * @param {number} id - The id of the model to retrieve.
   */
  public getModelById(id: String) {
    return this.execute("get", { id });
  }

  /**
   * Destroy model with the given id.
   *
   * @param {number} id - The id of the model to destroy.
   */
  public destroyModelById(id: String) {
    return this.execute("delete", { id });
  }

  /**
   * Train the model with the given id and the provided examples.
   *
   * @param {number} id - The id of the model to train.
   * @param {array} examples - The examples with which to train the model.
   */
  public trainModel(id: String, examples: any[]) {
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
  public updateModel(id: String, csvInstance: string, output: string) {
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
  public predict(id: String, example: any) {
    return this.execute("predict", {
      id,
      resource: {
        input: {
          csvInstance: example.csvInstance
        }
      }
    });
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
    let jwtClient = this.container.get("jwtClient");
    return jwtClient.authorizeAsync().then(() => {
      params.auth = jwtClient;
      params.project = this.config.gcloud.projectId;
      return this.container.get("trainedModelsApi")[`${method}Async`](params);
    });
  }
}
