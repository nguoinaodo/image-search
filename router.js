var https = require("https");
var express = require("express");
var bl = require('bl');
var router = express.Router();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoURI = process.env.MONGOLAB_URI;

router.use('/api/imagesearch', function(req, res, next) {
    // https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=cats&offset=0&count=10&mkt=en-us&safeSearch=Moderate
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
    // Một lỗi làm mình đau đầu: dữ liệu gửi về không liền mạch làm kết nối bị đứt.
    // Giải quyết: nối các đoạn dữ liệu băng module bl (có thể làm bằng tay cũng được).
    https.get(option, function(response) {
        response.pipe(bl(function(err, data) {
            if (err) throw err;
            var json = JSON.parse(data.toString());
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
    // 
    MongoClient.connect(mongoURI, function(err, db) {
        if (err) throw err;
        var collection = db.collection('latest');
        collection.find({_id: 0}).toArray(function(err, items) {
            if (err) throw err;
            var count = items[0].count;
            if (count < 10) {
                collection.insert({_id: count + 1, key: params[0], time: new Date().toISOString()}, function(err) {
                    if (err) throw err;
                    collection.update({_id: 0}, {$set: {count: count + 1}}, function(err) {
                        if (err) throw err;
                        db.close();
                    });
                });
            } else {
                
            }
        });
    });
});

router.get('/api/latest/imagesearch', function(req, res) {
    MongoClient.connect(mongoURI, function(err, db) {
        if (err) throw err;
        var collection = db.collection('latest');
        collection.find({_id: {$gt: 0}}, {_id: 0}).toArray(function(err, items) {
            if (err) throw err;
            res.json(items);
            db.close();
        });
    });
});

///////////
module.exports = router;