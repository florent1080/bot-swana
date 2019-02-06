/**
 * http://usejsdoc.org/
 */
const util = require('./file_utils.js');
const https = require('https');
var twitch;
var stream = {};
var index = 0;

var twitch_template = {
    "stream": {},
    "option": {},
    "list": []
};

var ret_value = false;
module.exports = {
  refresh: function (client) {
      twitch = util.read_file("./twitch.json");
      refreshed_counter = 0;

      if (twitch.list === undefined) {
          twitch = twitch_template;
      }
      var name = twitch.list[index++];
      if (index >= twitch.list.length) {
          index = 0;
      }
      var data;
      var data_raw = "";
      var twitch_option = {
          host: "api.twitch.tv",
          path: "/kraken/streams/" + name + "?client_id=qxihlu11ef6gpohfhqb9b27d40u6lj",
          method: 'GET'
      };
      var req = https.request(twitch_option, function (res) {
          if (res.statusCode !== 200) {
              return console.log("invalide status " + res.statusCode + " at " + new Date().toString());
          }
          res.setEncoding('utf8');
          res.on('data', function (raw) {
              data_raw += raw;
          });

          res.on('end', function () {
              var streamer = {
                  "response": "",
                  "update_time": "",
                  "refreshed": ""
              };
              streamer.response = data_raw;
              streamer.update_time = new Date().toString();
              data = JSON.parse(data_raw);
              if (data._links === undefined) {
                  console.log("invalid data");
                  return console.log(data);
              }
              name = data._links.self.split('/');
              name = name[name.length - 1];
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
              if (data.stream !== null) {
                  if (stream[name].refreshed === false) {
                      stream[name].refreshed = true;
                    channel = twitch.option.channel;
                      var guild = client.Guilds.find(g => g.id == twitch.option.guild);
                      if (!guild) {
                          return console.log("invalid guild");
                      }
                      var channels = guild.textChannels.find(C => C.id == channel);
                      if (!channels) {
                          return console.log("invalid channel");
                      }
                      console.log(new Date().toString());
                      console.log(data);
                      if (data.stream.channel.game === "") {
                          data.stream.channel.game = "...";
                      }
                      if (data.stream.channel.status === "") {
                          data.stream.channel.status = "...";
                      }
                      channels.sendMessage({embed: {
                          color: 0x009900,
                          author: {
                              name: name + " is now streaming !",
                              icon_url: "https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png"
                          },
                          title: data.stream.channel.url,
                          url: data.stream.channel.url,
                          timestamp: data.stream.created_at,
                          thumbnail: {
                              url: data.stream.channel.logo,
                              height: 80,
                              width: 80
                          },
                          fields: [{
                              name: "Playing",
                              value: data.stream.channel.game
                          }, {
                              name: "Title",
                              value: data.stream.channel.status
                          }],
                          footer: {
                              text: "stream online"
                          }
                      }});
                  }
              } else {
                  stream[name].refreshed = false;
                  ret_value = false;
              }
          });
      });
      req.on('error', (e) => {
          console.log('problem with request: ' + e.message + " at " + new Date().toString());
      });
      req.end();
      if(stream[name] !== undefined)
	  return stream[name].refreshed;
  },
  
 stream_command:  function(e, args) {
      var msg = e.message;
      var cmd = args[0];
      var twitch = util.read_file("./twitch.json");
      if (twitch.list === undefined) {
          twitch = twitch_template;
      }
      switch (cmd) {
          case "help":
              msg.channel.sendMessage("**!stream add channel** : ajoute le channel twitch à la liste de notification\n" +
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
                          e.message.channel.sendMessage(raw.message);
                      } else {
                          if (twitch.list.pushIfNotExist(streamer)) {
                              util.write_file("./twitch.json", twitch);
                              msg.channel.sendMessage(raw.display_name + ' add to your list');
                          } else {
                              msg.channel.sendMessage(streamer + " is already in your list");
                          }
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
              if (twitch.list !== undefined) {
                  var name = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
                  var index = twitch.list.indexOf(name);
                  if (index > -1) {
                      twitch.list.splice(index, 1);
                      msg.channel.sendMessage(name + " a été supprimé de la liste");
                      stream[name] = "";
                  } else {
                      msg.channel.sendMessage("le channel n'est pas dans la liste");
                  }
                  util.write_file("./twitch.json", twitch);
              }
              break;
          case "list":
              var final_string = "les streams notifiés sont :\n";
              if (twitch.list !== undefined) {
                  twitch.list.forEach(function (elem) {
                      final_string += "> " + elem + "\n";
                  });
              }
              msg.channel.sendMessage(final_string);
              break;
          case "notify":
              break;
          case "channel":
              var channel = msg.content.replace(/^([^ ]+ ){2}/, '').split(" ")[0];
              msg.channel.sendMessage(">les notifications sont activées sur les channels :\n" + channel);
              channel = channel.replace(/[^\/\d]/g, '');
              twitch.option.guild = msg.guild.id;
              twitch.option.channel = channel;
              util.write_file("./twitch.json", twitch);
              break;
          default:
              msg.channel.sendMessage("commande non comprise \n**!stream help** pour la liste des commandes de stream disponibles");
              break;
      }
  },
  bar: function () {
    // whatever
  }
};