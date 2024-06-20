const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

const {client , connectToCluster} = require('./mongodbconnection');


app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
const port = process.env.port || 5001;

const connectToMongoCluster = async ()=> {

    try {
    await connectToCluster();
    console.log("connected to mongo cluster");
    // console.log(client);

    } catch(e) {
        console.log(e.message);
    }
    
}

connectToMongoCluster();


app.get("/" , (req , res)=> {
    console.log("home route");
    res.send("hello");
})


app.get("/sales/" , async (req , res)=> {
    const company_database = await client.db('company_database');
    const all_data_collection = await company_database.collection('all_data');
    const foundObj = await all_data_collection.findOne({name : "bharath"});
    console.log(foundObj);

    res.json(foundObj);
})


app.post("/insert/" , async (req , res)=> {

    // const {name  , age} = req.body;
    console.log(req.body);

    const company_database = await client.db('company_database');
    const all_data_collection = await company_database.collection('all_data');
    const insertingId = await all_data_collection.insertOne(req.body);
    console.log(insertingId);

    res.json(insertingId);
})


app.listen(port , ()=> {
    console.log(`connected to http://localhost:5001`);
})


