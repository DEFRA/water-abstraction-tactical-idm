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

describe('Api', () => {

  describe('POST /idm/1.0/user/loginAdmin', () => {

    it('should require a JWT', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/loginAdmin')
          .end((err, res) => {
            expect(res.body.message).to.equal('Missing authentication');
            expect(res.status).to.equal(401);
            done();
          });
    });


    it('should reject invalid JWT', (done) => {
      chai.request(server.listener)
          .post('/idm/1.0/user/loginAdmin')
          .set('Authorization', invalidJwt)
          .field('user_name', process.env.TEST_USERNAME)
          .field('password', process.env.TEST_PASSWORD)
          .end((err, res) => {
            expect(res.body.message).to.equal('Invalid token');
            expect(res.status).to.equal(401);
            done();
          });
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
