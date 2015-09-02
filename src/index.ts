/// <reference path="../typings/tsd"/>
/// <reference path="./aws-lambda"/>
require("es6-shim")
import http = require("http");
import util = require("util");
import Q = require("q");
import AWS = require("aws-sdk");
import request = require("request-promise");

type S3Client = AWS.s3.Client

interface Reason {
    cause: any
    error: any
    statusCode: string
    options: request.Options
    response: http.ServerResponse
}

module.exports.intercomUserSync = function intercomUserSync(event: Lambda.IntercomUserSyncEvent, context: Lambda.Context) {
    if(!isParams(event)){
      context.fail("Invalid request body")
      return
    }

    var s3: S3Client = <any>new AWS.S3()

    getConfig(s3)
        .then(v => validateRequest(v, event))
        .then(v => syncIntercomUser(v, event))
        .fail(e => context.fail(e))
        .done(v => context.succeed(v))
}


function validateRequest(cfg: Config, event: Lambda.IntercomUserSyncEvent): Q.Promise<Config> {
  if(cfg.secret !== event.secret){
    return Q.reject<Config>("Invalid request signature.")
  }
  return Q.when(cfg)
}

function syncIntercomUser(cfg: Config, event: Lambda.IntercomUserSyncEvent): Q.Promise<any> {
    if (!event.email) {
        return Q.reject("email is required")
    }

    console.log("Looking for intercom user by email: %s", event.email)
    return findIntercomUserByEmail().then(user => {
        if (user) {
            console.log("User already exists. Exising now")
            return Q.resolve(null)
        }
        // Далее необходимо создать пользователя в интерком c заданными параметрами
        console.log("Registering new Intercom user")
        return createNewIntercomUser().then(user => {
            if (event.tags && event.tags.length) {
                console.log("Tagging user")
                return tagUser(user)
            }
        })
    })


    // ---------------------
    function tagUser(user: Intercom.User): Q.Promise<any> {
        var tags = event.tags.split('|').filter(v => v.length != 0)
        var chain = tags.reduce((o, v) => o.thenResolve(v).then(addTagToUser), Q.when())
        // Запускаем цепь создания тэгов
        return chain.then(v => null)

        function addTagToUser(tagName): Q.Promise<any> {
            console.log("- %s", tagName)

            var opts: request.Options = {
                uri: "https://api.intercom.io/tags",
                method: "POST",
                auth: {
                    user: cfg.intercom.appId,
                    pass: cfg.intercom.apiKey
                },
                body: <Intercom.User>{
                    name: tagName,
                    users: [
                      { id: user.id }
                    ]
                },
                json: true,
                simple: true
            }

            return Q.when(request(opts)).fail((e: Reason) => {
                console.log("Error: Unable to call POST https://api.intercom.io/tags: %s", e.cause)
                return Q.reject(e.cause)
            })
        }
    }


    // ---------------------
    function createNewIntercomUser(): Q.Promise<Intercom.User> {
        var opts: request.Options = {
            uri: "https://api.intercom.io/users",
            method: "POST",
            auth: {
                user: cfg.intercom.appId,
                pass: cfg.intercom.apiKey
            },
            body: <Intercom.User>{
                name: event.name || "",
                email: event.email
            },
            json: true,
            simple: true
        }

        return Q.when(request(opts)).fail((e: Reason) => {
            console.log("Error: Unable to call POST https://api.intercom.io/users: %s", e.cause)
            return Q.reject(e.cause)
        })
    }

    // ---------------------
    function findIntercomUserByEmail(): Q.Promise<Intercom.User> {
        var opts: request.Options = {
            uri: "https://api.intercom.io/users",
            method: "GET",
            auth: {
                user: cfg.intercom.appId,
                pass: cfg.intercom.apiKey
            },
            qs: {
                email: event.email
            },
            json: true,
            resolveWithFullResponse: true
        }

        return Q.when(request(opts)).then((v: any) => v.body).fail((e: Reason) => {
            if (e.cause) {
                console.log("Error: Unable to call GET https://api.intercom.io/users: %s", e.cause)
                return Q.reject(e.cause)
            }

            // Отсутствие пользователя не является ошибкой
            if (~~e.statusCode === 404 && e.error.errors[0].code == "not_found") {
                return Q.resolve(null)
            }

            // Наличине нескольких пользователей с одним email не обрабатывается
            if (~~e.statusCode === 400 && e.error.errors[0].code == "conflict") {
                console.log("Error: Multiple users exists")
                return Q.reject(e.error.errors[0].message)
            }

            // Так же как и не обрабатываются другие ошибки
            console.log("Error: %j", e.error)
            return Q.reject(null)
        })
    }
}

function isParams(v): boolean {
  var tv: Lambda.IntercomUserSyncEvent = v
  if(typeof tv !== "object") return false
  if(typeof tv.secret !== "string") return false
  if(typeof tv.email !== "string") return false
  if(tv.tags != null){
    if(typeof tv.tags !== "string") return false
  }
  return true
}

/**
 * Read configuration file
 */
function getConfig(s3: S3Client): Q.Promise<Config> {
    var params: AWS.s3.GetObjectRequest = {
        Bucket: "medesk-lambdas",
        Key: "config.json"
    }

    return Q.ninvoke<any>(s3, "getObject", params).then(v => {
        var body: Buffer = v.Body
        return Q.when(JSON.parse(body.toString()))
    })
}
