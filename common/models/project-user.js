module.exports = function (ProjectUser) {


    ProjectUser.beforeRemote('*', function (ctx, next) {
        if (ctx.req) {
            console.log("Before access project user " + ctx.req.accessToken);
        }

        console.log("Instance project user " + ctx.methodString);
    })
}