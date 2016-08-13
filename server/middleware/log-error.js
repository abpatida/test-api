module.exports = function () {
    return function logError(err, req, res, next) {
        console.log('ERR :: ' + err);
        console.log('ERR :: ' + req);
        console.log('ERR :: ' + res);
        next();
    };

};
