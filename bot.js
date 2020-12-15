/*jshint esversion: 6 */
const {Client, Attachment} = require('discord.js');
const client = new Client();
const fs = require('fs');
const util = require('./file_utils.js');
const persist = require('./persist.js');
const twitch = require('./twitch.js');
const warfront = require('./warfront.js');
var url = '/feeds/cells/1qwoWEsV5VGpK9O8GFMMVEDSsCdw5zBedApCHD1igOUM/1/public/values?alt=json-in-script&callback=doData';
var raidzbub_url = '/feeds/cells/1am4oo8wq7Ho_cJ4KoQpa1hotCbsjwYCwMylAGovy-Bs/1/public/values?alt=json-in-script&callback=doData';
var http = require('http');
const https = require('https');
var week_day = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
var week_day_calendar = ["mer", "jeu", "ven", "sam", "dim", "lun", "mar"];
var allianceZones = ["Vallée Chantorage", "Rade de Tiragarde", "Drustvar"];
var twitch_interval = 30000;
var affixes_list = [
                    "Fortified, Sanguine, Grievous, Reaping",
                    "Tyrannical, Bolstering, Explosive, Infested",
                    "Fortified, Bursting, Quaking, Reaping",
                    "Tyrannical, Raging, Volcanic, Reaping",
                    "Fortified, Teeming, Explosive, Reaping",
                    "Tyrannical, Bolstering, Grievous, Reaping",
                    "Fortified, Sanguine, Necrotic, Reaping",
                    "Tyrannical, Bursting, Skittish, Reaping",
                    "Fortified, Teeming, Quaking, Reaping",
                    "Tyrannical, Raging, Necrotic, Reaping",
                    "Fortified, Bolstering, Skittish, Reaping",
                    "Tyrannical, Teeming, Volcanic, Reaping"
                    ];
var client_status = ["READY","CONNECTING",
                     "RECONNECTING",
                     "IDLE",
                     "NEARLY",
                     "DISCONNECTED"];
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

var question = "";
var answer = [];

setInterval(function () {
    if (clientState != client.status) {
	console.log(client_status[client.status] + " at " + new Date().toString());
    }
    clientState = client.status;

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
    if (client_status[client.status] != "READY") {
	return 0;
	}
    twitch.refresh(client);
}, twitch_interval);

client.login(process.env.BOT_TOKEN);
// ---------INTERVAL FUNCTION FETCH GUILD MEMBERS---------

setInterval(function () {
client.guilds.cache.forEach(function(guild){
	if(guild.memberCount != guild.members.cache.size){
		guild.members.fetch();
	}
});
}, 10000);


/*
 * var twitch = new TwitchApi({ clientId: 'qxihlu11ef6gpohfhqb9b27d40u6lj',
 * clientSecret: 'xcu8yvdlz9j8r2nu5thoqzcadbnb7g', redirectUrl:
 * "application/vnd.twitchtv.v5+json", scopes: scope });
 */

client.on("ready", function (e) {
    console.log("Connected as: " + client.user.tag + " at " + new Date().toString());
    client.user.setActivity('!help');
});

client.on("disconnect", function (e) {
    console.log("disconnected at " + new Date().toString());
    console.log("error : " + e.error);
    console.log("autoReconnect : " + e.autoReconnect);
    console.log("auto reconnect delay : " + e.delay);
});

client.on("error", info => {
    console.log('Error event:\n' + JSON.stringify(info));
    // handle the error here
  });

client.on("message", function (msg) {
    if (msg.author.id == client.user.id) {
	return;
    }
    if (!msg.content.startsWith('!')) {
	return;
    }

    var args = msg.content.split(' ');
    var input_command = args[0];
    args.shift();

    switch (input_command) {
    case "!debug":
	var final_string = "";
	final_string += client.state + " at " + new Date().toLocaleTimeString() + "\n";
	final_string += "autoreconnect : " + client.autoReconnect.enabled + "\n";
	final_string += "client is connected : " + client.connected + "\n";
	msg.channel.send(final_string);
	break;
    case "!help":
	msg.channel.send("**!calendar** : retourne l'utilisation du calendrier\n" +
		"**!resto?** : retourne les disponibilitées du resto\n" +
		"**!resetresto** : reset le planing du resto\n" +
		"**!disporesto** j (commentaire): défini mes dispo du resto ex : \"!disporesto 124 osef\" pour lundi,mardi,jeudi\n" +
		"**!assault** : affiche le prochain assaut\n" +
		"**!invasion** : affiche la prochaine invasion de la Légion\n" +
		"**!warfront** : affiche le statut des fronts de guerre\n" +
		"**!affixes** : affiche les affixes de donjon de clé mythique de la semaine\n" +
		"**!goplay** : Uniquement pour les mecs MEGA cho2plé ! \n" +
		"**!createcommand cmd display** : crée une commande personnalisée (pour afficher les commandes personnalisées utilisez \"!helpcommand\")\n" +
		"**!removecommand cmd** : supprime une commande personnalisée\n" +
	"**!stream cmd** : gère les notifications de stream (!stream help pour plus d'info)");
	break;
    case "!helpcommand":
	var str = "";
	persist.get_guild_db(msg).collection('commands').get().then(snapshot => {
	    snapshot.forEach((doc) => {
		var prvt_cmd = doc.data();
		str += prvt_cmd.cmd + " by " + prvt_cmd.author.username + "\n";
	    })
	}).then(() => {
	    if(str) {
		msg.channel.send(str);
	    } else {
		msg.channel.send("Aucune commande disponible.");
	    }
	})
	break;
    case "!dev":
	msg.channel.send("https://discord.js.org/#/docs/main/stable/general/welcome");
	break;
    case "!invlink":
	msg.channel.send("https://discordapp.com/oauth2/authorize?scope=bot&client_id=283279977464725504");
	break;
    case "!ping":
	msg.channel.send(msg.author.toString() + " pong !?");
	break;
    case "!dbglistuser":
	var final_str = "------------------\n";
	final_str += "Number of members : " + msg.channel.guild.memberCount + "\n";
	msg.channel.guild.members.cache.forEach(function (mems) {
	    final_str += ("User.id : " + mems.user.id + " / User.username  : " + mems.user.username + "\n");
	    if(final_str.length > 1900){
	        msg.channel.send(final_str);
	        final_str = "";
	    }
	});
	final_str += ("Channel : " + msg.channel.id + " / Guilde  : " + msg.guild.id + "\n");
	msg.channel.send(final_str);
	break;
    case "!resto?":
	displayrestodispo_command(msg);
	break;
    case "!testresto":
	msg.channel.send("!disporesto 1,2,3,4 all");
	break;
    case "!resetresto":
	resto_dispo = {};
	persist.deleteCollection('server/'+ msg.guild.id +'/resto', 500); 
	msg.react("\ud83d\udc4c");
	break;
    case "!cho2plé":
    case "!Goplay":
    case "!goplay":
	var role = msg.guild.roles.cache.find(fn => fn.name == "Cho2Plé !");
	var trigger = msg.member.roles.cache.find(fn => fn.name == "Cho2Plé !");
	if (trigger) {
	    msg.member.roles.remove(role).catch(console.error);
	} else {
	    msg.member.roles.add(role).catch(console.error);
	}
	break;
    case "!affixe":
    case "!affixes":
	affixes_command(msg);
	break;
    case "!assaut":
    case "!assault":
    case "!assaults":
	assaults_command(msg);
	break;
    case "!inva":
    case "!invasions":
    case "!invasion":
	invasion_command(msg);
	break;
    case "!warfront":
	warfront.update(msg);
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
	    msg.channel.send(finale_str);
	} else {
	    msg.channel.send("Pas de vote en cours, \"!votecreate\" pour créer un nouveau vote");
	}
	break;
    case "!votereset":
	question = "";
	answer = [];
	msg.react("\ud83d\udc4c");
	break;
    case "!vote":
	if (question === "") {
	    msg.channel.send("Pas de vote en cours, \"!votecreate\" pour créer un nouveau vote");
	    return false;
	}
	msg.react("\ud83d\udc4c");
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
	    msg.react("\ud83d\udc4c");
	} catch (erno) {
	    msg.channel.send("Erreur sur la commande **\"!votecreate\"**");
	}
	break;
    case "!stream":
	twitch.stream_command(msg, args);
	break;
    case "!dbgMsg":
	if (args[0] == "0") {
	    debug_guild = 0;
	    return;
	}
	debug_guild = msg.guild.id;
	debug_channel = msg.channel.id;
	msg.channel.send("saved on " + debug_guild + " " + debug_channel);
	break;
    case "!calendar":
	calendar_command(msg, args);
	break;
    case "!createcommand":
	var command = {
	    "cmd": "",
	    "msg": "",
	    "author": ""
    };

	command.cmd = args[0];
	if (command.cmd.startsWith('!')) {
	    msg.channel.send("Je m'occupe de rajouter le ! tkt. (Commande non créée)");
	    return;
	}
	command.cmd = '!' + command.cmd;
	command.msg = msg.content.replace(/^([^ ]+ ){2}/, '');
	command.author = msg.author;// JSON.parse(JSON.stringify(msg.author));
	delete command.author.lastMessage;
	delete command.author.client;
	command.author =  JSON.parse(JSON.stringify(command.author));
	var commandRef = persist.get_guild_db(msg).collection('commands').doc(command.cmd)

	commandRef.get().then((snapshot) => {
	    if (snapshot.exists) {
		msg.channel.send("La commande " + command.cmd + " existe déjà.");
	    } else {
		commandRef.set(command);
		msg.channel.send("La commande " + command.cmd + " a été créée.");
	    }
	});
	break;
    case "!removecommand":
	var command_to_remove = args[0];

	if (command_to_remove.startsWith('!')) {
	    msg.channel.send("Je m'occupe de rajouter le ! tkt. (Commande non suppr.)");
	    return;
	}
	command_to_remove = '!' + command_to_remove;
	var commandRef = persist.get_guild_db(msg).collection('commands').doc(command_to_remove)

	commandRef.get().then((snapshot) => {
	    if (snapshot.exists) {
		commandRef.delete();
		msg.channel.send("La commande " + command_to_remove + " a été supprimée");
	    } else {
		msg.channel.send("La commande " + command_to_remove + " n'existe pas.");
	    }
	});
	break;
    case "!botname":
	var name = msg.content.substr(msg.content.indexOf(" ") + 1);
	client.user.setUsername(name);
	msg.channel.send("hoooo yeeaaaa " + name + " débarque !!");
	break;
	case "!initserver":
	var guild_id = msg.guild.id;
	var serverRef = persist.db.collection('server').doc(guild_id);
	serverRef.get().then(snapshot => {
		if (snapshot.exists) {
			msg.channel.send("Votre serveur est déja initialisé.");	
		} else {
			serverRef.set({active : true});
			msg.channel.send("Votre serveur est maintenant initialisé.");	
		}
	});
	break;
    case "!disporesto":
	var date = args[0];
	var comment = "";
	if (args[1] !== undefined) {
	    comment = msg.content.replace(/^([^ ]+ ){2}/, ''); // remove 2
	}
	// st words
	if ((date === undefined) /* ||( resto == undefined) */ ) {
	    msg.channel.send("erreur sur la commande");
	} else {
	    resto_mangeur.date = date;
	    resto_mangeur.comment = comment;

		 if(msg.member.nickname == null)
		resto_mangeur.name = msg.author.username;
	    else
		resto_mangeur.name = msg.member.nickname;
	    var coll = persist.get_guild_db(msg).collection('resto');
	    var docu = coll.doc(msg.author.id);
	    docu.set(resto_mangeur);
	    msg.react("\ud83d\udc4c");
	}
	break;
	default:
	var commandRef = persist.get_guild_db(msg).collection('commands').doc(msg.content)
	commandRef.get().then((snapshot) => {
	    if (snapshot.exists) {
		var url = snapshot.data().msg;
		if(url.match(/\.(jpeg|jpg|gif|png)$/) != null){
		    const attachment = new Attachment(url);
		    msg.channel.send(attachment);
		}else{
		    msg.channel.send(url);
		}
	    } 
	});
    break;
    }
});

function displayrestodispo_command(msg) {
    var final_string = "";
    var comment_string = "";
    var mangeur_list = [];
    var jour = ['', '', '', '', ''];
    var mangeur_counter = [0, 0, 0, 0, 0];

	persist.get_guild_db(msg).collection('resto').get().then(snapshot => {
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
	    msg.channel.send("Personne encore inscrit.\n!disporesto \"jjj\" \"resto\" pour vous inscrire");
	} else {
	    jour.forEach(function (elem, index) {
		final_string += week_day[index] +
		" (" + mangeur_counter[index] + ") : " + elem + "\n";
	    });
	    msg.channel.send(final_string + comment_string);
	}
    });
}

function invasion_command(msg) {
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
	    msg.channel.send({embed: {
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
	    }});
	});
	res.on('error', function (e) {
	    console.log('problem with request: ' + msg + " at " + new Date().toString());
	});
    });
    requests.end();
}

function affixes_command(msg) {
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
	    msg.channel.send({embed: {
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
		    value: "*" + affixes_list[today.getWeek() % 12] + "*"
		}]

	    }});
	});
	res.on('error', function (e) {
	    console.log('problem with request: ' + msg + " at " + new Date().toString());
	});
    });
    requests.end();    
}



function calendar_command(msg, args) {
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
			var user = msg.channel.guild.members.cache.find(u => u.id == tag);
			if (!user) {
			    user_upd.push(ret.player[index]);
			} else {
			    user_upd.push(user.toString());
			}
		    }
		});
		if (noPlayer) {
		    msg.channel.send("tout le monde a rempli");
		} else {
		    msg.channel.send(user_upd + " merci de remplir le calendrier\n<https://docs.google.com/spreadsheets/d/1am4oo8wq7Ho_cJ4KoQpa1hotCbsjwYCwMylAGovy-Bs/edit#gid=0>");
		}
	    } else {
		var name = msg.content.substr(msg.content.indexOf(" ") + 1);
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
		msg.channel.send(final_string);
	    }
	});
	request.on('error', function (e) {
	    console.log(msg);
	});
    });
    request.end();
}

function assaults_command(msg) {
    var alliance_logo = "https://c-8oqtgrjgwu0x24icogrgfkcx2eewtugefpx2eeqo.g00.gamepedia.com/g00/3_c-8yqy.icogrgfkc.eqo_/c-8OQTGRJGWU0x24jvvrux3ax2fx2ficogrgfkc.ewtugefp.eqox2fyqyrgfkcx2fvjwodx2f8x2f82x2fCnnkcpegNqiq.rpix2f022rz-CnnkcpegNqiq.rpix3fk32e.octmx3dkocig_$/$/$/$/$/$/$";
    var horde_logo = "https://c-8oqtgrjgwu0x24icogrgfkcx2eewtugefpx2eeqo.g00.gamepedia.com/g00/3_c-8yqy.icogrgfkc.eqo_/c-8OQTGRJGWU0x24jvvrux3ax2fx2ficogrgfkc.ewtugefp.eqox2fyqyrgfkcx2fgx2fg4x2fJqtfgNqiq.rpix3fx78gtukqpx3d7eh29f66e163g36g57g7g2fhf7f871c2_$/$/$/$/$?i10c.ua=1&i10c.dv=21";
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
	    var faction_color = "";
	    if (allianceZones.includes(zone)) {
		faction_logo = alliance_logo;
		faction_color = 0x144587;
	    } else {
		faction_logo = horde_logo;
		faction_color = 0x8C1616;
	    }
	    msg.channel.send({embed: {
		color: faction_color,
		thumbnail: {
		    url: faction_logo
		},
		author: {
		    name: data.split('\n')[2],
		    icon_url: faction_logo
		},
		description: data.split('\n')[3],
		timestamp: new Date()
	    }});
	});
	res.on('error', function (e) {
	    console.log('Problem with request: ' + msg + " at " + new Date().toString());
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

    var guild = client.guilds.find(g => g.id == debug_guild);
    if (!guild) return console.log("invalid guild");
    var channels = guild.textChannels.find(C => C.id == debug_channel);
    if (!channels) return console.log("invalid channel");

    channels.send(message);
    channels.send("!dbgMsg 0 pour enlever le mode débug");
}

Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    var today = new Date(this.getFullYear(), this.getMonth(), this.getDate());
    var dayOfYear = ((today - onejan + 1) / 86400000);
    return Math.ceil(dayOfYear / 7);
};