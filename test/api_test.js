require('dotenv').config();

process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const expect = chai.expect;

chai.use(chaiHttp);

//Our parent block
describe('Api', () => {

 /*
  * Test the /GET route
  */
  describe('POST /idm/1.0/user/login', () => {

    it('token required', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/login')
          .end((err, res) => {
            expect(res.status).to.equal(401);
            done();
          });
    });

    it('username required', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/login')
          .end((err, res) => {
            expect(res.status).to.equal(401);
            done();
          });
    });




  });
});
