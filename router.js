var https = require("https");
var express = require("express");
var bl = require('bl');
var router = express.Router();

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
    
    var request = https.get(option, function(response) {
        response.pipe(bl(function(err, data) {
            if (err) throw err;
            var json = JSON.parse(data.toString());
            json.value.forEach(function(item) {
                result.push({
                    url: item.contentUrl,
                    snippet: item.name,
                    thumbnail: item.thumbnailUrl,
                    context: item.hostPageDisplayUrl
                });
            });
            res.json(result);
        }));
    });
});

///////////
module.exports = router;