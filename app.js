const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require("body-parser");
const {client , connectToCluster} = require('./mongodbconnection');

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(bodyParser.json());
app.use(express.json());

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow frontend on port 3000
        methods: ["GET", "POST"]
    }
});

// Set up the socket connection
io.on('connection', (socket) => {
    console.log('New client connected');
    console.log(socket.id);
    socket.on("sendData" , (info)=> {
      console.log(info);
      socket.emit("receiveMsgAfterJoin" , "received data");
    })
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


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

// Sample route to check if the server is running
app.get("/" , (req , res)=> {
    console.log("home route");
    res.send("hello");
})

app.get("/getio" , (req , res)=> {
  console.log("io");
})
=======
app.get("/addedroute" ,  (req , res)=> {
  res.send("now added route");
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

// added
app.get('/avgWeightedLikelihood-in-each-country-for-given-sector/:givenSector' , async(req , res)=> {
  const {givenSector} = req.params;
  try {
        const pipeline = [
          { 
              $match: { sector: givenSector } 
          },
          { 
              $match: { country: { $ne: '' } } 
          },
          {
              $addFields: {
                  lowerCountry: { $toLower: "$country" }
              }
          },
          { 
              $facet: {
                  weightedLikeLihoodRelatedData: [
                      { 
                          $group: {
                              _id: "$lowerCountry",
                              totalWeightedLikelihood: { $sum: { $multiply: ["$likelihood", "$relevance"] } },
                              totalRelevance: { $sum: "$relevance" }
                          }
                      },
                      { 
                          $project: {
                              _id: 0,
                              country: "$_id",
                              avgWeightedLikelihood: { $round: [{ $divide: ["$totalWeightedLikelihood", "$totalRelevance"] }, 1] }
                          }
                      }
                  ],
                  avgRelevanceIntensityRelatedData: [
                      { 
                          $group: {
                              _id: "$lowerCountry",
                              avgRelevance: { $avg: "$relevance" },
                              avgIntensity: { $avg: "$intensity" }
                          }
                      },
                      { 
                          $project: {
                              _id: 0,
                              country: "$_id",
                              averageRelevance: {$round :  ["$avgRelevance",1]},
                              averageIntensity: {$round : ["$avgIntensity",1]}
                          }
                      }
                  ]
              }
          }
      ];
  const gotavgWeightedLikelihoodForEachCountryData = await all_data_collection.aggregate(pipeline).toArray();
  res.status(200).json({ok : true , data : gotavgWeightedLikelihoodForEachCountryData});
  }
  catch(e) {
    res.status(500).json({ok : false , data : e.message});
  }
  

})

// added 
app.get('/stats-according-to-given-region/:givenRegion' , async(req , res)=> {
  const {givenRegion} = req.params;
  try {
    const pipeline = [
      { $match: { region: 'Northern America' } },
      {
        $facet: {
          avgRelevanceIntensityForEachTopicRelatedData: [
      { $match : {topic : {$ne : ''}} },
            { $group: { _id: '$topic', averageRelevance: { $avg: '$relevance' }, averageIntensity: { $avg: '$intensity' } } },
            { $project: { _id: 0, topic: '$_id', averageIntensity: { $round: ['$averageIntensity', 1] }, averageRelevance: { $round: ['$averageRelevance', 1] } } },
            { $sort: { topic: 1 } }
          ],
          avgRelevanceIntensityForEachSectorRelatedData: [
            { $match: { sector: { $ne: '' } } },
            { $group: { _id: '$sector', avgRelevance: { $avg: '$relevance' }, avgIntensity: { $avg: '$intensity' } } },
            { $project: { _id: 0, sector: '$_id', averageRelevance: { $round: ['$avgRelevance', 1] }, averageIntensity: { $round: ['$avgIntensity', 1] } } },
            { $sort: { sector: 1 } }
          ],
          noOfSourcesRelatedData: [
            { $match: { source: { $ne: '' } } },
            { $group: { _id: '$source', countOfSource: { $sum: 1 } } },
            { $project: { _id: 0, source: '$_id', countOfEachSource: '$countOfSource' } },
            { $sort: { countOfEachSource: -1 } }
          ],
          averageLikelihoodForEachTopiceRelatedData : [
            {$group : {_id : '$topic', avgLikelihood : {$avg : '$likelihood'} } },
            {$project : { _id : 0 , source : '$_id' , averageLikelihood : { $round : ['$avgLikelihood' , 1] } }},
            {$sort : {averageLikelihood : -1 } }
          ]
        }
      }
    ]
    
    const gotRelatedStats = await all_data_collection.aggregate(pipeline).toArray();

    res.status(200).json({ok : true , data : gotRelatedStats});
  }
  catch(e) {
    console.log(e.message);
    res.status(500).json({ok : false , data : e.message});
  }
})


app.get("/stats-according-to-given-source/:givenSource" , async(req , res)=> {
  const {givenSource} = req.params;
  try {
    const pipeline1 = [
        { $match : { country : { $ne : '' }}},
        {$match : {source :givenSource } },
        { $group : {_id : '$country' , listOfTitles : {$push : '$title'}}},
        { $project : {_id : 0 , country : '$_id' , listOfTitles : '$listOfTitles' , eachSize : {$size : '$listOfTitles' } }},
        { $sort : {country : 1} }
      ]
      const pipeline2  = [
        { $match : {country : {$ne : ''}} },
        { $match : {source : givenSource}},
        { $group : {_id : '$country' , listOfTopics : {$push : '$topic'} }},
        {$project : {_id : 0 , country : '$_id' , listOfTopics : '$listOfTopics' , eachSize : {$size : '$listOfTopics'} } },
        { $sort : {country : 1} }
      ]

      const pipeline3 = [
        {$match : { pestle: {$ne : ''}}},
        {$match : {source : givenSource }},
        {$group : {_id : null , listOfPestles : {$addToSet : '$pestle'} } },
        {$project : {_id : 0 , pestle : '$pestle' , listOfPestles : '$listOfPestles'}}
      ]
      const pipeline4 = [
        {$match : {pestle : {$ne : ''}}},
        {$match : {country : {$ne : ''}}},
        {$match : {source : givenSource } },
        {$group : {_id : null , listOfCountries : {$addToSet : '$country'}}},
        {$project : {_id : 0 , listOfCountries : '$listOfCountries'} }
      ]
      console.log(pipeline4);

      const allStatsData = await all_data_collection.aggregate([
        {$facet : {gettingListOfTitlesForEachCountryRelatedData : pipeline1 , gettingListOfTopicsForEachCountry : pipeline2 , gettingListOfPestleForGivenSourceRelatedData : pipeline3 , gettingListOfCountriesForGivenSourceRelatedData : pipeline4 }}
      ]).toArray();

      res.status(200).json({ok : true , data : allStatsData});

  }
  catch(e) {
    console.log(e.message);
    res.status(500).json({ok : false , data : e.message});
  }
  
})


// Make sure the server is listening
const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
