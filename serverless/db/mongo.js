// mongo.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const { MongoClient, ObjectID } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI, {
  useUnifiedTopology: true,
});

const mongo = {
  connect: async (queryFunc, collectionName = 'socketPool') => {
    try {
      if (!client.isConnected()) {
        await client.connect();
      }
      const db = client.db(process.env.DB_NAME);
      const collection = db.collection(collectionName);
      return await queryFunc(collection);
    } catch (error) {
      console.log(error);
    }
  },
  insertOne: async (doc, collectionName = 'socketPool') => {
    return await mongo.connect(async collection => {
      return await collection.insertOne({
        _id: new ObjectID(),
        ...doc,
      });
    }, collectionName);
  },
  find: async (operation, query = {}, options = {}) => {
    return await mongo.connect(async collection => {
      const cursor = collection.find(query, options);
      if ((await cursor.count()) === 0) {
        console.log('no docs found');
      }
      return await cursor.forEach(operation);
    });
  },
  deleteOne: async (query, collectionName = 'socketPool') => {
    if (!query) {
      throw Error('no query');
    }
    return await mongo.connect(async collection => {
      return await collection.deleteOne(query);
    }, collectionName);
  },
  // will just find first user in db if no query is passed
  findOne: async (query = {}, collectionName = 'users') => {
    return await mongo.connect(async collection => {
      return await collection.findOne(query);
    }, collectionName);
  },
  close: () => {
    client.close().catch(console.log);
  },
};

module.exports = mongo;
