var express = require("express");
var router = require("./router2");
var app = express();

app.use(express.static('public'));
app.use(router);

app.listen(process.env.PORT, function() {
    console.log('app is listening'); 
});