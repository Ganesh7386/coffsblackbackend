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


app.get("/sales" , async (req , res)=> {
    const company_database = await client.db('company_database');
    const all_data_collection = await company_database.collection('all_data');
    const got_data = await all_data_collection.findOne({end_year : 2027});
    console.log(got_data);

    res.json(got_data);
})


app.listen(port , ()=> {
    console.log(`connected to http://localhost:5001`);
})


