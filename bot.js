/*jshint esversion: 6 */
//const DDB = require("./postgre");
//DDB.create();
const { DDB } = require('pg');

const postgre = new DDB({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

postgre.connect();
postgre.query("CREATE TABLE 'command' ('index' INT NOT NULL AUTO_INCREMENT , PRIMARY KEY ('index'),'cmd' TEXT NOT NULL , 'msg' TEXT NOT NULL , 'author' TEXT NOT NULL );", (err, res) => {
  console.log(err ? err.stack : res.rows[0].message) // Hello World!
  postgre.end();
});
const Discordie = require("discordie");
const fs = require('fs');
var client = new Discordie();
var url = '/feeds/cells/1qwoWEsV5VGpK9O8GFMMVEDSsCdw5zBedApCHD1igOUM/1/public/values?alt=json-in-script&callback=doData';
var raidzbub_url = '/feeds/cells/1am4oo8wq7Ho_cJ4KoQpa1hotCbsjwYCwMylAGovy-Bs/1/public/values?alt=json-in-script&callback=doData';
var http = require('http');
const https = require('https');
var week_day = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
var week_day_calendar = ["mer", "jeu", "ven", "sam", "dim", "lun", "mar"];
var allianceZones = ["Vallée Chantorage", "Rade de Tiragarde", "Drustvar"];
var twitch_client_ID = "qxihlu11ef6gpohfhqb9b27d40u6lj";
var twitch_interval = 30000;
var affixes_list = ["Raging, Volcanic, Tyrannical",
    "Teeming, Explosive, Fortified",
    "Bolstering, Grievous, Tyrannical",
    "Sanguine, Volcanic, Fortified",
    "Bursting, Skittish, Tyrannical",
    "Teeming, Quaking, Fortified",
    "Raging, Necrotic, Tyrannical",
    "Bolstering, Skittish, Fortified",
    "Teeming, Necrotic, Tyrannical",
    "Sanguine, Grevious, Fortified",
    "Bolstering, Explosive, Tyrannical",
    "Bursting, Quaking, Fortified"
]

var options = {
    host: 'spreadsheets.google.com',
    path: raidzbub_url
}
private_commande = {};
resto_dispo = {};
resto_mangeur = {
    "date": "",
    "comment": "",
    "name": ""
}
var clientState;

var debug_guild = 0;
var debug_channel = 0

var question = "";
var answer = [];
setInterval(function() {
    if (clientState != client.state)
        console.log(client.state + " at " + new Date().toString());
    clientState = client.state;
}, 30000, function(error) { /* handle error */ });

var twitch_template = {
    "stream": {},
    "option": {},
    "list": []
};
var option = {
    "interval": twitch_interval,
    "auto_notif": true,
    "guild": "",
}
var index = 0;
// ----------------------------------INTERVAL FUNCTION UPDATE
// STREAMER-----------------------------------------
setInterval(function() {
    if (!client.connected) {
        return console.log("|Discordie| not connected : " + client.state + " at " + new Date().toString());
    } else {
        var game = {
            name: "with !help"
        };
        client.User.setStatus("online", game);
    }
    var last_name = "";
    var twitch = read_file("./twitch.json");
    refreshed_counter = 0;

    // console.log("twitch :" + twitch['list']);
    if (twitch['list'] == undefined)
        twitch = twitch_template;
    var name = twitch['list'][index++];
    if (index >= twitch['list'].length)
        index = 0;
    /*
     * twitch['list'].forEach(function(elem) { var name = elem;
     */
    last_name = name;
    var data;
    var data_raw = "";
    var twitch_option = {
            host: "api.twitch.tv",
            path: "/kraken/streams/" + name + "?client_id=qxihlu11ef6gpohfhqb9b27d40u6lj",
            method: 'GET'
        }
        /* console.log("URL : " + twitch_option.host + twitch_option.path); */
    var req = https.request(twitch_option, function(res) {
        if (res.statusCode != 200) {
            return console.log("invalide status " + res.statusCode + " at " + new Date().toString());
        }
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' +
        // JSON.stringify(res.headers));
        // console.log("twitch refreshed = " +
        // twitch['stream'][name]["refreshed"])
        res.setEncoding('utf8');
        res.on('data', function(raw) {
            data_raw += raw;
        })

        res.on('end', function() {
            var streamer = {
                "response": "",
                "update_time": "",
                "refreshed": ""
            }
            streamer['response'] = data_raw;
            streamer['update_time'] = new Date().toString();
            data = JSON.parse(data_raw);
            if (data["_links"] == undefined) {
                console.log("invalid data");
                return console.log(data);
            }
            name = data["_links"]["self"].split('/');
            name = name[name.length - 1];
            if (twitch['stream'][name] != undefined) {
                if (twitch['stream'][name]["refreshed"] == true) {
                    streamer["refreshed"] = true;
                } else {
                    streamer["refreshed"] = false;
                }
            } else {
                streamer["refreshed"] = false;
            }
            twitch['stream'][name] = streamer
            if (data['stream'] != null) {
                if (twitch['stream'][name]["refreshed"] == false) {
                    channel = twitch["option"]["channel"];
                    var guild = client.Guilds.find(g => g.id == twitch["option"]["guild"]);
                    if (!guild) return console.log("invalid guild");
                    var channels = guild.textChannels.find(C => C.id == channel);
                    if (!channels) return console.log("invalid channel");
                    console.log(new Date().toString());
                    console.log(data);
                    if (data["stream"]["channel"]["game"] == "") {
                        data["stream"]["channel"]["game"] = "...";
                    }
                    if (data["stream"]["channel"]["status"] == "") {
                        data["stream"]["channel"]["status"] = "...";
                    }
                    channels.sendMessage(" ", false, {
                        color: 0x009900,
                        author: {
                            name: name + " is now streaming !",
                            icon_url: "https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png"
                        },
                        title: data["stream"]["channel"]["url"],
                        url: data["stream"]["channel"]["url"],
                        timestamp: data["stream"]["created_at"],
                        thumbnail: {
                            url: data["stream"]["channel"]["logo"],
                            height: 80,
                            width: 80
                        },
                        fields: [{
                            name: "Playing",
                            value: data["stream"]["channel"]["game"]
                        }, {
                            name: "Title",
                            value: data["stream"]["channel"]["status"]
                        }],
                        footer: {
                            text: "stream online"
                        }
                    })
                    console.log("msg send")
                    twitch['stream'][name]["refreshed"] = true;

                }
            } else {
                twitch['stream'][name]["refreshed"] = false;
            }
            // if ((++refreshed_counter) == twitch['list'].length)
            write_file("./twitch.json", twitch);
        });
    });
    req.on('error', (e) => {
        console.log('problem with request: ' + e.message + " at " + new Date().toString());
    });
    req.end();
    // })
}, twitch_interval);

client.connect({
    // replace this sample token
    token: "MjgzMjc5OTc3NDY0NzI1NTA0.C44PFQ.OQfJubpFUmK-0LHc2PYPmM5aPNA"
});
/*
 * var twitch = new TwitchApi({ clientId: 'qxihlu11ef6gpohfhqb9b27d40u6lj',
 * clientSecret: 'xcu8yvdlz9j8r2nu5thoqzcadbnb7g', redirectUrl:
 * "application/vnd.twitchtv.v5+json", scopes: scope });
 */


client.Dispatcher.on("GATEWAY_READY", e => {
    console.log("Connected as: " + client.User.username + " at " + new Date().toString());
    if (client.autoReconnect.enabled) {
        console.log("autoreconnect already enabled");
    } else {
        client.autoReconnect.enable();
        console.log("autoreconnect enable");
    }
});

client.Dispatcher.on("DISCONNECTED", e => {
    console.log("DISCONNECTED at " + new Date().toString());
    console.log("error : " + e.error);
    console.log("autoReconnect : " + e.autoReconnect);
    console.log("auto reconnect delay : " + e.delay);
})

client.Dispatcher.on("MESSAGE_CREATE", e => {
    // console.log("new msg : "+e.message.content+" from
    // "+e.message.author.username + " at " + new
    // Date().toLocaleTimeString());
    if (e.message.author.id == client.User.id)
        return;
    switch (e.message.content) {
        case "!debug":
            var final_string = "";
            final_string += client.state + " at " + new Date().toLocaleTimeString() + "\n";
            final_string += "autoreconnect : " + client.autoReconnect.enabled + "\n";
            final_string += "client is connected : " + client.connected + "\n";
            e.message.channel.sendMessage(final_string);
            break;
        case "!help":
            e.message.channel.sendMessage("**!calendar** : retourne l'utilisation du calendrier\n" +
                "**!resto?** : retourne les disponibilitées du resto\n" +
                "**!resetresto** : reset le planing du resto\n" +
                "**!disporesto** j (commentaire): defini mes dispo du resto ex : \"!disporesto 124 osef\" pour lundi,mardi,jeudi\n" +
                "**!assault** : affiche le prochain assaut\n" +
                "**!invasion** : affiche la prochaine invasion de la Légion\n" +
                "**!affixes** : affiche les affixes de donjon de clé mythique de la semaine \n" +
                "**!goplay** : Uniquement pour les mecs MEGA cho2plé ! \n" +
                "**!createcommand cmd display** : créé une commande personnalisée ( pour afficher les commandes personnalisées utilisez \"!helpcommand\")\n" +
                "**!removecommand cmd** : supprime une commande personnalisée\n" +
                "**!stream cmd** : gere les notifications de stream (!stream help pour plus d'info)");

            break;
        case "!helpcommand":
            // console.log("!helpcommand");
            private_commande = read_file("./command.json");
            var str = "";
            for (var cmd in private_commande) {
                str += private_commande[cmd]["cmd"] + " by " + private_commande[cmd]["author"].username + "\n";
                // console.log(str);
            }
            e.message.channel.sendMessage(str);

            break;
        case "!dev":
            e.message.channel.sendMessage("	http://qeled.github.io/discordie/#/docs/Discordie?_k=9oyisd");
            break;
        case "!invlink":
            e.message.channel.sendMessage("https://discordapp.com/oauth2/authorize?scope=bot&client_id=283279977464725504");
            break;
        case "!ping":
            e.message.channel.sendMessage(e.message.author.mention + " pong !?");
            break;

        case "!dbgListUser":
            var final_str = "";
            client.Users.forEach(function(elem) {
                final_str += ("User.id : " + elem.id + " / User.username  : " + elem.username + "\n");
            })
            final_str += ("Channel : " + e.message.channel.id + " / Guilde  : " + e.message.guild.id + "\n");
            e.message.channel.sendMessage(final_str);
            break;

        case "!resto?":
            var final_string = "";
            var comment_string = "";
            var mangeur_list = [];
            var jour = ['', '', '', '', ''];
            resto_dispo = read_file("./resto.json");
            var mangeur_counter = [0, 0, 0, 0, 0];
            for (var mangeur in resto_dispo) {
                mangeur_list.push(mangeur);
                // console.log("resto_dispo : ");
                // console.log(resto_dispo[mangeur]);
                arr = resto_dispo[mangeur]['date'].split("").filter(function(item, index, inputArray) { // remove
                    // duplicate
                    // day
                    return inputArray.indexOf(item) == index;
                });
                arr.forEach(function(j, index) { // sort day
                        if (j <= 5) {
                            // console.log("jour : " + j + " " +
                            // resto_dispo[mangeur]["name"]);
                            jour[j - 1] += (resto_dispo[mangeur]["name"] + ", ");
                            mangeur_counter[j - 1] += 1;
                        }
                    })
                    // console.log(jour);
                if ((resto_dispo[mangeur]["comment"] != undefined) && (resto_dispo[mangeur]["comment"] != ''))
                    comment_string += resto_dispo[mangeur]["name"] + " : " + resto_dispo[mangeur]["comment"] + "\n";
            }
            if (mangeur_list === undefined || mangeur_list.length == 0) // return
            // planing
                e.message.channel.sendMessage("Personne encore inscrit.\n!disporesto \"jjj\" \"resto\" pour vous inscrire");
            else {
                // final_string += mangeur_list + " sont dispo pour le
                // resto\n";
                jour.forEach(function(elem, index) {
                        final_string += week_day[index] +
                            " (" + mangeur_counter[index] + ") : " + elem + "\n";
                    })
                    // console.log("final_string : " + final_string +
                    // comment_string);
                e.message.channel.sendMessage(final_string + comment_string);
            }

            break;
        case "!testresto":
            e.message.channel.sendMessage("!disporesto 1,2,3,4 all");
            break;
        case "!resetresto":
            resto_dispo = {};
            write_file("./resto.json", resto_dispo);
            // e.message.channel.sendMessage("planning du resto reset");
            e.message.addReaction("\ud83d\udc4c");
            break;

        case "!cho2plé":
        case "!Goplay":
        case "!goplay":
            var msg = e.message;
            var role = msg.guild.roles.find(fn => fn.name == "Cho2Plé !");
            var trigger = msg.member.roles.find(fn => fn.name == "Cho2Plé !");
            if (trigger) msg.member.unassignRole(role);
            else msg.member.assignRole(role);
    	break;
        case "!affixe":
        case "!affixes":
            var opts_eu = {
                host: 'raider.io',
                path: "/api/v1/mythic-plus/affixes?region=eu"
            };
            var opts_us = {
                host: 'raider.io',
                path: "/api/v1/mythic-plus/affixes?region=us"
            };
            var data;
            var data_raw = "";
            var today = new Date();
            today.setDate(today.getDate() - 2);
            var requests = https.request(opts_us, function(res) {
                res.on('data', function(raw) {
                    data_raw += raw;
                })
                res.on('end', function() {
                    data = JSON.parse(data_raw);
                    e.message.channel.sendMessage(" ", false, {
                        color: 0x009900,
                        author: {
                            name: data["title"],
                            icon_url: "http://wow.zamimg.com/images/wow/icons/large/inv_relics_hourglass.jpg"
                        },

                        title: "https://mythicpl.us",
                        url: "https://mythicpl.us",
                        fields: [{
                            name: "(+2) " + data["affix_details"][0]["name"],
                            value: data["affix_details"][0]["description"]
                        }, {
                            name: "(+4) " + data["affix_details"][1]["name"],
                            value: data["affix_details"][1]["description"]
                        }, {
                            name: "(+7) " + data["affix_details"][2]["name"],
                            value: data["affix_details"][2]["description"]
                        }, {
                            name: "(+10) " + data["affix_details"][3]["name"],
                            value: data["affix_details"][3]["description"]
                        }, {
                            name: "Next Week",
                            value: "*" + affixes_list[(today.getWeek() + 4) % 12] + "*"
                        }]

                    })
                });
                res.on('error', function(e) {
                    console.log('problem with request: ' + e.message + " at " + new Date().toString());
                });
            });
            requests.end();
            break;
        case "!assault":
        case "!assaults":
            assaults_command(e);
            break;
        case "!inva":
        case "!invasions":
        case "!invasion":
            var opts = {
                host: 'invasion.wisak.me',
                path: ""
            }
            var data = "";
            var requests = https.request(opts, function(res) {
                res.on('data', function(raw) {
                    data += raw;
                })
                res.on('end', function() {
                    data = data.split('id="message">')[1].split('</div>')[0];
                    e.message.channel.sendMessage(" ", false, {
                        color: 0x009900,
                        thumbnail: {
                            url: "https://invasion.wisak.me/img/legion.png"
                        },
                        author: {
                            name: data,
                            icon_url: "https://invasion.wisak.me/img/legion.png"
                        },
                        title: "invasion.wisak.me",
                        url: "http://invasion.wisak.me",
                        timestamp: new Date()
                    });
                });
                res.on('error', function(e) {
                    console.log('problem with request: ' + e.message + " at " + new Date().toString());
                })
            });
            requests.end();
            break;
        case "!vote?":
            if (question != "") {
                var finale_str = question + " ?\n";
                for (elem in answer) {
                    if (answer[elem]["reponse"] != undefined) {
                        finale_str += answer[elem]["reponse"] + " : " + answer[elem]["count"] + "\n";
                        finale_str += answer[elem]["votant"] + "\n";
                    }
                }
                e.message.channel.sendMessage(finale_str);
            } else {
                e.message.channel.sendMessage("Pas de vote en cour \"!votecreate\" pour créer un nouveau vote")
            }
            break;
        case "!votereset":
            e.message.addReaction("\ud83d\udc4c");
            question = "";
            answer = [];
            break;
        default:
            private_commande = read_file("./command.json");
            if (private_commande[e.message.content] != undefined) {
                e.message.channel.sendMessage(private_commande[e.message.content]["msg"]);
            }
            break;
    }
    if (e.message.content.startsWith("!vote ")) {
        var msg = e.message;
        if (question == "") {
            e.message.channel.sendMessage("Pas de vote en cour \"!votecreate\" pour créer un nouveau vote")
            return false;
        }
        msg.addReaction("\ud83d\udc4c");
        msg.content.replace("!vote ", "").split(" ").forEach(function(panswer) {
            for (elem in answer) {
                if (answer[elem]["reponse"] == panswer) {
                    if (answer[elem]["votant"].indexOf(msg.displayUsername) == -1) {
                        answer[elem]["votant"] += msg.displayUsername + ", ";
                        answer[elem]["count"] += 1;
                    }
                }
            }
        })

    }
    if (e.message.content.startsWith("!votecreate")) {
        try {
            var msg = e.message;
            question = msg.content.replace("!votecreate", "").split("-")[0];
            answer = [];
            msg.content.split("-")[1].split("/").forEach(function(elem, index) {
                answer[elem] = [];
                answer[elem]["reponse"] = elem;
                answer[elem]["votant"] = "";
                answer[elem]["count"] = 0;
            });
            msg.addReaction("\ud83d\udc4c");
        } catch (erno) {
            e.message.channel.sendMessage("erreur sur la commande **\"!votecreate\"**")
        }
    }
    if (e.message.content.startsWith("!stream")) {
        var msg = e.message;
        var cmd = msg.content.split(" ")[1];
        var twitch = read_file("./twitch.json");
        if (twitch['list'] == undefined)
            twitch = twitch_template;
        switch (cmd) {
            case "help":
                e.message.channel.sendMessage("**!stream add channel** : ajoute le channel twitch à la liste de notification\n" +
                    "**!stream channel #channel** : change le channel discord de notification\n" +
                    "**!stream remove channel** : supprime un channel twitch de la liste de notification\n" +
                    "**!stream list** : liste les channel enregistré");
                break;
            case "add":
                var streamer = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                var twitch_option = {
                        host: "api.twitch.tv",
                        path: "/kraken/channels/" + streamer + "?client_id=qxihlu11ef6gpohfhqb9b27d40u6lj",
                        method: 'GET'
                    }
                    // console.log('streamer = '+streamer);
                var req = https.request(twitch_option, function(res) {
                    // console.log('STATUS: ' + res.statusCode);
                    // console.log('HEADERS: ' +
                    // JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function(raw) {
                        raw = JSON.parse(raw);
                        if (raw["error"] == "Not Found") {
                            e.message.channel.sendMessage(raw["message"]);
                        } else {
                            if (twitch['list'].pushIfNotExist(streamer)) {
                                write_file("./twitch.json", twitch);
                                e.message.channel.sendMessage(raw["display_name"] + ' add to your list');
                            } else {
                                e.message.channel.sendMessage(streamer + " is already in your list");
                            }
                        }
                    })
                    req.on('error', function(e) {
                        console.log('!addStreamer problem');
                        console.log('problem with request: ' + e.message);
                    });
                })
                req.end();
                break;
            case "remove":
                if (twitch["list"] != undefined) {
                    var name = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                    var index = twitch['list'].indexOf(name);
                    if (index > -1) {
                        twitch['list'].splice(index, 1);
                        msg.channel.sendMessage(name + " a était supprimé de la liste");
                        twitch["stream"][name] = "";
                    } else {
                        msg.channel.sendMessage("le channel n'est pas dans la liste");
                    }
                    write_file("./twitch.json", twitch);
                }
                break;
            case "list":
                var final_string = "les streams notifiés sont :\n";
                if (twitch["list"] != undefined)
                    twitch["list"].forEach(function(elem) {
                        final_string += "> " + elem + "\n"
                    })

                msg.channel.sendMessage(final_string);
                break;
            case "notify":
                break;
            case "channel":
                var channel = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                msg.channel.sendMessage(">les notifications sont activées sur les channels :\n" + channel)
                channel = channel.replace(/[^\/\d]/g, '');
                twitch["option"]["guild"] = msg.guild.id;
                twitch["option"]["channel"] = channel;
                write_file("./twitch.json", twitch);
                break;

            default:
                msg.channel.sendMessage("commande non comprise \n**!stream help** pour la liste des commandes de stream disponibles")
                break;
        }

    }
    if (e.message.content.startsWith("!dbgMsg")) {
        var msg = e.message;
        if (msg.content.split(" ")[1] == "0") {
            debug_guild = 0;
            return;
        }
        debug_guild = e.message.guild.id;
        debug_channel = e.message.channel.id;
        e.message.channel.sendMessage("saved on " + debug_guild + " " + debug_channel);
    }
    if (e.message.content.startsWith("!calendar")) {
        var msg = e.message;
        var noPlayer = 1;
        var request = http.request(options, function(res) {
            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                var ret = parse(data);
                if (ret == undefined)
                    return;
                if (msg.content.split(" ")[1] == undefined) {
                    var user_upd = [];
                    ret['tag'].forEach(function(tag, index) {
                        if (ret['upd'][index] == undefined) {
                            noPlayer = 0;
                            var user = client.Users.find(u => u.id == tag);
                            if (!user)
                                user_upd.push(player);
                            else
                                user_upd.push(user.mention);
                        }
                    });
                    if (noPlayer)
                        e.message.channel.sendMessage("tout le monde a rempli");
                    else
                        e.message.channel.sendMessage(user_upd + " merci de remplir le calendrier\n<https://docs.google.com/spreadsheets/d/1am4oo8wq7Ho_cJ4KoQpa1hotCbsjwYCwMylAGovy-Bs/edit#gid=0>");
                } else {
                    var name = e.message.content.substr(e.message.content.indexOf(" ") + 1);
                    var final_string = "";
                    name.split(" ").forEach(function(elem, index) {
                        var toto = week_day_calendar.indexOf(elem);
                        if (toto != -1) {
                            var user_dispo_notsur = [],
                                user_dispo_sur = [];
                            ret['player'].forEach(function(player, index) {
                                // console.log('joueur
                                // : '+player);
                                // console.log('jour
                                // :
                                // '+ret["jour"][index]);
                                if (ret["jour"][index] != undefined) {
                                    if (ret["jour"][index][toto] == 'x') {
                                        user_dispo_sur.push(player);
                                    } else if (ret["jour"][index][toto] != undefined) {
                                        user_dispo_notsur.push(player);
                                    } else {}
                                }
                            });
                            if ((user_dispo_notsur.length <= 0) && (user_dispo_sur.length <= 0))
                                final_string += "tous des tafioles le " + elem + "\n";
                            else
                                final_string += "le " + elem + " : \n";
                            if (user_dispo_sur.length == 1)
                                final_string += user_dispo_sur + " beaucoup trop motivé\n";
                            else if (user_dispo_sur.length > 0)
                                final_string += user_dispo_sur + " sont chauds bouillants.\n";

                            if (user_dispo_notsur.length > 0)
                                final_string += user_dispo_notsur + " y a moyen mais faut de la qualité\n";
                        } else {
                            final_string += '\"' + elem + '\" jour inconnu utilisé : lun,mar,mer,jeu,ven,sam,dim\n';
                        }
                    })
                    e.message.channel.sendMessage(final_string);
                }

            });
            request.on('error', function(e) {
                console.log(e.message);
            });
        });
        request.end();
    }
    if (e.message.content.startsWith("!createcommand")) {
        var msg = e.message;
        var command = {
            "cmd": "",
            "msg": "",
            "author": ""
        }
        var str =
            command["msg"] = msg.content.replace(/^([^ ]+ ){2}/, ''); // remove
        // 2
        // 1st
        // words
        command["cmd"] = msg.content.split(" ")[1];
        command["author"] = e.message.author;
        private_commande = read_file("./command.json");
        // console.log("private 1 : ");console.log(private_commande);
        private_commande[command["cmd"]] = command;
        // console.log("private 2 : ");console.log(private_commande);
        write_file("./command.json", private_commande);
        msg.channel.sendMessage("commande " + command["cmd"] + " créée");

    }
    if (e.message.content.startsWith("!removecommand")) {
        var msg = e.message;
        var cmd = msg.content.split(" ")[1];
        private_commande = read_file("./command.json");
        // console.log("private 1 : ");console.log(private_commande);
        delete private_commande[cmd];
        // console.log("private 2 : ");console.log(private_commande);
        write_file("./command.json", private_commande);
        msg.channel.sendMessage("commande " + cmd + " supprimée");

    }
    if (e.message.content.startsWith("!botname")) {
        var name = e.message.content.substr(e.message.content.indexOf(" ") + 1);
        client.User.setUsername(name);
        e.message.channel.sendMessage("hoooo yeeaaaa " + name + " débarque !!");
    }
    if (e.message.content.startsWith("!disporesto")) {
        var msg = e.message;
        var date = msg.content.split(" ")[1];
        var comment = "";
        if (msg.content.split(" ")[2] != undefined)
            comment = msg.content.replace(/^([^ ]+ ){2}/, ''); // remove 2
        // st words
        if ((date == undefined) /* ||( resto == undefined) */ ) {
            // console.log("erreur resto");
            msg.channel.sendMessage("erreur sur la commande");
        } else {
            resto_mangeur['date'] = date;
            resto_mangeur['comment'] = comment;
            resto_mangeur['name'] = msg.displayUsername;
            resto_dispo = read_file("./resto.json");
            resto_dispo[msg.author.mention] = resto_mangeur;
            write_file("./resto.json", resto_dispo);
            // msg.channel.sendMessage("Sauvegardé !!");
            msg.addReaction("\ud83d\udc4c");
        }
    }

});

function assaults_command(e) {
    var alliance_logo = "https://d1u5p3l4wpay3k.cloudfront.net/wowpedia/thumb/6/60/AllianceLogo.png/358px-AllianceLogo.png"
    var horde_logo = "https://d1u5p3l4wpay3k.cloudfront.net/wowpedia/thumb/e/e2/HordeLogo.png/473px-HordeLogo.png"
    var opts = {
        host: 'www.mamytwink.com',
        path: "/assauts-bfa",
        method: "GET",
        encoding: 'ascii'
    }
    var data = "";
    var requests = https.request(opts, function(res) {
        res.on('data', function(raw) {
            data += raw;
        })
        res.on('end', function() {
            var zone = data.substring(data.lastIndexOf("<b>")+3, data.lastIndexOf("</b>"));
            data = data.replace('<br />','\n').replace(/<[^>]+>/g, '').replace(/\t/g, '').replace('&#039;',"'");
            var faction_logo = "";
            if (allianceZones.includes(zone)) {
                faction_logo = alliance_logo;
            } else {
                faction_logo = horde_logo;
            }
			
            e.message.channel.sendMessage(" ", false, {
                color: 0x009900,
                thumbnail: {
                    url: faction_logo
                },
                author: {
                    name: data.split('\n')[2],
                    icon_url: faction_logo
                },
                description: data.split('\n')[3],
                timestamp: new Date()
            });
        });
        res.on('error', function(e) {
            console.log('Problem with request: ' + e.message + " at " + new Date().toString());
        })
    });
    requests.end();
}

function write_file(file, obj) {
    try {
        var json = JSON.stringify(obj);
	fs.writeFileSync(file, json);
    } catch (e) {
        console.log('invalid json write' + file);
        console.log(e.message);
    }
    /*
     * require("fs").writeFile(file,JSON.stringify(obj, null, 2),'utf8',function
     * (err) { if (err) { console.error('error write in file '+file); } } );
     */
    // console.log("save in file : "+JSON.stringify(obj, null, 2));
}

function read_file(file) {
    try {
        var object = JSON.parse(fs.readFileSync(file, "UTF-8"));
    } catch (e) {
        console.log('invalid json read' + file);
        console.log(e.message + " at " + new Date().toString());
        object = {};
        Send_debug_msg('invalid json read' + file + '\n' + e.message + " at " + new Date().toString());
    }
    return object;
}

function parse(data) {
    try {
        var update_col = 11,
            tag_col = 13,
            date_col = 4;
        var i = 0;
        var retArray = {
            'player': [],
            'upd': [],
            'tag': [],
            'jour': []
        };
        var tmp_jour = [];
        data = data.replace("// API callback\ndoData(", '');
        var subdata = data.substring(-1, data.lastIndexOf(');'));
        subdata = JSON.parse(subdata);
        subdata.feed.entry.forEach(function(element, index) {
            if (element.gs$cell.row == 1) {
                if (element.gs$cell.$t == "Updaté") {
                    update_col = element.gs$cell.col;
                }
                if (element.gs$cell.$t == "TAG Discord") {
                    tag_col = element.gs$cell.col;
                }
                if (element.gs$cell.$t == "mer") {
                    date_col = element.gs$cell.col;
                }
            } else {
                if (element.gs$cell.col == 1) {
                    i++;
                    retArray['player'].push(element.gs$cell.$t);
                    // console.log("i player : "+i+" of
                    // "+element.gs$cell.$t);
                    tmp_jour = [];
                }
                if (element.gs$cell.col == update_col) {
                    retArray['upd'][i - 1] = element.gs$cell.$t;
                    // console.log("i upd : "+i+" of
                    // "+element.gs$cell.$t);
                }
                if (element.gs$cell.col == tag_col) {
                    retArray['tag'][i - 1] = element.gs$cell.$t;
                    // console.log("i tag : "+i+" of
                    // "+element.gs$cell.$t);
                }
                if ((element.gs$cell.col >= date_col) && (element.gs$cell.col < (date_col + 7))) {
                    // console.log("date_col :
                    // "+element.gs$cell.col);
                    tmp_jour[element.gs$cell.col - date_col] = element.gs$cell.$t;
                    retArray['jour'][i - 1] = tmp_jour;
                }
            }
        })
        retArray['player'].pop();
        // console.log("retArray P :"+ retArray.player);
        // console.log("retArray U :"+ retArray.upd);
        return retArray;
    } catch (e) {
        console.log('invalid json');
        console.log(e);
    }
}

Array.prototype.inArray = function(comparer) {
    for (var i = 0; i < this.length; i++) {
        if (comparer == this[i]) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function(element) {
    if (!this.inArray(element)) {
        this.push(element);
        return true;
    }
    return false;
};

function Send_debug_msg(message) {

    if (debug_guild == 0) return;

    var guild = client.Guilds.find(g => g.id == debug_guild);
    if (!guild) return console.log("invalid guild");
    var channels = guild.textChannels.find(C => C.id == debug_channel);
    if (!channels) return console.log("invalid channel");

    channels.sendMessage(message);
    channels.sendMessage("!dbgMsg 0 pour enlever le mode débug");
}
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    var today = new Date(this.getFullYear(), this.getMonth(), this.getDate());
    var dayOfYear = ((today - onejan + 1) / 86400000);
    return Math.ceil(dayOfYear / 7)
};

var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('Le bot est ' + client.state);
});
server.listen(process.env.PORT || 8080);