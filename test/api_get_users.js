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
  describe('GET /idm/1.0/user', () => {

    it('should require a JWT', (done) => {
      helpers.jwtRequiredTest(server, `/idm/1.0/user`, 'GET', done);
    });

    it('should reject invalid JWT', (done) => {
      helpers.jwtInvalidTest(server, `/idm/1.0/user`, 'GET', done);
    });

    it('should return a list of users', (done) => {
      chai.request(server.listener)
          .get(`/idm/1.0/user`)
          .set('Authorization', process.env.JWT_TOKEN)
          .end((err, res) => {
            expect(res.body).to.be.an('array');
            expect(res.status).to.equal(200);
            done();
          });
    });


  });
});
