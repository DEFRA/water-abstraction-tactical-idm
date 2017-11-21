require('dotenv').config();

process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const expect = chai.expect;
const jwt = require('jsonwebtoken');
const invalidJwt = jwt.sign('invalid-payload', 'invalid-secret');


chai.use(chaiHttp);


//Our parent block
describe('Api', () => {

 /*
  * Test the /GET route
  */
  describe('GET /idm/1.0/user/{id}', () => {

    it('should require a JWT', (done) => {
      chai.request(server.listener)
          .get(`/idm/1.0/user/${ process.env.TEST_USER_ID }`)
          .end((err, res) => {
            expect(res.body.message).to.equal('Missing authentication');
            expect(res.status).to.equal(401);
            done();
          });
    });


    it('should reject invalid JWT', (done) => {
      chai.request(server.listener)
          .get(`/idm/1.0/user/${ process.env.TEST_USER_ID }`)
          .set('Authorization', invalidJwt)
          .end((err, res) => {
            expect(res.body.message).to.equal('Invalid token');
            expect(res.status).to.equal(401);
            done();
          });
    });

    it('should find valid user', (done) => {
      chai.request(server.listener)
          .get(`/idm/1.0/user/${ process.env.TEST_USER_ID }`)
          .set('Authorization', process.env.JWT_TOKEN)
          .end((err, res) => {
            expect(res.body.user_name).to.equal(process.env.TEST_USERNAME);
            expect(res.status).to.equal(200);
            done();
          });
    });

    it('should not find invalid user', (done) => {
      chai.request(server.listener)
          .get(`/idm/1.0/user/9999999999999999999999`)
          .set('Authorization', process.env.JWT_TOKEN)
          .end((err, res) => {
            expect(res.status).to.equal(404);
            done();
          });
    });


  });
});
