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


  // Reset user password to initial value
  after((done) => {
    console.log('Resetting password to initial value');
    chai.request(server.listener)
        .put(`/idm/1.0/user`)
        .set('Authorization', process.env.JWT_TOKEN)
        .send({
          username :  process.env.TEST_USERNAME,
          password : process.env.TEST_PASSWORD
        })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          done();
        });
  });

 /*
  * Test the /GET route
  */
  describe('PUT /idm/1.0/user', () => {

    const newPassword = process.env.TEST_PASSWORD + 'x';

    it('should require a JWT', (done) => {
      helpers.jwtRequiredTest(server, `/idm/1.0/user`, 'PUT', done);
    });

    it('should reject invalid JWT', (done) => {
      helpers.jwtInvalidTest(server, `/idm/1.0/user`, 'PUT', done);
    });

    it('should update a user password', (done) => {
      chai.request(server.listener)
          .post(`/idm/1.0/user`)
          .set('Authorization', process.env.JWT_TOKEN)
          .send({
            username :  process.env.TEST_USERNAME,
            password : newPassword
          })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
          });
    });



  });
});
