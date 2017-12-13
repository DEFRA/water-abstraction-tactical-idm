require('dotenv').config();

process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const expect = chai.expect;
const helpers = require('./helpers');


chai.use(chaiHttp);

describe('Api', () => {

  describe('PUT /idm/1.0/user', () => {

    it('should require a JWT', (done) => {
      helpers.jwtRequiredTest(server, '/idm/1.0/user/loginAdmin', 'POST', done);
    });

    it('should reject invalid JWT', (done) => {
      helpers.jwtInvalidTest(server, '/idm/1.0/user/loginAdmin', 'POST', done);
    });

    it('should require username field', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/loginAdmin')
          .set('Authorization', process.env.JWT_TOKEN)
          .field('password', 'xyz')
          .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
          });
    });

    it('should require password field', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/loginAdmin')
          .set('Authorization', process.env.JWT_TOKEN)
          .field('user_name', 'xyz')
          .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
          });
    });

    it('should login with valid credentials', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/loginAdmin')
          .set('Authorization', process.env.JWT_TOKEN)
          .field('user_name', process.env.TEST_USERNAME)
          .field('password', process.env.TEST_PASSWORD)
          .end((err, res) => {
            expect(res.body.user_id).to.be.a('number');
            expect(res.status).to.equal(200);
            done();
          });
    });




  });
});
