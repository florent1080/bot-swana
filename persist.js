// Firebase
const admin = require('firebase-admin');
var serviceAccount = require('./bot-swana-firebase-adminsdk-u8zhh-8fa53e0908.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
admin.firestore().settings({
    timestampsInSnapshots: true
})
var db = admin.firestore();

module.exports = {
    db,
    get_guild_db: function (msg) {
        try {
            return db.collection('server').doc(msg.channel.guild.id);
        } catch (e) {
            console.log(e);
        }
    },
    deleteCollection(collectionPath, batchSize) {
        var collectionRef = db.collection(collectionPath);
        var query = collectionRef.orderBy('__name__').limit(batchSize);

        return new Promise(function (resolve, reject) {
            deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
    }
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