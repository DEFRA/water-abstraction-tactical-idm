/**
 * Helper functions to reduce boilerplate code in Mocha API tests
 */
const chai = require('chai');
const jwt = require('jsonwebtoken');
const invalidJwt = jwt.sign('invalid-payload', 'invalid-secret');
const expect = chai.expect;


/**
 * Do either a Chai GET/POST on the server URL depending on supplied method
 * @param {Object} server - the server returned from the HAPI app
 * @param {String} url - the URL to call
 * @param {String} method - HTTP request method GET/POST
 */
function chaiRequest(server, url, method) {
  if(method == 'GET') {
    return chai.request(server.listener)
      .get(url);
  }
  if(method === 'POST') {
    return chai.request(server.listener)
      .post(url);
  }
  throw new Exception(`Unsupported method ${method}`);
}

/**
 * Checks a route where JWT is required
 * No JWT is set and so the route should fail with 401 unauthorized
 * @function
 * @param {Object} server - the server returned from the HAPI app
 * @param {String} url - the URL to call
 * @param {String} method - HTTP request method GET/post
 * @param {Function} cb - callback when done
 */
function jwtRequiredTest(server, url, method='GET', cb) {
    return chaiRequest(server, url, method)
          .end((err, res) => {
            expect(res.body.message).to.equal('Missing authentication');
            expect(res.status).to.equal(401);
            cb();
          });
}

/**
 * Checks a route where JWT is required
 * An invalid JWT token is set as an Authorization header so should faiol with 401 
 * @function
 * @param {Object} server - the server returned from the HAPI app
 * @param {String} url - the URL to call
 * @param {String} method - HTTP request method GET/post
 * @param {Function} cb - callback when done
 */
function jwtInvalidTest(server, url, method='GET', done) {
    return chaiRequest(server, url, method)
      .set('Authorization', invalidJwt)
      .end((err, res) => {
        expect(res.body.message).to.equal('Invalid token');
        expect(res.status).to.equal(401);
        done();
      });
}


module.exports = {
  jwtRequiredTest,
  jwtInvalidTest
};
