// mongo.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const { MongoClient, ObjectID } = require('mongodb');

// Repetitive operations of connecting to mongo
// Keep in mind each lambda function should cleanly call client.close()
// Even though in monolith mode only one connection should be made
const connectDB = async (collectionName = 'socketPool') => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(collectionName);
    return {
      collection,
      client,
      db,
    };
  } catch (error) {
    console.log(`connecting error: ${error}`);
  }
};

const insertDoc = doc => {
  return {
    _id: new ObjectID(),
    ...doc,
  };
};

const updateDoc = doc => {
  return { $set: doc };
};

module.exports = {
  connectDB,
  insertDoc,
  updateDoc,
};
