/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request'),
  http = require('http'),
  parseString = require('xml2js').parseString,
  routes = require('./routes/index'),
  app = express();

var unirest = require('unirest');

//Bodyparser middleware
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json({ verify: verifyRequestSignature }));

//Setting port
app.set('port', process.env.PORT || 8000);

//Setting view engine
app.set('view engine', 'ejs');

//Set Public folder as static folder
app.use(express.static('public'));

//Use ./routes/index.js as routes root /
app.use('/', routes);

//Global variables
var numberOfPersons = 0;
var numberOfRooms = 0;
var arrivalDateDayCalculations = 0;
var arrivalDateMonthCalculations = 0;
var i = 0;
var stayRange = 0;
var departureDateSplitted = [];
var priceAllNightsEinzelzimmerSommerstein = 0;
var bookingLink = "";
var autoAnswerIsOn = true;
var a = {};
var b = "";
var c = "";
var ids = [];

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});


/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
//New test function -> beds24 API -> getDescriptions
function sendJSONRequestBeds24Descriptions(senderId){

    // JSON to be passed to the QPX Express API
    var requestData = {
        "roomId": "6027",
        "lang": "en"

    };

    // QPX REST API URL (I censored my api key)
    var url = "https://api.beds24.com/json/getDescriptions";

    // fire request
    request({
        url: url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        },
        body: JSON.stringify(requestData)
    },
    function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body);
            var responseString = JSON.stringify(response);
            console.log(response.toString());
            console.log(parseString(response));
            var length = 620;
            var trimmedResponse = responseString.substring(0, length);
            sendTextMessage(senderId, trimmedResponse);
        }
        else {
            console.log("error: " + error);
            console.log("response.statusCode: " + response.statusCode);
            console.log("response.statusText: " + response.statusText);
            console.log(JSON.stringify(response));
            console.log(response.toString());
            console.log(parseString(response));
        }
    });
}

//New test function -> new API -> getAvailabilities
function sendJSONRequestBeds24Availabilities(senderId){

    // JSON to be passed to the QPX Express API
    var requestData = {
        "checkIn": "20170901",
        "checkOut": "20170903",
        "propId": "36591",
        "numAdult": "2",
        "numChild": "0"
    };

    // QPX REST API URL (I censored my api key)
    var url = "https://api.beds24.com/json/getAvailabilities";

    // fire request
    request({
            url: url,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            body: JSON.stringify(requestData)
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
                var responseString = JSON.stringify(response);
                console.log(response.toString());
                console.log(parseString(response));
                var length = 620;
                var trimmedResponse = responseString.substring(0, length);
                sendTextMessage(senderId, trimmedResponse);
            }
            else {
                console.log("error: " + error);
                console.log("response.statusCode: " + response.statusCode);
                console.log("response.statusText: " + response.statusText);
                console.log(JSON.stringify(response));
                console.log(response.toString());
                console.log(parseString(response));
            }
        });
}

//New test function -> new API -> bookRoom
function sendJSONRequestBeds24BookRoom(senderId){

    // JSON to be passed to the QPX Express API
    var requestData = {
        "authentication": {
            "apiKey": "anton6789123456789",
            "propKey": "anton6789123456789"
        },
        "roomId": "12345",
        "unitId": "1",
        "roomQty": "1",
        "status": "1",
        "firstNight": "2014-10-01",
        "lastNight": "2014-10-01",
        "numAdult": "2",
        "numChild": "0",
        "guestTitle": "Mr",
        "guestFirstName": "Joe",
        "guestName": "Smith",
        "guestEmail": "joe@example.com",
        "guestPhone": "+123456789",
        "guestMobile": "09 87654321",
        "guestFax": "0123456",
        "guestAddress": "1 Big Street",
        "guestCity": "London",
        "guestPostcode": "EX 1234",
        "guestCountry": "United_Kingdom",
        "guestArrivalTime": "late, very late",
        "guestVoucher": "give me discount",
        "guestComments": "Non smoking please",
        "guestCardType": "VISA",
        "guestCardNumber": "0000000000000000",
        "guestCardName": "Mr Smith",
        "guestCardExpiry": "01\/17",
        "guestCardCVV": "000",
        "message": "text",
        "custom1": "text",
        "custom2": "text",
        "custom3": "text",
        "custom4": "text",
        "custom5": "text",
        "custom6": "text",
        "custom7": "text",
        "custom8": "text",
        "custom9": "text",
        "custom10": "text",
        "notes": "VIP",
        "flagColor": "ff0000",
        "flagText": "Show booking in red",
        "price": "100.00",
        "deposit": "10.00",
        "tax": "5.00",
        "commission": "15.00",
        "refererEditable": "online",
        "notifyUrl": "true",
        "notifyGuest": "false",
        "notifyHost": "false",
        "assignBooking": "false",
        "invoice": [
            {
                "description": "lodging",
                "status": "",
                "qty": "1",
                "price": "123.45",
                "vatRate": "10",
                "type": "0"
            }
        ],
        "infoItems": [
            {
                "code": "PAYMENT",
                "text": "Paid $100"
            }
        ]
    };

    // QPX REST API URL (I censored my api key)
    var url = "https://api.beds24.com/json/setBooking";

    // fire request
    request({
            url: url,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            body: JSON.stringify(requestData)
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
                var responseString = JSON.stringify(response);
                console.log(response.toString());
                console.log(parseString(response));
                var length = 620;
                var trimmedResponse = responseString.substring(0, length);
                sendTextMessage(senderId, trimmedResponse);
            }
            else {
                console.log("error: " + error);
                console.log("response.statusCode: " + response.statusCode);
                console.log("response.statusText: " + response.statusText);
                console.log(JSON.stringify(response));
                console.log(response.toString());
                console.log(parseString(response));
            }
        });
}

//New test function -> beds24 API -> getPropertyDescription
function sendJSONRequestBeds24PropDescr(senderId){

    // JSON to be passed to the QPX Express API
    var requestData = {
        "propId": "36591"
    };

    // QPX REST API URL (I censored my api key)
    var url = "https://api.beds24.com/json/getDescriptions";

    // fire request
    request({
            url: url,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            body: JSON.stringify(requestData)
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
                var responseString = JSON.stringify(response);
                console.log(response.toString());
                console.log(parseString(response));
                var length = 620;
                var trimmedResponse = responseString.substring(0, length);
                sendTextMessage(senderId, trimmedResponse);
            }
            else {
                console.log("error: " + error);
                console.log("response.statusCode: " + response.statusCode);
                console.log("response.statusText: " + response.statusText);
                console.log(JSON.stringify(response));
                console.log(response.toString());
                console.log(parseString(response));
            }
        });
}
*/



/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];
    console.log(signature);
  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature. Line 304 app.js // Callback from Facebook. If Server URL is not the same as webhook URL on facebook");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}


/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */


//Recieve authentication from wlanlandingpage when user click Send to messenger - Send data to mongoDB database.
function receivedAuthentication(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;

    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger'
    // plugin.
    var passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam,
        timeOfAuth);

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    sendTextMessage(senderID, "Sie haben sich erfolgreich angemeldet. Sie erhalten nun Neuigkeiten via Facebook Messenger von Ihrem Salzburger Hof Leogang team. Viel Spaß!");
    //Function initialised on line 651
    //exportSenderID(senderID);


    //https://stackoverflow.com/questions/5643321/how-to-make-remote-rest-call-inside-node-js-any-curl
    var buffer = "";
    var optionsget = {
        host: 'graph.facebook.com',
        port: 443,
        path: '/v2.6/' + senderID + '?fields=first_name,last_name,profile_pic,is_payment_enabled,locale,timezone,gender&access_token=' + pageAccessToken,
        method: 'GET'
    };

    console.info('Options prepared:');
    console.info(optionsget);
    console.info('Do the GET call');

    // do the GET request to retrieve data from the user's graph API
    var reqGet = https.request(optionsget, function (res) {
        console.log("statusCode: ", res.statusCode);
        // uncomment it for header details
        console.log("headers: ", res.headers);

        res.on('data', function (d) {
            console.info('GET result:\n');
            process.stdout.write(d);
            buffer += d;
            console.log(buffer);
            //parse buffer to JSON object
            a = JSON.parse(buffer);
            console.log("Data recieving from Send to messenger button" + a);
            console.log(a.first_name);
            //Additionally senderID is added to the Javascript object, which is saved to the MongoDB
            a["senderId"] = senderID;
            //User is a "angemeldeter Gast" and is able to recieve messages
            a["signed_up"] = true;
            a["signed_up_at"] = new Date();
            //Parse JSON object to JSON string
            b = JSON.stringify(a);
        });
    });
            // Build the post string from an object
            reqGet.end();
            reqGet.on('error', function (e) {
                console.error(e);

    });
    setTimeout(postNewUserToDB, 30000);
}


function postNewUserToDB() {
    console.log(b);
        // An object of options to indicate where to post to
        var post_options = {
            //Change URL to hotelmessengertagbag.herokuapp.com if deploying
            host: 'hotelmessengertagbag.herokuapp.com',
            port: '80',
            path: '/guests',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Set up the request
        var post_req = http.request(post_options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
        });

        // post the data
        post_req.write(b);
        post_req.end();
}


/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */


function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));
    console.log(quickReplyPayload);
    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;

    if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
        return;

    } else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",
            messageId, quickReplyPayload);
        //First question is how many persons are joining the requested stay.
    }

    if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.

        switch (messageText) {

            case 'Menü':
                break;

            case 'typing on':
                sendTypingOn(senderID);
                break;

            case 'typing off':
                sendTypingOff(senderID);
                break;

            case 'account linking':
                sendAccountLinking(senderID);
                break;

            case 'Zimmer Anfrage':
                sendPersonRequest(senderID);
                break;

            case 'Persönliche Beratung':
                sendPersonalFeedback(senderID);
                break;

            case "pay":
                sendPaymentButton(senderID);
                break;

            case "test1":
                sendJSONRequestBeds24Descriptions(senderID);
                break;

            case "test2":
                sendJSONRequestBeds24Availabilities(senderID);
                break;

            case "test3":
                sendJSONRequestBeds24BookRoom(senderID);
                break;

            case "test4":
                sendJSONRequestBeds24PropDescr(senderID);
                break;

            case "test5":
                foodAPIRequestExample(senderID);
                break;

            case "test6":
                foodAPIRecipeDetailRequest(senderID);
                break;

            case "get recipe":
                sendFirstRecipeQuestion(senderID);
                resetValues(inputCuisine, inputDiet, inputIntolerance, inputQuery, inputType);
                break;

            case "african":
            case "chinese":
            case "japanese":
            case "korean":
            case "vietnamese":
            case "thai":
            case "indian":
            case "british":
            case "french":
            case "italian":
            case "mexican":
            case "spanish":
            case "middle eastern":
            case "jewish":
            case "american":
            case "cajun":
            case "southern":
            case "greek":
            case "german":
            case "nordic":
            case "eastern european":
            case "caribbean":
            case "latin american":
                receiveInputCuisine(messageText);
                sendSecondRecipeQuestion(senderID);
                break;

            case "dairy":
            case "egg":
            case "gluten":
            case "peanut":
            case "sesame":
            case "seafood":
            case "shellfish":
            case "soy":
            case "sulfite":
            case "tree nut":
            case "wheat":
                recieveInputDiet(messageText);
                sendThirdRecipeQuestion(senderID);
                break;

            case "pescetarian":
            case "lacto vegetarian":
            case "ovo vegetarian":
            case "vegan":
            case "vegetarian":
            case "none":
                recieveInputIntolerances(messageText);
                sendFourthRecipeQuestion(senderID);
                break;

            case "main course":
            case "side dish":
            case "dessert":
            case "appetizer":
            case "salad":
            case "bread":
            case "breakfast":
            case "soup":
            case "beverage":
            case "sauce":
            case "drink":
                recieveInputTypes(messageText);
                sendFifthRecipeQuestion(senderID);
            break;

            default:
                recieveInputQuery(messageText);
                foodAPIRecipeRequest(senderID, inputCuisine, inputDiet, inputIntolerance, inputType, inputQuery);
            break;
            }
        }
}

var inputCuisine;
var inputDiet;
var inputIntolerance;
var inputQuery;
var inputType;


function receiveInputCuisine(messageText){
    inputCuisine = messageText
}

function recieveInputDiet(messageText){
    inputDiet = messageText
}

function recieveInputIntolerances(messageText){
    inputIntolerance = messageText
}

function recieveInputTypes(messageText){
    inputType = messageText.replace(/\W+/g, '+');
}

function recieveInputQuery(messageText){
    inputQuery = messageText;
}

function resetValues(inputCuisine, inputDiet, inputIntolerance, inputQuery, inputType){
    inputCuisine = "";
    inputDiet = "";
    inputIntolerance = "";
    inputQuery = "";
    inputType = "";
}


function sendFirstRecipeQuestion(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "The cuisine(s) of the recipes? For example: african, chinese, japanese, korean, vietnamese, thai, indian, british, irish, french, italian, mexican, spanish, middle eastern, jewish, american, cajun, southern, greek, german, nordic, eastern european, caribbean, or latin american.",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}


function sendSecondRecipeQuestion(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Any intolerances? All found recipes must not have ingredients that could cause problems for people with one of the given tolerances - For example: dairy, egg, gluten, peanut, sesame, seafood, shellfish, soy, sulfite, tree nut, and wheat",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}


function sendThirdRecipeQuestion(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Any diets? The diet to which the recipes must be compliant. Possible values are: pescetarian, lacto vegetarian, ovo vegetarian, vegan, and vegetarian.",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}

function sendFourthRecipeQuestion(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "The type of the recipes? One of the following: main course, side dish, dessert, appetizer, salad, bread, breakfast, soup, beverage, sauce, or drink.",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}

function sendFifthRecipeQuestion(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "So what kind of recipepy are looking for. Just write a keyword and we will search. For example: pork",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}



function foodAPIRecipeRequest(senderId, inputCuisine, inputDiet, inputIntolerance, inputType, inputQuery) {

    var imageUrlCombined = [];
    var title = [];
    var readyInMinutes = [];


    // These code snippets use an open-source library. http://unirest.io/nodejs
    // 'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?cuisine=italian&diet=vegetarian&excludeIngredients=coconut&instructionsRequired=false&intolerances=egg&limitLicense=false&number=10&offset=0&query=pasta&type=main+course'
    // "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?cuisine=italian&diet=vegetarian&excludeIngredients=coconut&instructionsRequired=false&intolerances=sesame&limitLicense=false&number=10&offset=0&query=pasta&type=main+course"
    console.log(senderId + inputCuisine + inputDiet + inputIntolerance + inputType + inputQuery);
    console.log("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?cuisine=" +
        inputCuisine +
        "&diet=" +
        inputDiet +
        "&excludeIngredients=coconut&instructionsRequired=true&intolerances=" +
        inputIntolerance + "&limitLicense=false&number=10&offset=0&query=" +
        inputQuery +
        "&type=" +
        inputType);

        unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?cuisine=" +
        inputCuisine +
        "&diet=" +
        inputDiet +
        "&excludeIngredients=coconut&instructionsRequired=true&intolerances=" +
        inputIntolerance +
        "&limitLicense=false&number=10&offset=0&query=" +
        inputQuery +
        "&type=" +
        inputType)
        .header("X-Mashape-Key", "M0WkYkVSuvmshQP7S6BBF9BdI3I5p1wSLh3jsnXUQkJCIBbL7d")
        .header("Accept", "application/json")
        .end(function (result) {
            console.log(result.status, result.headers, result.body);
            console.log("--------------------->>>>>>>>>>>>:" + JSON.stringify(result.body));
            for (var x = 0; x < result.body.results.length; x++) {
                var imageUrl = result.body.baseUri;
                ids.push(result.body.results[x].id);
                imageUrlCombined.push(imageUrl + result.body.results[x].imageUrls[0]);
                title.push(result.body.results[x].title);
                readyInMinutes.push("Ready in minutes:" + result.body.results[x].readyInMinutes);
                //sendTextMessage(senderId, title);
                //sendTextMessage(senderId, readyInMinutes);
                //sendImageMessage(senderId, imageUrlCombined);
                console.log(title[x]);
                console.log(imageUrlCombined[x]);
                console.log(readyInMinutes[x]);
            }
            console.log(title);
            console.log(imageUrlCombined);
            console.log(readyInMinutes);
            //sendQuickRequest(senderId, imageUrlCombined, title, readyInMinutes);
            sendGenericRequest(senderId, imageUrlCombined, title, readyInMinutes, ids);
            sendGenericRequest2(senderId, imageUrlCombined, title, readyInMinutes, ids);
            sendGenericRequest3(senderId, imageUrlCombined, title, readyInMinutes, ids);
        })
}

function foodAPIRecipeDetailRequest(senderId, id) {
// These code snippets use an open-source library. http://unirest.io/nodejs
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + id + "/information?includenutrition=false")
        .header("X-Mashape-Key", "M0WkYkVSuvmshQP7S6BBF9BdI3I5p1wSLh3jsnXUQkJCIBbL7d")
        .header("Accept", "application/json")
        .end(function (result) {
            console.log(result.status, result.headers, result.body);
            console.log("--------------------->>>>>>>>>>>>:" + JSON.stringify(result.body));
            for (var y = 0; y < result.body.extendedIngredients.length; y++) {
                var receiptDetail = JSON.stringify(result.body.extendedIngredients[y]);
                sendTextMessage(senderId, receiptDetail);
            }
            for (var z = 0; z < result.body.analyzedInstructions[0].steps.length; z++) {
                var instructionStepsDetail = JSON.stringify(result.body.analyzedInstructions[0].steps[z]);
                var instructionStepsDetailTrimmed = instructionStepsDetail.substring(0, 620);
                sendTextMessage(senderId, instructionStepsDetailTrimmed);
            }
                    //var fullInfo = receiptDetail + instructionStepsDetail;
                    //sendTextMessage(senderId, JSON.stringify(result.body.analyzedInstructions[0].steps[z]));
        });
}





/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;
    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;
    //console.log(messageData.message.attachment.payload.elements[0].title);
    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
   if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[0]) {
       foodAPIRecipeDetailRequest(senderID, ids[0])
   }
   else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[1]) {
       foodAPIRecipeDetailRequest(senderID, ids[1])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[2]) {
       foodAPIRecipeDetailRequest(senderID, ids[2])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[3]) {
       foodAPIRecipeDetailRequest(senderID, ids[3])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[4]) {
       foodAPIRecipeDetailRequest(senderID, ids[4])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[5]) {
       foodAPIRecipeDetailRequest(senderID, ids[5])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[6]) {
       foodAPIRecipeDetailRequest(senderID, ids[6])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[7]) {
       foodAPIRecipeDetailRequest(senderID, ids[7])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[8]) {
       foodAPIRecipeDetailRequest(senderID, ids[8])
   } else if (payload === "DEVELOPER_DEFINED_PAYLOAD-" + ids[9]) {
       foodAPIRecipeDetailRequest(senderID, ids[9])
   }
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */

function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}
//Employee will soon take care of users request

function sendPersonalFeedback(recipientId) {

    autoAnswerIsOn = false;

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Es wird sich ehestmöglich einer unserer Mitarbeiter um Ihre Anfrage kümmern.",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}

function sendImageMessage(recipientId, imageUrl) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: imageUrl
                }
            }
        }
    };

    callSendAPI(messageData);
}

function sendQuickRequest(recipientId, imageUrlCombined, title, readyInMinutes) {

    var messageData = {
        recipient: {
            id: recipientId
        },
                  message: {
                      "text": "choose recipe",
                      "quick_replies":[
                          {
                              "content_type":"text",
                              "title": title[0] + readyInMinutes[0],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[0]
                          },
                          {
                              "content_type":"text",
                              "title": title[1] + readyInMinutes[1],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[1]
                          },
                          {
                              "content_type":"text",
                              "title": title[2] + readyInMinutes[2],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[2]
                          },
                          {
                              "content_type":"text",
                              "title": title[3] + readyInMinutes[3],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[3]
                          },
                          {
                              "content_type":"text",
                              "title": title[4] + readyInMinutes[4],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[4]
                          },
                          {
                              "content_type":"text",
                              "title": title[5] + readyInMinutes[5],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[5]
                          },
                          {
                              "content_type":"text",
                              "title": title[6] + readyInMinutes[6],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[6]
                          },
                          {
                              "content_type":"text",
                              "title": title[7] + readyInMinutes[7],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[7]
                          },
                          {
                              "content_type":"text",
                              "title": title[8] + readyInMinutes[8],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[8]
                          },
                          {
                              "content_type":"text",
                              "title": title[9] + readyInMinutes[9],
                              "payload":"1 person",
                              "image_url": imageUrlCombined[9]
                          }


                      ]
                  }
              };

    callSendAPI(messageData);
}

function sendGenericRequest(recipientId, imageUrlCombined, title, readyInMinutes, ids) {

    var messageData = {
        "recipient": {
            "id": recipientId
        },
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": title[0] + readyInMinutes[0],
                            "image_url": imageUrlCombined[0],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[0]
                                }
                            ]
                        },
                        {
                            "title": title[1] + readyInMinutes[1],
                            "image_url": imageUrlCombined[1],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[1]
                                }
                            ]
                        },
                        {
                            "title": title[2] + readyInMinutes[2],
                            "image_url": imageUrlCombined[2],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[2]
                                }
                            ]
                        },
                        {
                            "title": title[3] + readyInMinutes[3],
                            "image_url": imageUrlCombined[3],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[3]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
    callSendAPI(messageData);
}

function sendGenericRequest2(recipientId, imageUrlCombined, title, readyInMinutes, ids) {

    var messageData = {
        "recipient": {
            "id": recipientId
        },
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": title[4] + readyInMinutes[4],
                            "image_url": imageUrlCombined[4],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[4]
                                }
                            ]
                        },
                        {
                            "title": title[5] + readyInMinutes[5],
                            "image_url": imageUrlCombined[5],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[5]
                                }
                            ]
                        },
                        {
                            "title": title[6] + readyInMinutes[6],
                            "image_url": imageUrlCombined[6],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[6]
                                }
                            ]
                        },
                        {
                            "title": title[7] + readyInMinutes[7],
                            "image_url": imageUrlCombined[7],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[7]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
    callSendAPI(messageData);
}

function sendGenericRequest3(recipientId, imageUrlCombined, title, readyInMinutes, ids) {

    var messageData = {
        "recipient": {
            "id": recipientId
        },
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": title[8] + readyInMinutes[8],
                            "image_url": imageUrlCombined[8],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[8]
                                }
                            ]
                        },
                        {
                            "title": title[9] + readyInMinutes[9],
                            "image_url": imageUrlCombined[9],
                            "subtitle": "We\'ve got the right hat for everyone.",
                            "default_action": {
                                "type": "web_url",
                                "url": "https://servicio.io",
                                "messenger_extensions": true,
                                "webview_height_ratio": "tall",
                                "fallback_url": "https://servicio.io"
                            },
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Checkout recipe",
                                    "payload": "DEVELOPER_DEFINED_PAYLOAD-" + ids[9]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
    callSendAPI(messageData);
}


//Send Payment button
function sendPaymentButton(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",

                    elements: [
                        {
                            title: String(numberOfRooms) + " Einzelzimmer Sommerstein | Von " + arrivalDateDayCalculations + "." + arrivalDateMonthCalculations + ".2017 bis " + departureDateSplitted[2] + "." + departureDateSplitted[1] + ".2017 | " + stayRange + " Übernachtung/en",
                            subtitle: String(priceAllNightsEinzelzimmerSommerstein) + ",00 EUR | Preis ist kalkuliert für " + (numberOfPersons) + " Erwachsenen ",
                            item_url: bookingLink,
                            image_url: "https://gettagbag.com/wp-content/uploads/2017/04/Einzelzimmer-Sommerstein1-1.9.png",
                            "buttons":[
                                {
                                    "type":"payment",
                                    "title":"buy",
                                    "payload":"DEVELOPER_DEFINED_PAYLOAD",
                                    "payment_summary":{
                                        "currency":"USD",
                                        "payment_type":"FIXED_AMOUNT",
                                        "is_test_payment" : true,
                                        "merchant_name":"Peter's Apparel",
                                        "requested_user_info":[
                                            "shipping_address",
                                            "contact_name",
                                            "contact_phone",
                                            "contact_email"
                                        ],
                                        "price_list":[
                                            {
                                                "label":"Subtotal",
                                                "amount":"29.99"
                                            },
                                            {
                                                "label":"Taxes",
                                                "amount":"2.47"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        }
    };

    callSendAPI(messageData);
}


function sendWelcomeMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Hallo & Willkommen beim Chatbot vom Hotel Salzburger Hof Leogang - #homeofsports. Wollen Sie eine Zimmer Anfrage erstellen, oder persönlich beraten werden? Schreiben Sie oder wählen Sie aus.",
                    buttons:[ {
                        type: "postback",
                        title: "Zimmer Anfrage",
                        payload: "Zimmer Anfrage"
                    }, {
                        type: "postback",
                        title: "Persönliche Beratung",
                        payload: "personal"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

function sendMenu(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Menü - Wollen Sie eine Zimmer Anfrage erstellen, oder persönlich beraten werden? Schreiben Sie oder wählen Sie aus.",
                    buttons:[ {
                        type: "postback",
                        title: "Zimmer Anfrage",
                        payload: "Zimmer Anfrage"
                    }, {
                        type: "postback",
                        title: "Persönliche Beratung",
                        payload: "personal"
                    } ]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
    console.log("SEND API CALLLED <------------");
    console.log("Recipient ID: top " + messageData.recipient.id);
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            console.log("Recipient ID:" + recipientId);
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
          //senderIDTransfer.splice((0), senderIDTransfer.length);
          //senderIDTransfer.push(recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s",
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error, messageData.recipient.id);
      }
    });
}

/*
//Send update to REST-ful API in index.js if signed-out, change signed-up field to false
function updateDB(){
    console.log("updateDB function called" + c);

     // An object of options to indicate where to post to
     var put_options = {
        //Change URL to hotelmessengertagbag.herokuapp.com if deploying
        host: 'hotelmessengertagbag.herokuapp.com',
        port: '80',
        path: '/guests',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
     };

     // Set up the request
     var put_req = http.request(put_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
     });

     // post the data
     put_req.write(c);
     put_req.end();
}

exports.callSendAPI = callSendAPI;
*/
// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// app.listen(8000, function () {
//   console.log('Example app listening on port 8000!');
// });

module.exports = app;