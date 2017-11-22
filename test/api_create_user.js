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
  describe('POST /idm/1.0/user', () => {

    it('should require a JWT', (done) => {
      helpers.jwtRequiredTest(server, `/idm/1.0/user`, 'POST', done);
    });

    it('should reject invalid JWT', (done) => {
      helpers.jwtInvalidTest(server, `/idm/1.0/user`, 'POST', done);
    });

    it('should create a user', (done) => {
      chai.request(server.listener)
          .post(`/idm/1.0/user`)
          .set('Authorization', process.env.JWT_TOKEN)
          .send({
            username :  'bob@example.com',
            password : 'examplePassword!',
            user_data : {
              firstname : 'Bob'
            }
          })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
          });
    });

    it('should not create a user with missing fields', (done) => {
      chai.request(server.listener)
          .post(`/idm/1.0/user`)
          .set('Authorization', process.env.JWT_TOKEN)
          .send({
            username :  'bob@example.com',
            user_data : {
              firstname : 'Bob'
            }
          })
          .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
          });
    });

    // TODO remove users created with test

    // @TODO check creating duplicate user 



  });
});
