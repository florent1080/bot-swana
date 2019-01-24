/**
 * http://usejsdoc.org/
 */

const
fs = require('fs');
module.exports = {
    write_file : function(file, obj) {
	try {
	    var json = JSON.stringify(obj);
	    fs.writeFileSync(file, json);
	} catch (e) {
	    console.log('invalid json write' + file);
	    console.log(e.message);
	}
    },
    read_file : function(file) {
	var object;
	try {
	    object = JSON.parse(fs.readFileSync(file, "UTF-8"));
	} catch (e) {
	    console.log('invalid json read ' + file);
	    console.log(e.message + " at " + new Date().toString());
	    object = {};
	}
	return object;
    },
    parse : function(data) {
	try {
	    var update_col = 11, tag_col = 13, date_col = 4;
	    var i = 0;
	    var retArray = {
		'player' : [],
		'upd' : [],
		'tag' : [],
		'jour' : []
	    };
	    var tmp_jour = [];
	    data = data.replace("// API callback\ndoData(", '');
	    var subdata = data.substring(-1, data.lastIndexOf(');'));
	    subdata = JSON.parse(subdata);
	    subdata.feed.entry
		    .forEach(function(element, index) {
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
				retArray.player.push(element.gs$cell.$t);
				// console.log("i player : "+i+" of
				// "+element.gs$cell.$t);
				tmp_jour = [];
			    }
			    if (element.gs$cell.col == update_col) {
				retArray.upd[i - 1] = element.gs$cell.$t;
				// console.log("i upd : "+i+" of
				// "+element.gs$cell.$t);
			    }
			    if (element.gs$cell.col == tag_col) {
				retArray.tag[i - 1] = element.gs$cell.$t;
				// console.log("i tag : "+i+" of
				// "+element.gs$cell.$t);
			    }
			    if ((element.gs$cell.col >= date_col)
				    && (element.gs$cell.col < (date_col + 7))) {
				// console.log("date_col :
				// "+element.gs$cell.col);
				tmp_jour[element.gs$cell.col - date_col] = element.gs$cell.$t;
				retArray.jour[i - 1] = tmp_jour;
			    }
			}
		    });
	    retArray.player.pop();
	    return retArray;
	} catch (e) {
	    console.log('invalid json');
	    console.log(e);
	}
    }
};
