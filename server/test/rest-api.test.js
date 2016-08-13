

/*global describe, it, before */
/**
 * REST API Tests
 */
var request = require('supertest');
var app = require('../server');
var assert = require('assert');

before(function importSampleData(done) {
  this.timeout(50000);
  if (app.importing) {
    app.on('import done', done);
  } else {
    done();
  }
});

function json(verb, url) {
    return request(app)[verb](url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
}

describe('REST', function () {
    this.timeout(30000);

    /**
     * Expected Input Tests
     */

    describe('Expected Usage, flow of login, create, list, update and delete company and user logout', function () {
        var token;
        describe('/api/users', function () {
            // hard-coded in sample data
            var credentials = {email: 'admin@zehnaws.com', password: 'indore@123'};
            var wrongCredentials = {email: 'admin1@zehnaws.com', password: 'indore@123'};

            var userId;

            it('should login existing user on POST /api/users/login',
                function (done) {
                    json('post', '/api/users/login?include=user')
                        .send(credentials)
                        .expect(200, function (err, res) {
                            if (err) return done(err);
                            token = res.body;
                            assert(token.userId !== undefined);
                            userId = token.userId;
                            done();
                        });
                }
            );

            it('should not loginin user on POST /api/users/login',
                function (done) {
                    json('post', '/api/users/login?include=user')
                        .send(wrongCredentials)
                        .expect(401, function (err) {
                            done(err);

                        });
                }
            );

            it('should allow GET /api/users/{my-id}', function (done) {
                json('get', '/api/users/' + userId)
                    .set('Authorization', token.id)
                    .expect(200, function (err, res) {
                        if (err) return done(err);
                        assert.equal(res.body.email, token.user.email);
                        done();
                    });
            });

        });

        describe('GET /api/Companies', function () {
            it('should not allow GET list of all companies', function (done) {
                json('get', '/api/Companies')
                    .expect(401, function (err) {
                        done(err);
                    });
            });

            it('should return a list of all companies', function (done) {
                json('get', '/api/Companies')
                    .set('Authorization', token.id)
                    .expect(200)
                    .end(function (err, res) {

                        assert(Array.isArray(res.body));
                        assert(res.body.length);

                        done();
                    });
            });
        });

        var companyId;

        describe('POST /api/Companies', function () {

            it('should create a new Company', function (done) {
                json('post', '/api/Companies')
                    .send({
                        companyName: 'Company 1',
                        userCount: '1',
                        address: 'Indore',
                        city: 'Indore',
                        country: 'India',
                        contactNo: '9876543210',
                        createdBy: token.userId,
                        plan: 'Free',
                        updatedDate: new Date(),
                        createdDate: new Date()
                    })
                    .expect(200)
                    .end(function (err, res) {

                        assert(typeof res.body === 'object');
                        assert(res.body.id, 'must have an id');
                        companyId = res.body.id;
                        done();
                    });
            });


            it('should not create a new Company', function (done) {
                json('post', '/api/Companies')
                    .send({
                        companyName: 'Company 2',
                        userCount: '1',
                        address: 'New market',
                        city: 'Bhopal',
                        country: 'India',
                        contactNo: '9876543210',
                        plan: 'Free',
                        updatedDate: new Date(),
                        createdDate: new Date()
                    })
                    .expect(422)
                    .end(function (err) {
                        done(err);
                    });
            });


        });

        describe('PUT /api/Companies/:id', function () {
            it('should update a company with the given id', function (done) {
                json('put', '/api/Companies/' + companyId)
                    .send({
                        companyName: 'Zehntech'
                    })
                    .expect(200, function (err, res) {

                        var updatedCompany = res.body;
                        assert(updatedCompany);
                        assert(updatedCompany.id);

                        assert.equal(updatedCompany.id, companyId);
                        assert.equal(updatedCompany.companyName, 'Zehntech');
                        json('get', '/api/Companies/' + companyId)
                            .set('Authorization', token.id)
                            .expect(200, function (err, res) {
                                var foundComp = res.body;
                                assert.equal(foundComp.id, companyId);
                                assert.equal(foundComp.companyName, 'Zehntech');

                                done();
                            });
                    });
            });

            it('should delete a company with the given id', function (done) {
                json('delete', '/api/Companies/' + companyId)
                    .send({})
                    .expect(204, done);
            });


            it('should logout existing user on POST /api/users/logout',
                function (done) {
                    json('post', '/api/users/logout')
                        .set('Authorization', token.id)
                        .send({})
                        .expect(204, done);
                });
        });


    });


    /**
     * Expected Input Tests with AWS flow
     */

    describe('Flow of creating company and user', function () {
        var token;
        var userId;
        var companyId, keyId;
        var email = 'admin@zehnaws.com';

        var credentials = {email: 'user@zehnaws.com', password: 'indore@123'};

        describe('POST /api/Companies', function () {

            it('should create a new Company with created by user email address', function (done) {
                json('post', '/api/Companies')
                    .send({
                        companyName: 'Company 1',
                        userCount: '1',
                        address: 'Indore',
                        city: 'Indore',
                        country: 'India',
                        contactNo: '9876543210',
                        createdBy: email,
                        plan: 'Free',
                        createdDate: new Date()
                    })
                    .expect(200)
                    .end(function (err, res) {

                        assert(typeof res.body === 'object');
                        assert(res.body.id, 'must have an id');
                        companyId = res.body.id;

                        done();
                    });
            });


            it('should not create new user with company id, because email Id already exist', function (done) {
                json('post', '/api/users')
                    .send({
                        name: 'Tony Stark',
                        email: email,
                        password: '1234',
                        role: 'admin',
                        companyId: companyId
                    })
                    .expect(422)
                    .end(function (err) {
                        done(err);
                    });
            });


            it('should login existing user on POST /api/users/login',
                function (done) {
                    json('post', '/api/users/login?include=user')
                        .send(credentials)
                        .expect(200, function (err, res) {

                            if (err) return done(err);
                            token = res.body;
                            assert(token.userId !== undefined);
                            userId = token.userId;
                            done();
                        });
                }
            );

            it('should update company Id in user for given user id', function (done) {
                json('put', '/api/users/' + userId)
                    .set('Authorization', token.id)
                    .send({
                        name: 'Mike Jones',
                        companyId: companyId
                    })
                    .expect(200)
                    .end(function (err, res) {

                        assert(typeof res.body === 'object');
                        assert(res.body.id, 'must have an id');
                        done();
                    });
            });


            it('should add entry in key table for given company id', function (done) {
                json('post', '/api/KeyManagements')
                    .send({
                        companyId: companyId,
                        serviceName: 'EC2',
                        accessKey: 'abcd1234',
                        secretKey: 'wxyz1234'
                    })
                    .expect(200)
                    .end(function (err, res) {
                        assert(typeof res.body === 'object');
                        assert(res.body.id, 'must have an id');
                        keyId = res.body.id;
                        done();
                    });
            });

            it('should update key Id in company for given company id', function (done) {
                json('put', '/api/Companies/' + companyId)
                    .send({
                        keyId: keyId
                    })
                    .expect(200)
                    .end(function (err, res) {
                        var updatedCompany = res.body;
                        assert(updatedCompany);
                        assert(updatedCompany.id);
                        assert.equal(updatedCompany.id, companyId);
                        assert.equal(updatedCompany.keyId, keyId);
                        done();
                    });
            });


            it('should update key for given key id', function (done) {
                json('put', '/api/KeyManagements/' + keyId)
                    .send({
                        accessKey: 'abcdefgh',
                        secretKey: 'mnopqrst'
                    })
                    .expect(200)
                    .end(function (err, res) {

                        var updatedKey = res.body;

                        assert(updatedKey);
                        assert(updatedKey.id);
                        assert.equal(updatedKey.accessKey, 'abcdefgh');
                        assert.equal(updatedKey.id, keyId);
                        done();
                    });
            });


            it('should delete a company with the given id', function (done) {
                json('delete', '/api/Companies/' + companyId)
                    .send({})
                    .expect(204, function () {
                        done();
                    });
            });

            it('should delete a key with the given id', function (done) {
                json('delete', '/api/KeyManagements/' + keyId)
                    .send({})
                    .expect(204, done);
            });


            it('should logout existing user on POST /api/users/logout',
                function (done) {
                    json('post', '/api/users/logout')
                        .set('Authorization', token.id)
                        .send({})
                        .expect(204, done);
                });


        });


    });

    describe('Unexpected Usage', function () {
        describe('POST /api/Companies/:id', function () {
            it('should not crash the server when posting a bad id', function (done) {
                json('post', '/api/Companies/foobar').send({}).expect(404, done);
            });
        });
    });

});
