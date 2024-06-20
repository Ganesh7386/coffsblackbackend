const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require("dotenv");
const { urlencoded } = require('express');
dotenv.config();


const url = process.env.MONGO_DB_URL;
console.log(url);


const client = new MongoClient(url , {
    serverApi: ServerApiVersion.v1
})

const connectToCluster = async ()=> {

    try {
    await client.connect();
    console.log("successfully connected to db");
    // console.log(promise);
    }
    catch(e) {
        console.log(e.message);
    }
}

connectToCluster();


module.exports = {client , connectToCluster};

