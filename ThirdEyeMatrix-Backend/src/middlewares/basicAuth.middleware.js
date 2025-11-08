const auth = require('basic-auth');
require('dotenv').config()

const userName = process.env.BASIC_AUTH_USERNAME;
const password = process.env.BASIC_AUTH_PASSWORD;

module.exports.basicAuthMiddleware = async(req,res,next) => {
        const creds = auth(req);
        
        if(!creds || !creds.name || !creds.pass){
            res.set('WWW-Authenticate', 'Basic realm="App", charset="UTF-8"');
            return res.status(401).json({message : "Basic Authentication Required."});
        }
        else{
            if(creds.name == userName && creds.pass == password){
                next();
            }else{
                res.set('WWW-Authenticate', 'Basic realm="App", charset="UTF-8"');
                return res.status(401).json({message: "Incorrect Credentials."})
            }   
        }
        
    }