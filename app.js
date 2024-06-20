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
    console.log(client);

    } catch(e) {
        console.log(e.message);
    }
    
}

connectToMongoCluster();


app.get("/" , (req , res)=> {
    console.log("home route");
    res.send("hello");
})



app.listen(port , ()=> {
    console.log(`connected to http://localhost:5001`);
})


