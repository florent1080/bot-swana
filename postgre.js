const { Client } = require('pg');

const postgre = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

postgre.connect();
module.exports = {
	create: function() {
		postgre.query("CREATE TABLE 'command' ('index' INT NOT NULL AUTO_INCREMENT , PRIMARY KEY ('index'),'cmd' TEXT NOT NULL , 'msg' TEXT NOT NULL , 'author' TEXT NOT NULL );", (err, res) => {
		  console.log(err ? err.stack : res.rows[0].message) // Hello World!
		  postgre.end();
		});
	}
}