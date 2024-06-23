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
        const pipeline = [{$match : {sector : {$ne : ''}}},{$group : {_id : '$sector' , totalCount : {$sum : 1}}} , {$project : {_id : 0 , sector : '$_id' , totalCount :'$totalCount' }}];
        const documentsWithGivenSector = await all_data_collection.aggregate(pipeline).toArray();
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

app.post("/storeeachsectorvscount/" , async (req , res)=> {
    try {
    console.log(req.body);
    const sectorVsCountCollection = await company_database.collection('sectorvscount');
    const previousDocs = await sectorVsCountCollection.find({}).toArray();
    console.log("no previous docs");
    console.log("inserting given doc");
    if(Array.isArray(req.body)) {
        const insertingId = await sectorVsCountCollection.insertMany(req.body);
        console.log(insertingId);
    }
    else {
        console.log("came is object");
        const insertingId = await sectorVsCountCollection.insertOne(req.body);
        console.log(insertingId);
    }

    res.status(200).json({ok : true , data : "data inserted"});
    }
    catch(e) {
        console.log(e.message);
        res.status(404).json({ok : false , data : e.message});
    }
})

app.get("/pestlevslistofsectors/" , async (req , res)=> {

    try {
    const pipeline = [{$match : {sector : {$ne : ''},pestle : {$ne : ''} }} ,{ $group: { _id: '$pestle', sectors: { $addToSet: '$sector' } } }, { $project: { _id: 0, pestle: '$_id', sectors: 1 } }];
    const dataOfPestleVsListofsectors = await all_data_collection.aggregate(pipeline).toArray();
    console.log(dataOfPestleVsListofsectors);
    res.status(200).json({ok : true , data : dataOfPestleVsListofsectors})
    } catch(e) {
        console.log(e.message);
        res.status(501).json({ok : false , data : "error occured while querying"});
    }

})


app.get("/pestle-vs-avgrelevance-in-given-end-year/:endYear/" , async (req , res)=> {
    const {endYear} = req.params;
    console.log(typeof(parseInt(endYear , 10)));
    console.log(endYear)
    // res.send("query sent");
    try {
        const pipeline = [
            { 
              $match: { 
                end_year: { $ne: '' }, 
                $or: [
                  { pestle: { $ne: '' } },
                  { sector: { $ne: '' } }
                ]
              } 
            },
            { $match: { end_year: parseInt(endYear) } },
            { 
              $facet: {
                byPestle: [
                  { 
                    $group: { 
                      _id: '$pestle', 
                      averageRelevance: { $avg: '$relevance' },
              averageIntensity : {$avg : '$intensity'}
                    } 
                  },
                  { 
                    $project: { 
                      _id: 0, 
                      pestle: '$_id', 
                      averageRelevance: { $round: ['$averageRelevance', 1] },
                  averageIntensity : {$round : ['$averageIntensity' ,1]} 
                    } 
                  }
                ],
                bySector: [
                  {$match : {sector : {$ne : ''}}},  
                  { 
                    $group: { 
                      _id: '$sector', 
                      averageRelevance: { $avg: '$relevance' }, 
                      averageIntensity: { $avg: '$intensity' } 
                    } 
                  },
                  { 
                    $project: { 
                      _id: 0, 
                      sector: '$_id', 
                      averageRelevance: { $round: ['$averageRelevance', 1] }, 
                      averageIntensity: { $round: ['$averageIntensity', 1] } 
                    } 
                  }
                ]
              }
            }
          ]
        const pestleVsAvgRelevanceWithGivenYearData = await all_data_collection.aggregate(pipeline).toArray();
        console.log(pestleVsAvgRelevanceWithGivenYearData);
        res.status(200).json({ok : true , data : pestleVsAvgRelevanceWithGivenYearData});
    }
    catch(e) {
        console.log(e.message);
        res.status(500).json({ok : false ,data : "Internal query processing error occured"});
    }
})


app.get('/avgIntensity-avgRelevance-forGivenTopic/:givenTopic' , async(req , res)=> {
  const {givenTopic} = req.params;
  try {
      const pipeline = [
           { $match: { topic: { $ne: '' } } },
           { $match: { topic: givenTopic } },
           { $facet: {
               averageByEndYear: [
                 { $match: { end_year: { $ne: '' } } },
                 { $group: { _id: '$end_year', averageRelevance: { $avg: '$relevance' }, averageIntensity: { $avg: '$intensity' } } },
                 { $project: { _id: 0, endYear: '$_id', averageRelevance: { $round: ['$averageRelevance', 1] }, averageIntensity: { $round: ['$averageIntensity', 1] } } }
               ],
               countByCountry: [
                 { $group: { _id: '$country', count: { $sum: 1 } } },
                 { $project: { _id: 0, country: '$_id', count: '$count' } },
                 { $match: { country: { $ne: '' } } }
               ]
             }
           }
         ]
      const retrievedData = await all_data_collection.aggregate(pipeline).toArray();
      console.log(retrievedData);
      res.status(200).json({ok : true , data : retrievedData });
  }
  catch(e) {
    console.log(e.message);
    res.status(500).json({ok : false , data : e.message});
  }
})

// app.get("/pestlesyear/:year/" , async (req , res)=> {
//     const {year} = req.params;
//     console.log(typeof(parseInt(year , 10)));
//     console.log(year)
//     // res.send("query sent");
//     try {
//         const pipeline = [{$match : {end_year : parseInt(year)}}];
//         const pestleVsAvgRelevanceWithGivenYearData = await all_data_collection.aggregate(pipeline).toArray();
//         console.log(pestleVsAvgRelevanceWithGivenYearData);
//         res.status(200).json({ok : true , data : pestleVsAvgRelevanceWithGivenYearData});
//     }
//     catch(e) {
//         console.log(e.message);
//         res.status(500).json({ok : false ,data : "Internal query processing error occured"});
//     }
// })





app.listen(port , ()=> {
    console.log(`connected to http://localhost:5001`);
})


