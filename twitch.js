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
                      channels.sendMessage(" ", false, {
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
                      });
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
  bar: function () {
    // whatever
  }
};