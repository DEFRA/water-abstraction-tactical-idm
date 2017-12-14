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

  /*
   * Test the /GET route
   */
   describe('GET /idm/1.0/user/{id}', () => {

     it('should require a JWT', (done) => {
       helpers.jwtRequiredTest(server, `/idm/1.0/user/${ process.env.TEST_USER_ID }`, 'GET', done);
     });

     it('should reject invalid JWT', (done) => {
       helpers.jwtInvalidTest(server, `/idm/1.0/user/${ process.env.TEST_USER_ID }`, 'GET', done);
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
