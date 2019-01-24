/**
 * http://usejsdoc.org/
 */

const fs = require('fs');
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
    }
};
