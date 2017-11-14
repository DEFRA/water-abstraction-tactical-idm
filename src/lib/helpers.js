var bcrypt = require('bcrypt');




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

function compareHash(string1,string2){
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


module.exports = {
  createGUID:createGUID,
  createHash:createHash,
  compareHash:compareHash,
  encryptToken:encryptToken,
  decryptToken:decryptToken

}
