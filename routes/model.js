var express = require('express');
var router = express.Router();
var fs = require('fs');
var Twitter = require('twitter');
var util = require("util");
let {PythonShell} = require('python-shell')

var client = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

var params = {screen_name: 'nodejs'};

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('check the console to see some tweets');
  if (req.query.task == "download") {
    //call python child process
    util.log('readingin');

    var spawn = require("child_process").spawn;
    var process = spawn('python',["routes/makeTargetLists.py","routes/output.csv"]);
    
    var positiveFile = '/routes/positiveOutput.csv';
    var negativeFile = 'routes/negativeOutput.csv';
    if (req.query.status == 'negative') {
        res.download(negativeFile); // Set disposition and send it.
    }
    else if (req.query.status == 'positive') {
        res.download(positiveFile);
    }
  }
  else {
    client.get('search/tweets', {q: req.query.data, count: 300, lang: 'en', exclude: 'retweets'}, function(error, tweets, response) {
      var json = JSON.stringify(tweets,null,4);
      fs.writeFile("routes/input.json",json);
  
      var options = {
        args : "input.json"
      }
  
      //call python child process
      util.log('readingin');
  
      PythonShell.run('routes/read_predict.py',null,function(err) {
        if (err) throw err;
        console.log("finished predictions !");
        PythonShell.run('routes/makeTargetLists.py',null,function(err) {
          if (err) throw err;
          console.log("finished target lists !");
        });
      });
      
      //after that, output.csv is generated by the python sub-routine in routes/output.csv
      //process the output.csv
      res.render('model', {titre : req.query.data});
  
   });
  }
  
});



module.exports = router;
