/*
Pre-requisites:
npm install sync-request
*/
var request = require('sync-request');
var restApiUrl = "http://10.50.3.68:21757/chat-bot-rest-api/api/chat-bot";


function getOffers(userId) {

    var response = request('GET', process.env.ANM_URL + "/offers/"+userId, {});

    if (response.statusCode === 200) {
        var model =  JSON.parse(response.getBody('utf8'));
        console.log("response = " +  model);
        return model;
    }
    return null;
}

function changeStateOffer(offerid, state) {
    var response = request('GET', process.env.ANM_URL + "/offer/update/"+offerid+"/" + state, {});
    if (response.statusCode === 200) {
        console.log(response.getBody());
        return true;
    } else {
        console.error(response.getBody())
    }
    return false;
}

function ignoreAllOffer(userId) {
    var response = request('GET', process.env.ANM_URL + "/offer/ignore-all/"+userId, {});
    if (response.statusCode === 200) {
        console.log(response.getBody());
        return true;
    } else {
        console.error(response.getBody())
    }
    return false;
}

module.exports.getOffers = getOffers;
module.exports.ignoreAllOffer = ignoreAllOffer;
module.exports.changeStateOffer = changeStateOffer;
