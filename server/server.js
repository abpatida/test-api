'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var app = module.exports = loopback();

var http = require('http');
var flash = require('express-flash');
var bodyParser = require('body-parser');
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

var config = {};
try {
    config = require('../providers.json');
} catch (err) {
    console.trace(err);
    process.exit(1); // fatal
}

// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());


// configure view handler
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));


app.use(flash());



var async = require('async');

// The ultimate error handler.
app.use(loopback.errorHandler());
console.log('Here');



app.start = function () {

    var server = http.createServer(app);
    server.listen(app.get('port'), function () {
        var baseUrl = ('http://') + app.get('host') + ':' + app.get('port');
        console.log('BaseUrl ' + baseUrl);
        app.emit('started', baseUrl);
        console.log('LoopBack server listening @ %s%s', baseUrl, '/');

    });

    return server;
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
    if (err) {
        logger.log('error', 'Server error ', err);
        throw err;
    }

    // start the server if `$ node server.js`
    if (require.main === module) {
       app.start();
    }
});
