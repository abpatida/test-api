'use strict';

// to enable these logs set `DEBUG=boot:02-load-users` or `DEBUG=boot:*`

var async = require('async');

module.exports = function (app) {

    var User = app.models.User;
    var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;
    var Project = app.models.Project;
    var ProjectUser = app.models.ProjectUser;

    var users = [];
    var roles = [{
        name: 'superadmin',
        users: [{
            name: 'Admin User',
            email: 'admin@testapi.com',
            username: 'admin',
            password: 'admin',
            emailVerified: true
        }]
    }, {
        name: 'normaluser',
        users: [{
            name: 'Dev01',
            email: 'dev01@testapi.com',
            username: 'dev01',
            password: 'dev01',
            emailVerified: true
        },
            {
                name: 'Dev02',
                email: 'dev02@testapi.com',
                username: 'dev02',
                password: 'dev02',
                emailVerified: true
            },
            {
                name: 'Dev03',
                email: 'dev03@testapi.com',
                username: 'dev03',
                password: 'dev03',
                emailVerified: true
            },
            {
                name: 'Dev04',
                email: 'dev04@testapi.com',
                username: 'dev04',
                password: 'dev04',
                emailVerified: true
            },
            {
                name: 'Dev05',
                email: 'dev05@testapi.com',
                username: 'dev05',
                password: 'dev05',
                emailVerified: true
            }]
    }]

    var projects = [
        {
            "name": "FileEditor",
            "description": "file_editor"
        },
        {
            "name": "FileSync",
            "description": "file_sync"
        }
    ]

    initData();
    function initData() {
        createProject();
    }


    function createProject() {
        var count = 0;
        User.findOrCreate(
            {where: {username: 'admin'}}, // find
            roles[0].users[0], // create
            function (err, sUser) {
                if (err) {
                    console.error('error creating roleUser', err);
                } else {
                    console.log("User created " + sUser.name);
                    projects.forEach(function (project) {
                        project.createdById = sUser.id;
                        Project.findOrCreate({
                            where: {name: project.name}
                        }, project, function (err, sProject) {
                            if (err) {
                                console.log("Error in creating project");
                            } else if (sProject) {
                                console.log("Project created successfully " + sProject.name);
                                count++;
                                if (count == projects.length) {
                                    createDefaultUsers();
                                }

                            }
                        })
                    })
                }

            });
    }


    function createDefaultUsers() {

        console.log('Creating roles and users');
        var count1 = 0;
        var count2 = 0;

        roles.forEach(function (role) {

            Role.findOrCreate(
                {where: {name: role.name}}, // find
                {name: role.name}, // create
                function (err, createdRole) {
                    if (err) {
                        console.error('error running findOrCreate(' + role.name + ')', err);
                    }
                    count1++;
                    count2 = 0;
                    role.users.forEach(function (roleUser) {

                        User.findOrCreate(
                            {where: {username: roleUser.username}}, // find
                            roleUser, // create
                            function (err, createdUser) {
                                if (err) {
                                    console.error('error creating roleUser', err);
                                }


                                RoleMapping.findOrCreate({
                                    where: {userId: createdUser.id}
                                }, {
                                    principalType: RoleMapping.USER,
                                    roleId: createdRole.id,
                                    userId: createdUser.id
                                }, function (err) {
                                    if (err) {
                                        console.error('error creating rolePrincipal', err);
                                    }
                                    count2++;
                                   // console.log("Count1 " + count1 + " count2 " + count2 + " " + roles.length + " " + role.users.length);
                                    if (count1 == roles.length && count2 == role.users.length) {
                                        assignProjectMembers();
                                    }
                                    users.push(createdUser);

                                });
                            });
                    });
                });
        });
        return users;
    }

    function assignProjectMembers() {
        console.log("Assigning projects");
        var count1 = 0;
        var count2=0;
        User.find({}, function (err, users) {
            if (err) {
                console.log("Error in finding users");
            } else {
                console.log("Total users found " + users.length);
                Project.find({}, function (err, projects) {
                    if (err) {
                        console.log("Error in finding projects " + JSON.stringify(err));
                    } else {
                        console.log("Total projects found " + projects.length);
                        projects.forEach(function (project) {
                             count2=0;
                            count1++;
                            users.forEach(function (user) {
                                count2++;
                                var role='developer';
                                console.log("Count1 "+count1+" count2 "+count2);
                                if(count1==count2 ){
                                    role='manager';
                                }
                                ProjectUser.findOrCreate({
                                    where: {projectId: project.id, userId:user.id}
                                },{
                                    projectId: project.id, userId:user.id,createdAt:new Date(),role:role
                                },function(err,projectUser){
                                    if(err){
                                        console.log("Error in assigning member "+JSON.stringify(err));
                                    }else{
                                        console.log("Member assigned successfully");
                                    }
                                })
                            })

                        })
                    }

                })

            }
        })

    }

};