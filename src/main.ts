/// <reference path="../typings/tsd"/>
/// <reference path="./aws-lambda"/>

import AWS = require("aws-sdk");
import Q = require("q")

module.exports = handler


function handler(event: Lambda.Event, context: Lambda.Context) {
    context.done()
    AWS.config
    Q.when()
    console.log("df")
    throw new Error("Not implemented yet");
}
