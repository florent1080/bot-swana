/*jshint esversion: 6 */
const Discordie = require("discordie");
const fs = require('fs');
const util = require('./file_utils.js');
const twitch = require('./twitch.js');
var client = new Discordie();
var url = '/feeds/cells/1qwoWEsV5VGpK9O8GFMMVEDSsCdw5zBedApCHD1igOUM/1/public/values?alt=json-in-script&callback=doData';
var raidzbub_url = '/feeds/cells/1am4oo8wq7Ho_cJ4KoQpa1hotCbsjwYCwMylAGovy-Bs/1/public/values?alt=json-in-script&callback=doData';
var http = require('http');
const https = require('https');
var week_day = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
var week_day_calendar = ["mer", "jeu", "ven", "sam", "dim", "lun", "mar"];
var allianceZones = ["Vallée Chantorage", "Rade de Tiragarde", "Drustvar"];
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
];

var options = {
    host: 'spreadsheets.google.com',
    path: raidzbub_url
};
private_commande = {};
resto_dispo = {};
resto_mangeur = {
    "date": "",
    "comment": "",
    "name": ""
};
var clientState;

var debug_guild = 0;
var debug_channel = 0;

// Firebase
const admin = require('firebase-admin');
var serviceAccount = require('./bot-swana-firebase-adminsdk-u8zhh-8fa53e0908.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
admin.firestore().settings( { timestampsInSnapshots: true })
var db = admin.firestore();
var guild_db = null;

var question = "";
var answer = [];

setInterval(function () {
    if (clientState != client.state) {
        console.log(client.state + " at " + new Date().toString());
    }
    clientState = client.state;
    var game = {
	name: "with !help"
    };
    client.User.setStatus("online", game);
}, 30000, function (error) { /* handle error */ });

var option = { // NOT USED ?
    "interval": twitch_interval,
    "auto_notif": true,
    "guild": ""
};
var index = 0;
// ----------------------------------INTERVAL FUNCTION UPDATE
// STREAMER-----------------------------------------
setInterval(function () {
    if (!client.connected) {
         return console.log("|Discordie| not connected : " + client.state + "at " + new Date().toString());
    }
    twitch.refresh(client);
}, twitch_interval);

client.connect({
    // replace this sample token
    token: process.env.BOT_TOKEN
});
/*
 * var twitch = new TwitchApi({ clientId: 'qxihlu11ef6gpohfhqb9b27d40u6lj',
 * clientSecret: 'xcu8yvdlz9j8r2nu5thoqzcadbnb7g', redirectUrl:
 * "application/vnd.twitchtv.v5+json", scopes: scope });
 */

client.Dispatcher.on("GATEWAY_READY", function (e) {
    console.log("Connected as: " + client.User.username + " at " + new Date().toString());
    if (client.autoReconnect.enabled) {
        console.log("autoreconnect already enabled");
    } else {
        client.autoReconnect.enable();
        console.log("autoreconnect enable");
    }
});

client.Dispatcher.on("DISCONNECTED", function (e) {
    console.log("DISCONNECTED at " + new Date().toString());
    console.log("error : " + e.error);
    console.log("autoReconnect : " + e.autoReconnect);
    console.log("auto reconnect delay : " + e.delay);
});

client.Dispatcher.on("MESSAGE_CREATE", function (e) {
    if (e.message.author.id == client.User.id) {
        return;
    }
    if (!e.message.content.startsWith('!')) {
        return;
    }
    
    var message_channel_obj = client.Channels.filter(obj => {
        return obj.id === e.message.channel_id;
    })[0];
    var message_guild = message_channel_obj.guild_id;
    guild_db = db.collection('server').doc(message_guild);

    var args = e.message.content.split(' ');
    var input_command = args[0];
    args.shift();
    var msg = e.message;
    
    switch (input_command) {
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
                "**!affixes** : affiche les affixes de donjon de clé mythique de la semaine\n" +
                "**!goplay** : Uniquement pour les mecs MEGA cho2plé ! \n" +
                "**!createcommand cmd display** : crée une commande personnalisée (pour afficher les commandes personnalisées utilisez \"!helpcommand\")\n" +
                "**!removecommand cmd** : supprime une commande personnalisée\n" +
                "**!stream cmd** : gere les notifications de stream (!stream help pour plus d'info");
            break;
        case "!helpcommand":
            var str = "";
            guild_db.collection('commands').get().then(snapshot => {
                snapshot.forEach((doc) => {
                    var prvt_cmd = doc.data();
                    str += prvt_cmd.cmd + " by " + prvt_cmd.author.username + "\n";
                })
            }).then(() => {
                if(str) {
                    e.message.channel.sendMessage(str);
                } else {
                    e.message.channel.sendMessage("Aucune commande disponible.");
                }
            })
            break;
        case "!dev":
            e.message.channel.sendMessage("http://qeled.github.io/discordie/#/docs/Discordie?_k=9oyisd");
            break;
        case "!invlink":
            e.message.channel.sendMessage("https://discordapp.com/oauth2/authorize?scope=bot&client_id=283279977464725504");
            break;
        case "!ping":
            e.message.channel.sendMessage(e.message.author.mention + " pong !?");
            break;
        case "!dbgListUser":
            var final_str = "";
            client.Users.forEach(function (elem) {
                final_str += ("User.id : " + elem.id + " / User.username  : " + elem.username + "\n");
            });
            final_str += ("Channel : " + e.message.channel.id + " / Guilde  : " + e.message.guild.id + "\n");
            e.message.channel.sendMessage(final_str);
            break;
        case "!resto?":
            displayrestodispo_command(e);
            break;
        case "!testresto":
            e.message.channel.sendMessage("!disporesto 1,2,3,4 all");
            break;
        case "!resetresto":
            resto_dispo = {};
            deleteCollection(db, 'server/'+ message_guild +'/resto', 500); 
            e.message.addReaction("\ud83d\udc4c");
            break;
        case "!cho2plé":
        case "!Goplay":
        case "!goplay":
            var role = msg.guild.roles.find(fn => fn.name == "Cho2Plé !");
            var trigger = msg.member.roles.find(fn => fn.name == "Cho2Plé !");
            if (trigger) {
                msg.member.unassignRole(role);
            } else {
                msg.member.assignRole(role);
            }
            break;
        case "!affixe":
        case "!affixes":
            affixes_command(e);
            break;
        case "!assaut":
        case "!assault":
        case "!assaults":
            assaults_command(e);
            break;
        case "!inva":
        case "!invasions":
        case "!invasion":
            invasion_command(e);
            break;
        case "!vote?":
            if (question !== "") {
                var finale_str = question + " ?\n";
                for (var elem in answer) {
                    if (answer.elem.reponse !== undefined) {
                        finale_str += answer.elem.reponse + " : " + answer.elem.count + "\n";
                        finale_str += answer.elem.votant + "\n";
                    }
                }
                e.message.channel.sendMessage(finale_str);
            } else {
                e.message.channel.sendMessage("Pas de vote en cours, \"!votecreate\" pour créer un nouveau vote");
            }
            break;
        case "!votereset":
            question = "";
            answer = [];
            e.message.addReaction("\ud83d\udc4c");
            break;
        case "!vote":
            if (question === "") {
                msg.channel.sendMessage("Pas de vote en cours, \"!votecreate\" pour créer un nouveau vote");
                return false;
            }
            msg.addReaction("\ud83d\udc4c");
            args.forEach(function (panswer) {
                for (var elem in answer) {
                    if (answer.elem.reponse == panswer) {
                        if (answer.elem.votant.indexOf(msg.displayUsername) == -1) {
                            answer.elem.votant += msg.displayUsername + ", ";
                            answer.elem.count += 1;
                        }
                    }
                }
            });
            break;
        case "!votecreate":
            try {
                question = msg.content.replace("!votecreate", "").split("-")[0];
                answer = [];
                msg.content.split("-")[1].split("/").forEach(function (elem, index) {
                    answer[elem] = [];
                    answer[elem].reponse = elem;
                    answer[elem].votant = "";
                    answer[elem].count = 0;
                });
                msg.addReaction("\ud83d\udc4c");
            } catch (erno) {
                e.message.channel.sendMessage("Erreur sur la commande **\"!votecreate\"**");
            }
            break;
        case "!stream":
            twitch.stream_command(e, args);
            break;
        case "!dbgMsg":
            if (args[0] == "0") {
                debug_guild = 0;
                return;
            }
            debug_guild = e.message.guild.id;
            debug_channel = e.message.channel.id;
            e.message.channel.sendMessage("saved on " + debug_guild + " " + debug_channel);
            break;
        case "!calendar":
            calendar_command(e, args);
            break;
        case "!createcommand":
            var command = {
                "cmd": "",
                "msg": "",
                "author": ""
            };
            
            command.cmd = args[0];
            if (command.cmd.startsWith('!')) {
                msg.channel.sendMessage("Je m'occupe de rajouter le ! tkt. (Commande non créée)");
                return;
            }
            command.cmd = '!' + command.cmd;
            command.msg = msg.content.replace(/^([^ ]+ ){2}/, '');
            command.author = JSON.parse(JSON.stringify(e.message.author));
            var commandRef = guild_db.collection('commands').doc(command.cmd)

            commandRef.get().then((snapshot) => {
                if (snapshot.exists) {
                    msg.channel.sendMessage("La commande " + command.cmd + " existe déjà.");
                } else {
                    commandRef.set(command);
                    msg.channel.sendMessage("La commande " + command.cmd + " a été créée.");
                }
            });
            break;
        case "!removecommand":
            var command_to_remove = args[0];

            if (command_to_remove.startsWith('!')) {
                msg.channel.sendMessage("Je m'occupe de rajouter le ! tkt. (Commande non suppr.)");
                return;
            }
            command_to_remove = '!' + command_to_remove;
            var commandRef = guild_db.collection('commands').doc(command_to_remove)

            commandRef.get().then((snapshot) => {
                if (snapshot.exists) {
                    commandRef.delete();
                    msg.channel.sendMessage("La commande " + command_to_remove + " a été supprimée");
                } else {
                    msg.channel.sendMessage("La commande " + command_to_remove + " n'existe pas.");
                }
            });
            break;
        case "!botname":
            var name = e.message.content.substr(e.message.content.indexOf(" ") + 1);
            client.User.setUsername(name);
            e.message.channel.sendMessage("hoooo yeeaaaa " + name + " débarque !!");
            break;
        case "!disporesto":
            var date = args[0];
            var comment = "";
            if (args[1] !== undefined) {
                comment = msg.content.replace(/^([^ ]+ ){2}/, ''); // remove 2
            }
            // st words
            if ((date === undefined) /* ||( resto == undefined) */ ) {
                msg.channel.sendMessage("erreur sur la commande");
            } else {
                resto_mangeur.date = date;
                resto_mangeur.comment = comment;
                resto_mangeur.name = msg.displayUsername;
                guild_db.collection('resto').doc(msg.author.mention).set(resto_mangeur);
                msg.addReaction("\ud83d\udc4c");
            }
            break;
        default:
            var commandRef = guild_db.collection('commands').doc(e.message.content)
            commandRef.get().then((snapshot) => {
                if (snapshot.exists) {
                    e.message.channel.sendMessage(snapshot.data().msg);
                } 
            });
            break;
    }
});

function displayrestodispo_command(e) {
    var final_string = "";
    var comment_string = "";
    var mangeur_list = [];
    var jour = ['', '', '', '', ''];
    var mangeur_counter = [0, 0, 0, 0, 0];
    
    guild_db.collection('resto').get().then(snapshot => {
        snapshot.forEach((doc) => {
            var mangeur = doc.data();
            mangeur_list.push(mangeur);
            arr = mangeur.date.split("").filter(function (item, index, inputArray) { // remove
											// duplicate
											// day
                return inputArray.indexOf(item) == index;
            });
            arr.forEach(function (j, index) { // sort day
                if (j <= 5) {
                    jour[j - 1] += (mangeur.name + ", ");
                    mangeur_counter[j - 1] += 1;
                }
            });
            if ((mangeur.comment !== undefined) && (mangeur.comment !== '')) {
                comment_string += mangeur.name + " : " + mangeur.comment + "\n";
            }
        });
    }).then(() => {
        if (mangeur_list === undefined || mangeur_list.length === 0) { // return
									// planning
            e.message.channel.sendMessage("Personne encore inscrit.\n!disporesto \"jjj\" \"resto\" pour vous inscrire");
        } else {
            jour.forEach(function (elem, index) {
                final_string += week_day[index] +
                    " (" + mangeur_counter[index] + ") : " + elem + "\n";
            });
            e.message.channel.sendMessage(final_string + comment_string);
        }
    });
}

function invasion_command(e) {
    var opts = {
        host: 'invasion.wisak.me',
        path: ""
    };
    var data = "";
    var requests = https.request(opts, function (res) {
        res.on('data', function (raw) {
            data += raw;
        });
        res.on('end', function () {
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
        res.on('error', function (e) {
            console.log('problem with request: ' + e.message + " at " + new Date().toString());
        });
    });
    requests.end();
}

function affixes_command(e) {
    var opts_eu = { // NOT USED ? // A UTILISER SI BUG/DIFFERENTE AFFIXES NA/EU
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
    var requests = https.request(opts_us, function (res) {
        res.on('data', function (raw) {
            data_raw += raw;
        });
        res.on('end', function () {
            data = JSON.parse(data_raw);
            e.message.channel.sendMessage(" ", false, {
                color: 0x009900,
                author: {
                    name: data.title,
                    icon_url: "http://wow.zamimg.com/images/wow/icons/large/inv_relics_hourglass.jpg"
                },

                title: "https://mythicpl.us",
                url: "https://mythicpl.us",
                fields: [{
                    name: "(+2) " + data.affix_details[0].name,
                    value: data.affix_details[0].description
                }, {
                    name: "(+4) " + data.affix_details[1].name,
                    value: data.affix_details[1].description
                }, {
                    name: "(+7) " + data.affix_details[2].name,
                    value: data.affix_details[2].description
                }, {
                    name: "(+10) " + data.affix_details[3].name,
                    value: data.affix_details[3].description
                }, {
                    name: "Next Week",
                    value: "*" + affixes_list[(today.getWeek() + 4) % 12] + "*"
                }]

            });
        });
        res.on('error', function (e) {
            console.log('problem with request: ' + e.message + " at " + new Date().toString());
        });
    });
    requests.end();    
}



function calendar_command(e, args) {
    var msg = e.message;
    var noPlayer = 1;
    var request = http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var ret = util.parse(data);
            if (ret === undefined) {
                return;
            }
            if (args[0] === undefined) {
                var user_upd = [];
                ret.tag.forEach(function (tag, index) {
                    if (ret.upd[index] === undefined) {
                        noPlayer = 0;
                        var user = client.Users.find(u => u.id == tag);
                        if (!user) {
                            user_upd.push(player);
                        } else {
                            user_upd.push(user.mention);
                        }
                    }
                });
                if (noPlayer) {
                    e.message.channel.sendMessage("tout le monde a rempli");
                } else {
                    e.message.channel.sendMessage(user_upd + " merci de remplir le calendrier\n<https://docs.google.com/spreadsheets/d/1am4oo8wq7Ho_cJ4KoQpa1hotCbsjwYCwMylAGovy-Bs/edit#gid=0>");
                }
            } else {
                var name = e.message.content.substr(e.message.content.indexOf(" ") + 1);
                var final_string = "";
                name.split(" ").forEach(function (elem, index) {
                    var toto = week_day_calendar.indexOf(elem);
                    if (toto != -1) {
                        var user_dispo_notsur = [],
                            user_dispo_sur = [];
                        ret.player.forEach(function (player, index) {
                            if (ret.jour[index] !== undefined) {
                                if (ret.jour[index][toto] == 'x') {
                                    user_dispo_sur.push(player);
                                } else if (ret.jour[index][toto] !== undefined) {
                                    user_dispo_notsur.push(player);
                                }
                            }
                        });
                        if ((user_dispo_notsur.length <= 0) && (user_dispo_sur.length <= 0)) {
                            final_string += "tous des tafioles le " + elem + "\n";
                        } else {
                            final_string += "le " + elem + " : \n";
                        }
                        if (user_dispo_sur.length == 1) {
                            final_string += user_dispo_sur + " beaucoup trop motivé\n";
                        } else if (user_dispo_sur.length > 0) {
                            final_string += user_dispo_sur + " sont chauds bouillants.\n";
                        }
                        if (user_dispo_notsur.length > 0) {
                            final_string += user_dispo_notsur + " y a moyen mais faut de la qualité\n";
                        }
                    } else {
                        final_string += '\"' + elem + '\" jour inconnu utilisé : lun,mar,mer,jeu,ven,sam,dim\n';
                    }
                });
                e.message.channel.sendMessage(final_string);
            }
        });
        request.on('error', function (e) {
            console.log(e.message);
        });
    });
    request.end();
}

function assaults_command(e) {
    var alliance_logo = "https://d1u5p3l4wpay3k.cloudfront.net/wowpedia/thumb/6/60/AllianceLogo.png/358px-AllianceLogo.png";
    var horde_logo = "https://d1u5p3l4wpay3k.cloudfront.net/wowpedia/thumb/e/e2/HordeLogo.png/473px-HordeLogo.png";
    var opts = {
        host: 'www.mamytwink.com',
        path: "/assauts-bfa",
        method: "GET",
        encoding: "ascii"
    };
    var data = "";
    var requests = https.request(opts, function (res) {
        res.on('data', function (raw) {
            data += raw;
        });
        res.on('end', function () {
            var zone = data.substring(data.indexOf("<b>") + 3, data.indexOf("</b>"));
            data = data.replace('<br />', '\n').replace(/<[^>]+>/g, '').replace(/\t/g, '').replace('&#039;', "'");
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
        res.on('error', function (e) {
            console.log('Problem with request: ' + e.message + " at " + new Date().toString());
        });
    });
    requests.end();
}


Array.prototype.inArray = function (comparer) {
    for (var i = 0; i < this.length; i++) {
        if (comparer == this[i]) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function (element) {
    if (!this.inArray(element)) {
        this.push(element);
        return true;
    }
    return false;
};

function Send_debug_msg(message) {

    if (debug_guild === 0) return;

    var guild = client.Guilds.find(g => g.id == debug_guild);
    if (!guild) return console.log("invalid guild");
    var channels = guild.textChannels.find(C => C.id == debug_channel);
    if (!channels) return console.log("invalid channel");

    channels.sendMessage(message);
    channels.sendMessage("!dbgMsg 0 pour enlever le mode débug");
}

Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    var today = new Date(this.getFullYear(), this.getMonth(), this.getDate());
    var dayOfYear = ((today - onejan + 1) / 86400000);
    return Math.ceil(dayOfYear / 7);
};

function deleteCollection(db, collectionPath, batchSize) {
    var collectionRef = db.collection(collectionPath);
    var query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise(function(resolve, reject) {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
}

// Firebase tools for deleting one collection
function deleteQueryBatch(db, query, batchSize, resolve, reject) {
    query
        .get()
        .then(snapshot => {
            // When there are no documents left, we are done
            if (snapshot.size === 0) {
                return 0;
            }

            // Delete documents in a batch
            var batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            return batch.commit().then(() => {
                return snapshot.size;
            });
        })
        .then(numDeleted => {
            if (numDeleted === 0) {
                resolve();
                return;
            }

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            process.nextTick(() => {
                deleteQueryBatch(db, query, batchSize, resolve, reject);
            });
        })
        .catch(reject);
}