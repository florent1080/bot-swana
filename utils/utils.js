const fs = require("fs");

module.exports = {

    read_file(file) {
        let object = {};
        try {
            object = JSON.parse(fs.readFileSync(file, "UTF-8"));
        } catch (e) {
            console.log('invalid json read' + file);
            console.log(e.message + " at " + new Date().toString());
            Send_debug_msg('invalid json read' + file + '\n' + e.message + " at " + new Date().toString());
        }

        return object;
    },

    write_file(file, obj) {
        try {
            fs.truncate(file, 0, (err) => { /* catch error */ });
            const writeStream = fs.createWriteStream(file);
            writeStream.on('open', () => {
                writeStream.write(JSON.stringify(obj, null, 2));
                writeStream.end();
            });

        } catch (e) {
            console.log('invalid json write' + file);
            console.log(e.message);
            throw "error";
        }
        /*
         * require("fs").writeFile(file,JSON.stringify(obj, null, 2),'utf8',function
         * (err) { if (err) { console.error('error write in file '+file); } } );
         */
        // console.log("save in file : "+JSON.stringify(obj, null, 2));
    }
};