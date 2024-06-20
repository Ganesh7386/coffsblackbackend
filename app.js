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

    } catch(e) {
        console.log(e.message);
    }
    
}

let company_database;
let all_data_collection;

connectToMongoCluster();

const getCollectionsDatabase = async ()=> {
    try {
    company_database = await client.db('company_database');
    all_data_collection = await company_database.collection('all_data');
    console.log('got database , collection successfully');
    }
    catch(e) {
        console.log(e.message);
        console.log("error occured during getting database , collection");
    }
}

getCollectionsDatabase();


app.get("/" , (req , res)=> {
    console.log("home route");
    res.send("hello");
})


app.get("/sales/" , async (req , res)=> {
    const foundObj = await all_data_collection.findOne({name : "bharath"});
    console.log(foundObj);

    res.json(foundObj);
})


app.post("/insertInfo/" , async (req , res)=> {
    // const {name  , age} = req.body;
    const insertingId = await all_data_collection.insertOne(req.body);
    console.log(insertingId);

    res.json(insertingId);
})


app.post("/insertManyInfos/" , async (req , res)=> {

    // const {name  , age} = req.body;
    console.log(req.body);
    const insertingId = await all_data_collection.insertMany(req.body);
    console.log(insertingId);

    res.json(insertingId);
})


app.get("/eachsectorcount/" , async(req , res)=> {
    let ok;
    let data;
    let stat;


    try {
    const documentsWithGivenSector = await all_data_collection.find({sector : "Energy"}).toArray();
    // console.log(documentsWithGivenSector);
    data = documentsWithGivenSector;
    ok = true;
    stat = 200;
    } catch(e) {
        console.log(e.message);
        ok = false;
        data = "error occured during retrieving";
        stat = 401;
    }
    console.log({ok , data});
    res.status(stat).json({ok , data});
})


app.listen(port , ()=> {
    console.log(`connected to http://localhost:5001`);
})


