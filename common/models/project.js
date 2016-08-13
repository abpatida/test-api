module.exports = function (Project) {

    var async = require('async');


    Project.afterRemote('**', function (ctx, project, next) {
        console.log("After Result01 " + JSON.stringify(ctx.result));
        console.log("Method string " + ctx.methodString);
        ProjectUser = Project.app.models.ProjectUser;
        User = Project.app.models.user;
        if (ctx.methodString == "Project.prototype.__get__members" || ctx.methodString == "Project.prototype.__findById__members") {
            console.log("Project " + ctx.req.params.id);
            User.findById(ctx.req.accessToken.userId, {include: [{relation: "roles"}, {"relation": "projects"}]}, function (err, user) {
                console.log("user " + JSON.stringify(user));
                user = JSON.parse(JSON.stringify(user));
                if (user.roles[0].name == 'superadmin') {
                    next();
                    return;
                } else {
                    if (!user.projects || user.projects.length == 0) {
                        ctx.result = {message: "Not a member of this project"};
                        next();
                        return;
                    }
                    var canView = false;
                    async.forEach(user.projects, function (project, cb1) {
                        if (project.id == ctx.req.params.id) {
                            canView = true;
                        }
                        cb1();
                    }, function () {
                        if (canView) {
                            if(ctx.methodString == "Project.prototype.__findById__members"){
                                next();
                                return;
                            }
                            Project.findById(ctx.req.params.id, {include: [{"relation": "members"}]}, function (err, project) {
                                if (err) {
                                    console.log("Error in getting project memebers " + JSON.stringify(err));
                                    ctx.result = err;
                                    next();
                                } else {
                                    console.log("Got  projects" );
                                    ctx.result = project;
                                    next();
                                }
                            })
                        } else {
                            ctx.result = {message: "Not a member of this project"};
                            next();
                        }
                    })

                }
            })
        } else {
            next();
        }


    })
    Project.afterRemote('*', function (ctx, project, next) {
        console.log("After Result " + JSON.stringify(ctx.result));
        if (ctx.result == null || !ctx.result) {
            next();
            return;
        }
        ProjectUser = Project.app.models.ProjectUser;
        User = Project.app.models.user;
        if (ctx.req) {
            console.log("After access " + JSON.stringify(ctx.req.accessToken));
        }
        console.log("Method string " + ctx.methodString);

        if (ctx.methodString.search("find") > -1) {


            User.findById(ctx.req.accessToken.userId, {include: [{relation: "roles"}, {"relation": "projects"}]}, function (err, user) {
                console.log("user " + JSON.stringify(user));
                user = JSON.parse(JSON.stringify(user));
                if (user.roles[0].name == 'superadmin') {
                    next();
                } else if (!user.projects || user.projects.length == 0) {

                    ctx.result = [];
                    next();
                }
                else {
                    var ids = [];

                    async.forEach(user.projects, function (project, cb1) {
                        console.log("For project " + project.id);
                        ids.push(project.id);
                        cb1();
                    }, function () {
                        console.log("For project 01 ");
                        var mProjects = [];
                        if (ctx.result.id) {
                            if (ids.indexOf(ctx.result.id.toString()) < 0) {
                                ctx.result = [];

                            }
                            next();
                            return;
                        }
                        async.forEach(ctx.result, function (pr, cb2) {
                            console.log("Index " + ids.indexOf(pr.id));
                            if (ids.indexOf(pr.id) > -1) {
                                mProjects.push(pr);
                            }
                            cb2();
                        }, function () {
                            ctx.result = mProjects;
                            console.log("Result " + JSON.stringify(ctx.result));
                            next();
                        })
                    })


                }
            })
        } else {
            next();
        }


    })


}
