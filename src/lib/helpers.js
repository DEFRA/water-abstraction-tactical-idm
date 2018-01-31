var bcrypt = require('bcrypt');

//contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
    proxy:null,
    strictSSL :false
  });


function createGUID() {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
  .toString(16)
  .substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
s4() + '-' + s4() + s4() + s4()
}


function createHash(string){
  return new Promise((resolve, reject) => {
  const saltRounds = 10;
  bcrypt.hash(string, saltRounds, function(err, hash) {
    if(err){
      reject(err)
    }
    resolve(hash)
  })
});
}

async function compareHash(string1,string2){

  console.log(string1, string2);
  console.log('Hash should be', await createHash(string1));

  return new Promise((resolve, reject) => {
    try{

    bcrypt.compare(string1,string2, (err, res)=> {
      if(res){
        //console.log('compareHash: resolve')
        resolve(200)
      } else {
        //console.log('compareHash: reject as not correct hash')
        reject(400)
      }
    })
  }catch(e){
    //console.log('compareHash: reject for error')
    resolve(500)
  }

  });


}

function encryptToken (data) {
  var key = process.env.JWT_SECRET
  var JWT = require('jsonwebtoken')
  var token = JWT.sign(data, key)
  return(token)
}

function decryptToken(token){
  var key = process.env.JWT_SECRET
  var JWT = require('jsonwebtoken')
  var data = JWT.decode(token, key)
  console.log('token decoded')
  console.log(data)
  return(data)
}


function makeURIRequest(uri) {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'get',
      uri: uri
    };
    rp(options)
      .then(function(response) {
        var responseData = {};
        responseData.error = null
        responseData.statusCode = 200
        responseData.body = response
        resolve(responseData);
      })
      .catch(function(response) {
        var responseData = {};
        responseData.error = response.error
        responseData.statusCode = response.statusCode
        responseData.body = response.body
        reject(responseData);
      });
  })
}

//make an http request (with a body), uses promises
function makeURIRequestWithBody(uri, method, data) {
  return new Promise((resolve, reject) => {
    var options = {
      method: method,
      uri: uri,
      body: data,
      json: true
    };

    rp(options)
      .then(function(response) {
        var responseData = {};
        responseData.error = null
        responseData.statusCode = 200
        responseData.body = response
        resolve(responseData);
      })
      .catch(function(response) {
        var responseData = {};
        responseData.error = response.error
        responseData.statusCode = response.statusCode
        responseData.body = response.body
        reject(responseData);
      });

  })

}

module.exports = {
  createGUID,
  createHash,
  compareHash,
  encryptToken,
  decryptToken,
  makeURIRequest,
  makeURIRequestWithBody
}
