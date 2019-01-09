const utils = require("../utils/utils");

let resto_dispo = {};

module.exports = {
    get_registered_eaters() {
        const eater_list = [];
        let message;

        var final_string = "";
        var comment_string = "";
        var jour = ['', '', '', '', ''];
        resto_dispo = utils.read_file("./resto.json");
        var mangeur_counter = [0, 0, 0, 0, 0];

        for (let eater_index in resto_dispo) {
            if (!resto_dispo.hasOwnProperty(eater_index)) {
                continue;
            }
            const eater = resto_dispo[eater_index];

            eater_list.push(eater_index);
            // console.log("resto_dispo : ");
            // console.log(resto_dispo[mangeur]);
            arr = eater.date.split("").filter(function(item, index, inputArray) { // remove
                // duplicate
                // day
                return inputArray.indexOf(item) === index;
            });

            arr.forEach((j, index) => { // sort day
                if (j <= 5) {
                    // console.log("jour : " + j + " " +
                    // resto_dispo[mangeur]["name"]);
                    jour[j - 1] += (eater.name + ", ");
                    mangeur_counter[j - 1] += 1;
                }
            });

            // console.log(jour);
            if (typeof eater.comment !== "undefined" && eater.comment !== '') {
                comment_string += eater.name + " : " + eater.comment + "\n";
            }
        }

        if (eater_list.length === 0) {
            // planing
            message = "Personne encore inscrit.\n!disporesto \"jjj\" \"resto\" pour vous inscrire";
        } else {
            // final_string += mangeur_list + " sont dispo pour le
            // resto\n";
            jour.forEach((elem, index) => {
                final_string += `${week_day[index]} (${eater_list[index]}): ${elem} \n`;
            });
            // console.log("final_string : " + final_string +
            // comment_string);
            message = final_string + comment_string;
        }

        return message;
    },

    clear_eaters() {
        resto_dispo = {};
        try {
            utils.write_file("./resto.json", resto_dispo);
        } catch(e) {
            return false;
        }
        // e.message.channel.sendMessage("planning du resto reset");
        return true;
    },

    register_eater(msg) {
        const content = msg.content.split(" ");
        const date = content[1];
        let comment = "";

        if (typeof content[2] !== "undefined")
            comment = msg.content.replace(/^([^ ]+ ){2}/, ''); // remove 2
        // st words
        if (typeof date === "undefined") {
            return false;
        } else {
            const eater = {
                date,
                comment,
                name: msg.displayUsername
            };

            resto_dispo = utils.read_file("./resto.json");
            resto_dispo[msg.author.mention] = eater;
            utils.write_file("./resto.json", resto_dispo);

            return true;
        }
    }
};