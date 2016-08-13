var config = require('../../server/config.json');
var path = require('path');
var GeoPoint = require('loopback').GeoPoint;
var async = require('async');

//var console = new winston.console({transports: transports});

module.exports = function (user) {

    user.afterRemote('**', function (ctx, project, next) {
        console.log("After Result01 " + JSON.stringify(ctx.result) + " " + ctx.methodString);
        if (ctx.result == null || !ctx.result) {
            next();
            return;
        }
        ProjectUser = user.app.models.ProjectUser;
        Project = user.app.models.Project;
        if (ctx.req) {
            console.log("After access " + JSON.stringify(ctx.req.accessToken));
        }
        console.log("Method string " + ctx.methodString);

        if (ctx.methodString == "user.prototype.__get__projects") {


            user.findById(ctx.req.accessToken.userId, {
                include: [{relation: "roles"}, {
                    "relation": "projects"
                }]
            }, function (err, user) {
                console.log("user " + JSON.stringify(user));
                user = JSON.parse(JSON.stringify(user));
                if (user.roles[0].name == 'superadmin') {
                    next();
                }
                else {
                    console.log("Final result ");
                    ctx.result = user.projects;
                    next();
                }

            })
        } else if (ctx.methodString == "user.prototype.__findById__projects") {
            ProjectUser.findOne({
                where: {
                    userId: ctx.req.params.id,
                    projectId: ctx.req.params.fk
                }
            }, function (err, prUser) {
                if (err) {
                    console.log("Error in finding the project and user " + JSON.stringify(err));
                } else if (!prUser) {
                    console.log("Yay01 " + JSON.stringify(prUser));
                    ctx.result = [];
                    next();
                } else {
                    console.log("Yay02 " + JSON.stringify(prUser));
                    next();
                }
            })
        }
        else {
            next();
        }
    })

    user.observe('before save', function (ctx, next) {


        if (ctx.instance) {
            ctx.instance.status = 'created';
            ctx.instance.created = Date.now();
            //console.log('info', 'registering new  user ' + ctx.instance.email );
        }

        next();

    });


    user.afterRemote('login', function (ctx, usr, next) {
        console.log('After remote login ' + usr.userId);


        user.findById(usr.userId, {include: [{relation: "roles"}]}, function (err, data) {


            if (err) {
                console.log('Error ' + JSON.stringify(err));

            } else {
                // console.log("User "+JSON.stringify(data));
                data = JSON.parse(JSON.stringify(data))
                ctx.result.roles = data.meraMohallaRoles;

            }
            next();
        })

    });

    user.afterRemote('create', function (ctx, usr, next) {
        console.log('After create ');

        // console.log('After remote user save1 ' + JSON.stringify(ctx.instance) + ' user ' + JSON.stringify(usr));
        var Role = user.app.models.MeraMohallaRole;
        var RoleMapping = user.app.models.MeraMohallaRoleMapping;

        if (!usr.role) {
            usr.role = 'normal-user';
        }

        Role.findOrCreate(
            {where: {name: usr.role}}, // find
            {name: usr.role, 'description': usr.role}, // create
            function (err, role) {
                if (err) {
                    console.error('Error in creating  role ' + JSON.stringify(err));
                } else {

                    console.log('Created role successfully ');

                    role.principals.create({
                        principalType: RoleMapping.USER,
                        userId: usr.id
                    }, function (err, res) {
                        if (err) {
                            console.log('Error in assigning ' + usr.role + ' role to user ' + JSON.stringify(err));
                        }

                        if (res) {
                            console.log('Successfully assigned ' + usr.role + ' role to user having id ' + usr.id);
                        }
                    })
                }


            });


        console.log('info', 'registration completed, sending verification email %s', usr.email);

        var options = {
            type: 'email',
            to: usr.email,
            from: config.from,
            subject: 'Welcome to Mera Mohalla. Please activate your account',
            template: path.resolve(__dirname, '../../server/views/verify.ejs'),
            user: usr,
            verifyHref: config.domain + '/api/users/confirm?uid=' + usr.id + '&redirect=/verified'
        };

        usr.verify(options, function (err) {
            if (err) {
                console.log('error', 'error in sending email to ' + usr.email, err);

                user.destroyAll({id: usr.id}, function (err, res) {
                    if (err) {
                        console.log('error', 'error in deleting user ' + usr.email, err);
                    }
                });

                next(err);
                return;
            }
            console.log('info', 'verification email sent: ', usr);

            ctx.res.send({data: usr.id});
        });
    });

    //send password reset link when requested
    user.on('resetPasswordRequest', function (info) {
        console.log('info', ' request for password reset ', info);

        var url = config.domain + '/reset-password?access_token=' + info.accessToken.id;

        console.log('info', ' password reset url %s', url);

        var html = '<body style=\'padding: 0; margin: 0;\'>' +
            '<div align=\'center\'>' +
            '<table width=\'100%\' border=\'0\' cellspacing=\'0\' cellpadding=\'0\' bgcolor=\'#f9f8f6\'><tr><td>&nbsp;' +
            '</td></tr><tr><td align=\'center\'>' +
            '<span style=\'font-family: "Roboto Slab", sans-serif; color:#1381bd;font-size:26px;\'>Mera Mohalla</span></td>' +
            '</tr><tr><td>&nbsp;</td></tr>' +
            '<tr><td><table align=\'center\' width=\'700\' border=\'0\' bgcolor=\'#ffffff\'><tr><td><div style=\'color:#58595B;font-size:13px;margin:20px;\'>' +
            '<div style=\'color:#58595B;font-size:13px;margin:20px;\'>' +
            '<div><div style=\'float:left;width:auto;display:inline-block;\'></div>' +
            '<div>Hi, <br><br>We have received a request to reset the password for your account.</div></div>' +
            '<br></b>If you made this request, please click on the link below or paste this into your browser to complete the process: <br><br>' +
            '<div style=\'margin-top:20px;\'><a style=\'text-decoration: none;background-color:#1381bd;color:#fff;display:inline-block;padding: 6px;\' ' +
            'href="' + url + '">' + 'Click to reset your password</a>' + '</div>' +
            '<br><hr><span style=\'float: left;\'>Powered by Zehntech Technologies</span>' +
            '<a style=\'color:#57697e;float:right;text-decoration: none;\' ' +
            'target="_blank" href="">Mera Mohalla<a></div>' +
            '<br></div></tr></table><br><span style=\'color:#999999;font-size:12px;margin-left:40%;\'>' +
            '2016 &copy; ALL Rights Reserved.</span></td></tr><tr><td>&nbsp;</td></tr>' +
            '</table></div></body>';

        user.app.models.Email.send({
            to: info.email,
            from: config.from,
            subject: 'Resetting the password',
            html: html
        }, function (err) {
            if (err) {
                console.log('error', 'error sending password reset email ', err);
                return;
            }
            console.log('info', ' sending password reset email to:', info.email);
        });
    });


    user.emailVerify = function (email, callback) {

        user.findOne({
            where: {email: email}
        }, function (err, user) {
            if (err) {
                return callback(err);
            }
            return callback(null, user ? true : false);
        })

    };
    user.remoteMethod('emailVerify', {
        description: 'To verify user is already exist or not',
        accepts: [
            {arg: 'email', type: 'string', required: true, description: ['User enter email id']}
        ],
        returns: {arg: 'data', type: 'boolean'},
        http: {verb: 'get', path: '/email/verify'}
    });


    user.afterRemote('*', function (ctx, userData, next) {
        console.log("After Result " + JSON.stringify(ctx.result));
        if (ctx.result == null || !ctx.result) {
            next();
            return;
        }
        ProjectUser = user.app.models.ProjectUser;
        Project = user.app.models.Project;
        if (ctx.req) {
            console.log("After access " + JSON.stringify(ctx.req.accessToken));
        }
        console.log("Method string " + ctx.methodString);
        console.log("Matched01 " + ctx.methodString.search("find"));
        if (ctx.methodString.search("find") > -1) {
            console.log("Matched " + ctx.methodString.search("find"));

            user.findById(ctx.req.accessToken.userId, {
                include: [{relation: "roles"}, {
                    "relation": "projects",
                    scope: {include: [{relation: "members"}]}
                }]
            }, function (err, user) {
                console.log("user " + JSON.stringify(user));
                user = JSON.parse(JSON.stringify(user));
                if (user.roles[0].name == 'superadmin') {
                    next();
                } else if (!user.projects || user.projects.length == 0) {
                    console.log("Blank ");
                    ctx.result = [];
                    next();
                }
                else {
                    var ids = [];
                    var mMembers = [];
                    var canView = false;
                    async.forEach(user.projects, function (project, cb1) {
                        async.forEach(project.members, function (member, cb2) {
                            console.log("For member " + member.id);
                            if ((ctx.methodString == "user.findById"||ctx.methodString == "user.findOne" ) && ctx.result.id == member.id) {
                                canView = true;
                            }
                            if (ids.indexOf(member.id) > -1) {

                            } else {
                                ids.push(member.id);
                                mMembers.push(member);
                            }

                            cb2();
                        }, function () {


                        })
                        cb1();
                    }, function () {
                        console.log("here");
                        if ((ctx.methodString == "user.findById"||ctx.methodString == "user.findOne" ) && canView) {
                             console.log("Can view01");
                            next();
                        } else if ((ctx.methodString == "user.findById"||ctx.methodString == "user.findOne" ) && !canView) {
                            ctx.result = [];
                            next();
                        } else {
                            ctx.result = mMembers;
                            next();
                        }

                    })


                }
            })
        } else {
            next();
        }


    })
};
