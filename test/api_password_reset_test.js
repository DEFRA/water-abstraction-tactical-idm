require('dotenv').config();

process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const expect = chai.expect;
const helpers = require('./helpers');

chai.use(chaiHttp);

//Our parent block
describe('Api', () => {

 /*
  * Test the /GET route
  */
  describe('GET /idm/1.0/user/resetPassword', () => {

    it('should require a JWT', (done) => {
      helpers.jwtRequiredTest(server, '/idm/1.0/user/resetPassword', 'GET', done);
    });

    it('should reject invalid JWT', (done) => {
      helpers.jwtInvalidTest(server, '/idm/1.0/user/resetPassword', 'GET', done);
    });

    it('should get reset GUID for valid user', (done) => {
      chai.request(server.listener)
          .get('/idm/1.0/resetPassword')
          .set('Authorization', process.env.JWT_TOKEN)
          .query({emailAddress: process.env.TEST_USERNAME})
          .end((err, res) => {
            // console.log(res);
            expect(res.status).to.equal(200);
            done();
          });
    });

    it('should return 404 for non-existent user', (done) => {
      chai.request(server.listener)
          .get('/idm/1.0/resetPassword')
          .set('Authorization', process.env.JWT_TOKEN)
          .query({emailAddress: 'invaliduser@example.com'})
          .end((err, res) => {
            // console.log(res);
            expect(res.status).to.equal(404);
            done();
          });
    });


  });
});
