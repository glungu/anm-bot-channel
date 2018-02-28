var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var anm = require('./anm');
//var oracledb = require('oracledb');

// var requestSync = require('sync-request');

//var globalTunnel = require('global-tunnel');
//process.env.http_proxy = 'http://genproxy.amdocs.com:8080';
//process.env.https_proxy = 'https://genproxy.amdocs.com:8080';
//globalTunnel.initialize();
// globalTunnel.end();

var luisUrlPrefix = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";
var luisKey = "6abe6f0082814c1d9edc2ab97ff0ad30";
var luisAppID = "3482ee72-4216-44ed-877a-c6f25a70f294";
var luisStaging = "true";
var luisURL = process.env.LUIS_APP_URL || luisUrlPrefix + luisAppID + "?"
    + "subscription-key=" + luisKey + "&"
    + "staging=" + luisStaging;

var model = [
    {
        offerId: 0,
        offer: 'Unlimited internet access for just $29.99 per mounth!',
        details: '',
        show: false
    },
    {
        offerId: 1,
        offer: '2Gb per day for $2.99',
        details: '',
        show: true
    },
    {
        offerId: 2,
        offer: '2Gb per day for $2.99',
        details: '',
        show: true
    }
];

// var connection2 = oracledb.getConnection(
//     {
//         user: "anm3158dbg2",
//         password: "anm3158dbg2",
//         connectString: "jdbc:oracle:thin:@dbserv.corp.amdocs.com:1521:sid11r2"
//     },
//     function (err, connection) {
//         if (err) {
//             console.error(err);
//             return;
//         }
//         connection.execute(
//             "SELECT * "
//             + "FROM NM_BOT_RECORD "
//             + "WHERE department_id < 70 "
//             + "ORDER BY department_id",
//             function (err, result) {
//                 if (err) {
//                     console.error(err);
//                     return;
//                 }
//                 console.log(result.rows);
//             });
//     });


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
    function(session) {
        if (session.dialogData.location == null) {
            session.dialogData.location = {};
        }

        var msg = new builder.Message(session).attachments([
            new builder.HeroCard(session)
                .title('You have '+model.length+' offers.')
                .text("Would you like to see them? Please confirm")
                .buttons([
                    builder.CardAction.imBack(session, "Last", "See last"),
                    builder.CardAction.imBack(session, "All", "See all"),
                    builder.CardAction.imBack(session, "Ignore", "Ignore")
                ])
        ]);
        builder.Prompts.choice(session, msg, ["Last", "All", "Ignore"]);
    },
    function(session, results) {
        switch (results.response.entity) {
            case 'Last':
                session.beginDialog("AskLast");
                break;
            case 'All':
                session.beginDialog("AskAll");
                break;
            case 'Ignore':
                session.beginDialog("AskIgnore");
                break;
            default:
                session.send("Your intent is not clear to me...");
                resetSession(session);
                break;
        }
    }
]);

// bot.recognizer(new builder.LuisRecognizer(luisURL));

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

bot.dialog('Ignore', [
    function (session, args, next) {
        if (session.userData.intent) {
            session.send("No change was applied.");
        }
        resetSession(session);
    }
]).triggerAction({ matches: /(no|cancel)/i });


bot.dialog('AskLast', [
    function (session, args, next) {

        var lastOffer = model[model.length - 1];


        var msg = new builder.Message(session)
            .addAttachment({
                'contentType': 'application/vnd.microsoft.card.adaptive',
                'content': {
                    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type': 'AdaptiveCard',
                    'version': '1.0',
                    'body': [
                        {
                            'type': 'Container',
                            'items': [
                                {
                                    'type': 'ColumnSet',
                                    'columns': [
                                        {
                                            'type': 'Column',
                                            'size': 'auto',
                                            'items': [
                                                {
                                                    'type': 'Image',
                                                    'url': 'https://placeholdit.imgix.net/~text?txtsize=65&txt=Adaptive+Cards&w=300&h=300',
                                                    'size': 'medium',
                                                    'style': 'person'
                                                }
                                            ]
                                        },
                                        {
                                            'type': 'Column',
                                            'size': 'stretch',
                                            'items': [
                                                {
                                                    'type': 'TextBlock',
                                                    'text': 'Last offer',
                                                    'weight': 'bolder'
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': lastOffer.offer,
                                                    'wrap': true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    'actions': [
                        {
                            "type": "Action.Submit",
                            "title": "Buy",
                            "data": {
                                "type" : "Action.Buy"
                            }
                        },
                        {
                            "type": "Action.Submit",
                            "title": "Back",
                            "data": {
                                "type" : "Action.Back"
                            }
                        }

                    ]
                }
            });
        // var msg = new builder.Message(session).attachments([
        //
        //
        //     new builder.HeroCard(session)
        //         .title(lastOffer.offer)
        //         .text(" Please confirm")
        //         .buttons([
        //             builder.CardAction.imBack(session, "Action.Buy", "Buy"),
        //             builder.CardAction.imBack(session, "Action.Back", "Back")
        //         ])
        // ]);




        //
        builder.Prompts.choice(session, msg, ["Action.Buy", "Action.Back"]);

    },
    function (session, results) {
        switch (results.response.entity) {
            case 'Action.Buy':
                session.send("You successfully purchased package!");

                resetSession(session);
                break;
            default:
                resetSession(session);
                break;
        }
    }
]);


bot.dialog('AskAll', [
    function (session, args, next) {

        var lastOffer = model[model.length - 1];
        var cards = [];
        for (var i =0; i < model.length; i++){
            var model2 = model[i];
            cards.push(new builder.HeroCard(session)
                .title(model2.offer)
                .text(" Please confirm")
                .buttons([
                    builder.CardAction.imBack(session, 'offer_'+model2.offerId+'_buy', 'Buy'),
                    builder.CardAction.imBack(session, "Back", "Back")
                ]))
        }


        var msg = new builder.Message(session).attachments(cards);
        builder.Prompts.choice(session, msg, ["Buy", "Back"]);

    },
    function (session, results) {
        switch (results.response.entity) {
            case 'Buy':
                session.beginDialog("AskLast");
                break;
            default:
                resetSession(session);
                break;
        }
    }
]);



function resetSession(session) {
    session.userData = {};
    session.clearDialogStack();
    session.reset();
}
