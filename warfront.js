/**
 * http://usejsdoc.org/
 */

const
https = require('https');
var alliance_logo = "https://c-8oqtgrjgwu0x24icogrgfkcx2eewtugefpx2eeqo.g00.gamepedia.com/g00/3_c-8yqy.icogrgfkc.eqo_/c-8OQTGRJGWU0x24jvvrux3ax2fx2ficogrgfkc.ewtugefp.eqox2fyqyrgfkcx2fvjwodx2f8x2f82x2fCnnkcpegNqiq.rpix2f022rz-CnnkcpegNqiq.rpix3fk32e.octmx3dkocig_$/$/$/$/$/$/$";
var horde_logo = "https://c-8oqtgrjgwu0x24icogrgfkcx2eewtugefpx2eeqo.g00.gamepedia.com/g00/3_c-8yqy.icogrgfkc.eqo_/c-8OQTGRJGWU0x24jvvrux3ax2fx2ficogrgfkc.ewtugefp.eqox2fyqyrgfkcx2fgx2fg4x2fJqtfgNqiq.rpix3fx78gtukqpx3d7eh29f66e163g36g57g7g2fhf7f871c2_$/$/$/$/$?i10c.ua=1&i10c.dv=21";

module.exports = {

	update : function(msg) {

	    var warfront_option = {
		    host : "www.wowhead.com",
		    path : "/",
		    method : 'GET'
	    };
	    var data_raw;
	    var req = https.request(warfront_option, function(res) {
		if (res.statusCode !== 200) {
		    return console.log("invalide status " + res.statusCode + " at "
			    + new Date().toString());
		}
		res.setEncoding('utf8');
		res.on('data', function(raw) {
		    data_raw += raw;
		});

		res.on('end', function() {
		    var data = data_raw;
		    data = data.split("tiw-timer-EU")[1];
		    var data_array = data.split("<table class=\"tiw-group tiw-blocks-warfront\">");
		    data_array.shift();
		    var array_warfront = [];
		    var warfront = {};
		    for (var warfront_index = 0; warfront_index < data_array.length; warfront_index++) {
			array_warfront[warfront_index] = data_array[warfront_index].split("</table>")
			.shift();
			array_warfront[warfront_index] = array_warfront[warfront_index].replace(/<\/?[^>]+(>|$)/g, "");
			array_warfront[warfront_index] = array_warfront[warfront_index].replace(/  +/g," ").replace(/\s\s+/g,"/")/* .replace(/\r?\n|\r/g,"") */;
			warfront.location = array_warfront[warfront_index].split('/')[1];
			warfront.purpose = array_warfront[warfront_index].split('/')[2];
			warfront.value = array_warfront[warfront_index].split('/')[3];
			array_warfront[warfront_index] = warfront;

			var faction_logo = "";
			var not_faction_logo = "";
			var faction_color = "";
			if (array_warfront[warfront_index].purpose.includes("Horde")) {
			    faction_logo = horde_logo;
			    not_faction_logo = alliance_logo;
			    faction_color = 0x8C1616;
			} else {
			    faction_logo = alliance_logo;
			    not_faction_logo = horde_logo;
			    faction_color = 0x144587;
			}
			var warfront_image = "";
			if(array_warfront[warfront_index].location.includes("Darkshore")){
			    warfront_image = "https://i.imgur.com/sxYhgOY.png"
			}else{
			    warfront_image = "https://i.imgur.com/lEJ9T55.png"
			}
			if(array_warfront[warfront_index].value.includes("day")){
			    array_warfront[warfront_index].value += " left";
			}
			if(array_warfront[warfront_index].value.includes("%")){
			    array_warfront[warfront_index].value += " done";
			}
			msg.channel.send({embed: {
			    color: faction_color,
			    author: {
				name: array_warfront[warfront_index].location,
				icon_url: faction_logo
			    },
			    timestamp: new Date(),
			    image: {
				url: warfront_image
			    },
			    thumbnail: {
				url: faction_logo
			    },
			    fields: [{
				name: array_warfront[warfront_index].purpose,
				value: array_warfront[warfront_index].value
			    }],
			    footer: {
				text: ""
			    }
			}});

		    }
		});
	    });
	    req.on('error', function(e) {
		console.log('problem with request: ' + e.message + " at "
			+ new Date().toString());
	    });
	    req.end();
	}
}