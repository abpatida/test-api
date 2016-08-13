var config = require('../config.json');
var request = require('request');
module.exports = function (app) {
    var User = app.models.user;

    //verified
    app.get('/verified', function (req, res) {

              console.log('> verified successfully');
                res.writeHead(303, {
                    'Location': config.domain + '/#!/'
                });
                res.end();
    });


  //send an email with instructions to reset an existing user's password
  app.post('/request-password-reset', function(req, res, next) {
    User.resetPassword({
      email: req.body.email
    }, function(err) {
      if (err) return res.status(401).send(err);

      res.render('response', {
        title: 'Password reset requested',
        content: 'Check your email for further instructions',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
    });
  });

    //show password reset form
    app.get('/reset-password', function (req, res,next) {

        if (!req.accessToken) return res.sendStatus(401);

        res.render('password-reset', {
            accessToken: req.accessToken.id
        });
    });

     app.get('/currentLocation', function (req, res,next) {
         console.log(req.connection.remoteAddress);
         console.log(req.connection.remoteAddress.length);
         var ip = req.connection.remoteAddress.substring(7,req.connection.remoteAddress.length);

    console.log("In current location "+ip);
      request('http://ip-api.com/json/'+ip,function(err,response,body){
          console.log("response "+response.statusCode);
          if(err){
              console.log('Error '+JSON.stringify(err));
              res.status(405).send(err);
          }else if(response.statusCode==200){
              console.log("Body "+body);
              body = JSON.parse(body);
              if(body.status=="fail"){
                res.status(405).send(body);
              }else{
                   res.status(200).send(JSON.parse(body));
              }

          }
      })
    });


    //reset the user's password
    app.post('/reset-password', function (req, res, next) {
        if (!req.accessToken) return res.sendStatus(401);


        //verify passwords match
        if (!req.body.password || !req.body.confirmation ||
            req.body.password !== req.body.confirmation) {
            return res.sendStatus(400, new Error('Passwords do not match'));
        }

        User.findById(req.accessToken.userId, function (err, user) {
            if (err) return res.sendStatus(404);
            user.updateAttribute('password', req.body.password, function (err) {
                if (err) return res.sendStatus(404);
                console.log('> password reset processed successfully');
                res.writeHead(303, {
                    'Location': config.domain+'/#/'
                });
                res.end();
            });
        });
    });

    app.get('/auth/facebook/callback', function (req, res, next) {
        console.log("In auth facebook callback");
    });

    // app.get('/auth/facebook', function (req, res, next) {
    //    console.log("In auth facebook callback");
    //});


};
