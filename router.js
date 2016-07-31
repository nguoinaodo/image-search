var express = require('express');
var https = require('https');
var router = express.Router();
var bl = require('bl');
var MongoClient = require('mongodb').MongoClient;
var mongoURI = process.env.MONGOLAB_URI;

MongoClient.connect(mongoURI, function(err, db) {
    if (err) console.log('err1');
    var latest = db.collection('latest');
    
    router.use('/api/imagesearch', function(req, res, next) {
        var params = req.url.substr(1).split('?');
        var option = {
            protocol: 'https:',
            host: 'api.cognitive.microsoft.com',
            path: '/bing/v5.0/images/search?q=' + params[0] + '&count=5&' + params[1] + '&safeSearch=Moderate',
            method: 'GET',
            headers: {
                'Ocp-Apim-Subscription-Key': 'f16ea4b024cd47a3b23de993ff14ced7'
            }
        };
        var result = [];
        
        https.get(option, function(response) {
            response.pipe(bl(function(err, data) {
                if (err) console.log('err2');
                var json = JSON.parse(data);
                json.value.forEach(function(item) {
                    result.push({
                        url: item.contentUrl,
                        name: item.name,
                        thumbnail: item.thumbnailUrl,
                        context: item.hostPageDisplayUrl
                    }); 
                });
                res.json(result);
            })); 
        });
        
        latest.find({}).toArray(function(err, items) {
            if (err) console.log('err3');
            var content = items[0].content;
            if (content.length < 10) {
                content.unshift({key: params[0], time: new Date().toISOString()});
            } else {
                content.pop();
                content.unshift({key: params[0], time: new Date().toISOString()});
            };
            latest.update({_id: 0}, {$set: {'content': content}});
        });
        
    });
    
    router.get('/api/latest/imagesearch', function(req, res) {
        latest.find({}, {_id: 0}).toArray(function(err, items) {
            if (err) console.log('err4');
            res.json(items[0].content);
        });
    });
});

module.exports = router;