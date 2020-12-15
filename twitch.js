/**
 * http://usejsdoc.org/
 */
const persist = require('./persist.js');
const https = require('https');
const request = require('request');
var twitch;
var stream = {};
var index = 0;
const clientId = '126b8ov4yi1sfvpb87xxf9suy94841';
const secretId = 'fewrtoh6l5xhyomm9u6xcof376jh9s';

function sendChannels(channels, data) {
    channels.send({
        embed: {
            color: 0x009900,
            author: {
                name: data.user_name + " is now streaming !",
                icon_url: "https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png"
            },
            title: "https://twitch.tv/" + data.channel_name,
            url: "https://twitch.tv/" + data.channel_name,
            timestamp: data.started_at,
            thumbnail: {
                url: data.thumbnail_url.replace("{height}", "80").replace("{width}", "80"),
            },
            fields: [{
                name: "Playing",
                value: data.game_id
            }, {
                name: "Title",
                value: data.title
            }],
            footer: {
                text: "stream online"
            }
        }
    });
}

module.exports = {
    refresh: function (client) {
        var servers = [];
        persist.db.collection('server').get().then(snapshot => {
            snapshot.forEach((doc) => {
                if (doc.data().active) {
                    servers.push(doc.id);
                }
            });
        }).then(() => {
            servers.forEach(serv => {
                var twitch_serv_info = {}
                persist.db.collection('server').doc(serv).collection('twitch').get().then(snapshot => {
                    snapshot.forEach(doc => {
                        twitch_serv_info[doc.id] = doc.data();
                    })
                    module.exports.refresh_server(client, twitch_serv_info);
                })
            })
        });
    },
    refresh_server: function (client, twitch_info) {
        twitch = {
            "stream": {},
            "option": twitch_info.option,
            "list": twitch_info.list.streamers
        };

        refreshed_counter = 0;

        if (twitch.list === undefined) {
            twitch.list = [];
        }
        var name = twitch.list[index++];
        if (index >= twitch.list.length) {
            index = 0;
        }
        var twitch_option = {
            url: "https://api.twitch.tv/helix/streams?user_login=" + name,
            method: 'GET',
            headers: {
                'Client-ID': clientId
            },
            json: true,
        };
        var twitch_token_option = {
            url: `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretId}&grant_type=client_credentials`,
            method: 'POST',
            json: true,
        };

        request(twitch_token_option, function (err, res, body) {
            if (err) console.log(err)
            else {
                const tk = body.access_token;
                twitch_option.headers['Authorization'] = 'Bearer ' + tk;

                request(twitch_option, function (err, res, body) {
                    if (err) console.log(err)
                    var streamer = {
                        "response": "",
                        "update_time": "",
                        "refreshed": ""
                    };
                    streamer.response = body;
                    streamer.update_time = new Date().toString();
                    if (body.data === undefined) {
                        console.log("invalid data");
                        return console.log(body);
                    }

                    if (stream[name] !== undefined) {
                        if (stream[name].refreshed === true) {
                            streamer.refreshed = true;
                        } else {
                            streamer.refreshed = false;
                        }
                    } else {
                        streamer.refreshed = false;
                    }
                    stream[name] = streamer;

                    if (body.data.length !== 0) {
                        var stream_data = body.data[0];
                        stream_data.channel_name = name;

                        if (stream[name].refreshed === false) {
                            stream[name].refreshed = true;
                            channel = twitch.option.channel;
                            var guild = client.guilds.cache.find(g => g.id == twitch.option.guild);
                            if (!guild) {
                                return console.log("invalid guild");
                            }
                            var channels = guild.channels.find(C => C.id == channel);
                            if (!channels) {
                                return console.log("invalid channel");
                            }
                            console.log(new Date().toString());

                            if (stream_data.title === "") {
                                stream_data.title = "...";
                            }
                            if (stream_data.game_id === "") {
                                stream_data.game_id = "...";
                                sendChannels(channels, stream_data)
                            } else {
                                const twitch_game_call_opt = {
                                    url: "https://api.twitch.tv/helix/games?id=" + stream_data.game_id,
                                    method: 'GET',
                                    headers: twitch_option.headers,
                                    json: true
                                }
                                request(twitch_game_call_opt, function (err, res, body) {
                                    if (err) console.log(err);
                                    else {
                                        stream_data.game_id = body.data[0].name;
                                        sendChannels(channels, stream_data)
                                    }
                                })
                            }
                        }
                    } else {
                        stream[name].refreshed = false;
                        // ret_value = false; // ollrek: ça a l'air de servir à rien mais dans le doute je suppr pas vous le ferez si vous savez
                    }
                });
            }
        });
        if (stream[name] !== undefined)
            return stream[name].refreshed;
    },

    stream_command: function (msg, args) {
        var cmd = args[0];

        switch (cmd) {
            case "help":
                msg.channel.send("**!stream add channel** : ajoute le channel twitch à la liste de notification\n" +
                    "**!stream channel #channel** : change le channel discord de notification\n" +
                    "**!stream remove channel** : supprime un channel twitch de la liste de notification\n" +
                    "**!stream list** : liste les channel enregistré");
                break;
            case "add":
                var streamer = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                var twitch_option = {
                    host: "api.twitch.tv",
                    path: "/kraken/channels/" + streamer + "?client_id=qxihlu11ef6gpohfhqb9b27d40u6lj",
                    method: "GET"
                };
                var req = https.request(twitch_option, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (raw) {
                        raw = JSON.parse(raw);
                        if (raw.error == "Not Found") {
                            msg.channel.send(raw.message);
                        } else {
                            var listRef = persist.get_guild_db(msg).collection('twitch').doc('list');

                            listRef.get().then((snapshot) => {
                                if (snapshot.exists) {
                                    var data = snapshot.data().streamers;
                                    if (data.pushIfNotExist(streamer)) {
                                        listRef.set({
                                            streamers: data
                                        });
                                        msg.channel.send(streamer + ' added to your list');
                                    } else {
                                        msg.channel.send(streamer + " is already in your list");
                                    }
                                } else {
                                    var data = [];
                                    data.push(streamer);
                                    listRef.set({
                                        streamers: data
                                    });
                                    msg.channel.send(streamer + ' added to your list');
                                }
                            });
                        }
                    });
                    req.on("error", function (e) {
                        console.log('!addStreamer problem');
                        console.log('problem with request: ' + e.message);
                    });
                });
                req.end();
                break;
            case "remove":
                var listRef = persist.get_guild_db(msg).collection('twitch').doc('list');
                const FieldValue = require('firebase-admin').firestore.FieldValue;

                listRef.get().then((snapshot) => {
                    if (snapshot.exists) {

                        var name = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                        listRef.update({
                            "streamers": FieldValue.arrayRemove(name)
                        }).then(() => {
                            msg.channel.send(name + " n'est plus dans la liste.");
                        });
                    }
                });
                break;
            case "list":
                var final_string = "les streams notifiés sont :\n";
                var listRef = persist.get_guild_db(msg).collection('twitch').doc('list');

                listRef.get().then((snapshot) => {
                    if (snapshot.exists) {
                        snapshot.data().streamers.forEach(function (elem) {
                            final_string += "> " + elem + "\n";
                        });
                    }
                }).then(() => {
                    msg.channel.send(final_string);
                });
                break;
            case "notify":
                break;
            case "channel":
                var channel = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                msg.channel.send(">les notifications sont activées sur les channels :\n" + channel);
                channel = channel.replace(/[^\/\d]/g, '');
                twitch.option.guild = msg.guild.id;
                twitch.option.channel = channel;
                persist.get_guild_db(msg).collection('twitch').doc('option').set(twitch.option);
                break;
            default:
                msg.channel.send("commande non comprise \n**!stream help** pour la liste des commandes de stream disponibles");
                break;
        }
    },
};