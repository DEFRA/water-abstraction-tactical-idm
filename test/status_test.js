require('dotenv').config();

process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const expect = chai.expect;

chai.use(chaiHttp);

//Our parent block
describe('Status', () => {

 /*
  * Test the /GET route
  */
  describe('GET /status', () => {

    it('should return 200 status if all OK', (done) => {
      chai.request(server.listener)
        .get('/status')
        .end((err, res) => {
          expect(res.text).to.equal('ok');
          expect(res.status).to.equal(200);
          done();
        });
    });


   });


});
