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

  let resetGuid = null;

  before((done) => {
    chai.request(server.listener)
        .post('/idm/1.0/resetPassword')
        .set('Authorization', process.env.JWT_TOKEN)
        .send({emailAddress: process.env.TEST_USERNAME})
        .end((err, res) => {

          expect(res.status).to.equal(200);

          // Now get the token
          chai.request(server.listener)
              .get('/idm/1.0/resetPassword')
              .set('Authorization', process.env.JWT_TOKEN)
              .query({'emailAddress': process.env.TEST_USERNAME})
              .end((err, res) => {

                  resetGuid = res.body.reset_guid;
                  expect(res.status).to.equal(200);
                  done();
              });

        });
  });

 /*
  * Test the /GET route
  */
  describe('POST /idm/1.0/changePassword', () => {
    //
    it('should require a JWT', (done) => {
      helpers.jwtRequiredTest(server, '/idm/1.0/changePassword', 'POST', done);
    });

    it('should reject invalid JWT', (done) => {
      helpers.jwtInvalidTest(server, '/idm/1.0/changePassword', 'POST', done);
    });

    it('should change password for user with valid reset GUID', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/changePassword')
          .set('Authorization', process.env.JWT_TOKEN)
          .send({resetGuid, password : process.env.TEST_PASSWORD })
          .end((err, res) => {

            // Note: won't send email so will fail
            expect(res.status).to.equal(200);
            done();
          });
    });

  });







});
