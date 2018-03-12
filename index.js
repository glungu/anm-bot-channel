var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var anm = require('./anm');

// var globalTunnel = require('global-tunnel');
// process.env.http_proxy = 'http://genproxy.amdocs.com:8080';
// process.env.https_proxy = 'https://genproxy.amdocs.com:8080';
// globalTunnel.initialize();
// globalTunnel.end();


var model = [];
var currentUser = "0";
const SOLD_STATE = "SOLD";
const IGNORED_STATE = "IGNORED";
const sms_png = "file:/" + __dirname + "/images/sms-128_1.png";
const call_png = "file:/" + __dirname + "/images/call-128.png";
const data_png = "file:/" + __dirname + "/images/data-128.png";

// buttons
const BUTTON_BACK_TO_MAIN_MENU = "Back to main menu";
const BUTTON_BACK_TO_ALL_OFFERS = "Back to all offers";


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Create bot
var bot = new builder.UniversalBot(connector, [
    function (session) {
        if (session.dialogData.location === null) {
            session.dialogData.location = {};
        }
        session.beginDialog("Start");
    }
]);


// Send welcome when conversation with bot is started, by initiating the root dialog
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

bot.dialog('Start', [
        function (session, args, next) {
            model = anm.getOffers(currentUser);
            var buttons = [];
            var choice = [];
            if (model.length > 0) {
                if (model.length > 1) {
                    buttons.push(builder.CardAction.imBack(session, "Last", "See last"));
                    buttons.push(builder.CardAction.imBack(session, "All", "See all"));
                    buttons.push(builder.CardAction.imBack(session, "Ignore all", "Ignore all"));
                    choice = ["Last", "All", "Ignore all"];
                } else {
                    buttons.push(builder.CardAction.imBack(session, "Last", "See"));
                    buttons.push(builder.CardAction.imBack(session, "Ignore all", "Ignore"));
                    choice = ["Last", "Ignore all"]
                }


                var msg = new builder.Message(session).attachments([
                    new builder.HeroCard(session)
                        .title('You have ' + model.length + ' offers.')
                        .text("Would you like to see them? Please confirm")
                        .buttons(buttons)
                ]);

                builder.Prompts.choice(session, msg, choice);
            } else {
                session.endDialog('You have no current offers. Please come back later!');
            }
        },
        function (session, results) {
            console.log("MAIN CALLBACK");
            switch (results.response.entity) {
                case 'Last':
                    session.beginDialog("AskLast");
                    break;
                case 'All':
                    session.beginDialog("AskAll");
                    break;
                case 'Ignore all':
                    anm.ignoreAllOffer(currentUser);
                    resetSession(session);
                    break;
                default:
                    session.send("Your intent is not clear to me...");
                    resetSession(session);
                    break;
            }
        }
    ]
);


bot.dialog('afterBuy', [
    function (session, args, next) {
        var thumbnailCard = new builder.HeroCard(session)
            .title("You successfully purchased package!")
            //.text("You successfully purchased package!")
            .buttons([
                builder.CardAction.imBack(session, BUTTON_BACK_TO_MAIN_MENU, BUTTON_BACK_TO_MAIN_MENU)
            ]);

        var msg = new builder.Message(session).attachments([thumbnailCard]);
        builder.Prompts.choice(session, msg, [BUTTON_BACK_TO_MAIN_MENU]);

    }, function (session, results, value) {
        resetSession(session);
    }
]);

bot.dialog('afterBuyAll', [
    function (session, args, next) {

        var buttons = [];
        var choice = [];
        buttons.push(builder.CardAction.imBack(session, BUTTON_BACK_TO_MAIN_MENU, BUTTON_BACK_TO_MAIN_MENU));
        choice.push(BUTTON_BACK_TO_MAIN_MENU);
        if (model.length > 0) {
            buttons.push(builder.CardAction.imBack(session, BUTTON_BACK_TO_ALL_OFFERS, BUTTON_BACK_TO_ALL_OFFERS));
            choice.push(BUTTON_BACK_TO_ALL_OFFERS)
        }

        var thumbnailCard = new builder.HeroCard(session)
            .title("You successfully purchased package!")
            //.text("You successfully purchased package!")
            .buttons(buttons);

        var msg = new builder.Message(session).attachments([thumbnailCard]);
        builder.Prompts.choice(session, msg, choice);

    }, function (session, results, value) {
        if (results.response.entity) {
            switch (results.response.entity) {
                case  BUTTON_BACK_TO_ALL_OFFERS:
                    session.beginDialog("AskAll");
                    break;
                default:
                    resetSession(session);
            }
        }
    }
]);


bot.dialog('AskLast', [
    function (session, args, next) {
        var lastOffer = model[model.length - 1];
        var thumbnailCard = new builder.ThumbnailCard(session)
            .title('Offer')
            .subtitle(lastOffer.offer)
            .text(lastOffer.description)
            .images([
                builder.CardImage.create(session, getImgByType(lastOffer))
            ])
            .buttons([
                builder.CardAction.imBack(session, 'Buy', 'Buy'),
                builder.CardAction.imBack(session, 'Ignore', 'Ignore'),
                builder.CardAction.imBack(session, 'Back', 'Back')
            ]);

        var msg = new builder.Message(session).attachments([thumbnailCard]);
        builder.Prompts.choice(session, msg, ["Buy", "Ignore", "Back"]);

    }, function (session, results, value) {
        var lastOffer = model[model.length - 1];
        if (results.response.entity) {
            switch (results.response.entity) {
                case  'Buy':
                    anm.changeStateOffer(lastOffer.offerId, SOLD_STATE);
                    session.beginDialog("afterBuy");
                    break;
                case  'Ignore':
                    anm.changeStateOffer(lastOffer.offerId, IGNORED_STATE);
                    resetSession(session);
                    break;
                default:
                    resetSession(session);
            }
        }
    }
]);

bot.dialog('AskAll', [
    function (session, args, next) {
        generateAllOffersMsg(session, model);

    }, function (session, results) {
        var entity = results.response.entity;
        if (entity) {
            var number = entity.indexOf("=");
            var offerId = entity.substring(number + 2, entity.length);
            var offer = findOfferById(offerId);

            if (entity.indexOf("Buy") > -1) {
                anm.changeStateOffer(offer.offerId, SOLD_STATE);
                model = anm.getOffers(currentUser);
                session.beginDialog("afterBuyAll");
            } else if (entity.indexOf("Ignore") > -1) {
                anm.changeStateOffer(offer.offerId, IGNORED_STATE);
                model = anm.getOffers(currentUser);
                if (model.length > 0) {
                    session.beginDialog("AskAll");
                } else {
                    resetSession(session);
                }
            } else {
                resetSession(session);
            }
        }
    }
]);

function findOfferById(id) {
    var result;
    for (var i = 0; i < model.length; i++) {
        if (model[i].offerId === id) {
            result = model[i];
        }
    }
    return result;
}

function generateAllOffersMsg(session, model) {
    var cards = [];
    var choice = [];
    for (var i = 0; i < model.length; i++) {
        var actionBuy = 'Buy offer with id = ' + model[i].offerId;
        var actionIgnore = 'Ignore offer with id = ' + model[i].offerId;
        var buttons = [];
        buttons.push(builder.CardAction.imBack(session, actionBuy, 'Buy'));
        if (model[i].url !== null && model[i].url !== '') {
            buttons.push(builder.CardAction.openUrl(session, model[i].url, 'Learn More'));
        }
        buttons.push(builder.CardAction.imBack(session, actionIgnore, 'Ignore'));


        cards.push(new builder.ThumbnailCard(session)
            .title('Offer')
            .subtitle(model[i].offer)
            .text(model[i].description)
            .images([
                builder.CardImage.create(session, getImgByType(model[i]))
            ])
            .buttons(buttons)
        );
        choice.push(actionBuy);
        choice.push(actionIgnore);
    }

    var msg = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);

    var messageToBack = new builder.Message(session).attachments([
        new builder.HeroCard(session)
            .buttons([builder.CardAction.imBack(session, BUTTON_BACK_TO_MAIN_MENU, BUTTON_BACK_TO_MAIN_MENU)])
    ]);

    choice.push(BUTTON_BACK_TO_MAIN_MENU);
    builder.Prompts.choice(session, msg, choice);

    session.send(messageToBack);

}

function getImgByType(offer) {
    switch (offer.type) {
        case 'call':
            return call_png;
            break;
        case  'sms':
            return sms_png;
            break;
        case 'data':
            return data_png;
            break;
        default:
            return "";
    }
}


function resetSession(session) {
    console.log("!!! resetSession ");
    session.userData = {};
    session.clearDialogStack();
    session.reset();
}
