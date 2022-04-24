// Place your server entry point code here
const args = require('minimist')(process.argv.slice(2))
args["port", "debug", "log", "help"]
console.log(args)

const port = args.port || 5000
const debug = args.debug || false
const log = args.log || true
const help = args.help


const express = require('express')
const app = express()

//const db = require('./database')
const morgan = require('morgan')
const errorhandler = require('errorhandler')
const fs = require('fs')
const db = require('./src/services/database.js')

const helpMSG= (`
server.js [options]
--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(helpMSG)
    process.exit(0)
}


app.use(express.static('./public'));

app.use((req, res, next) => {
    let logData = {
            remoteaddr: req.ip,
            remoteuser: req.user,
            time: Date.now(),
            method: req.method,
            url: req.url,
            protocol: req.protocol,
            httpversion: req.httpVersion,
            status: res.statusCode,
            referer: req.headers['referer'],
            useragent: req.headers['user-agent']
        }
        console.log(logData)
        const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        const info = stmt.run(logData.remoteaddr, logData.remoteuser, logData.time, logData.method, logData.url, logData.protocol, logData.httpversion, logData.status, logData.referer, logData.useragent)
        next()
    })

if (log == true) {
    const accesslog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', {stream: accesslog}))
} else {
    console.log("No log written.")
}

if (args.debug === true) {
    app.get('/app/log/access', (req, res) => {
        const stmt = db.prepare('SELECT * FROM accesslog').all();
        res.status(200).json(stmt)
        //res.writeHead(res.statusCode, {"Content-Type" : "text/json"});
    })

    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.')
    })
}

app.post('/app/user/login/', (req, res) => {
    
})

app.post('/app/user/new/', (req, res) => {
    
})

app.patch('/app/user/update/', (req, res) => {
    
})

app.delete('/app/user/delete/', (req, res) => {
    
})


app.get('/app/', (req, res) => {
    res.statusCode = 200;
    res.statusMessage = "OK";
    //res.writeHead(res.statusCode, {"Content-Type" : "text/plain"});
    res.end(res.statusCode + " " + res.statusMessage)
})

app.get('/app/flip/', (req, res) => {
    res.statusCode = 200;
    res.send('{"flip":"' + coinFlip() + '"}');
    //res.writeHead(res.statusCode, {"Content-Type" : "text/plain"});
})

app.get('/app/flips/:number', (req, res) => {
    res.statusCode = 200;
    const flip_array = coinFlips(req.params.number);
    const sum = countFlips(flip_array)
    res.send('{"raw":\n[' + flip_array + '],"summary":{tails":' + sum.get("tails") + ',"heads":' + sum.get("heads") + '}}')
    //res.writeHead(res.statusCode, {"Content-Type" : "text/plain"});
})

app.get('/app/flip/call/:guess(heads|tails)/', (req, res) => {
    res.statusCode = 200;
    const map = flipACoin("heads");
    res.send('{"call":"' + map.get("call") + '","flip":"' + map.get("flip") + '","result":"' + map.get("result") + " }")
    //res.writeHead(res.statusCode, {"Content-Type" : "text/plain"});
})

app.post('/app/flips/coins', (req, res) => {
    const flip_array = coinFlips(req.body.number);
    const sum = countFlips(flip_array)
    res.status(200).json({"raw":flip_array,"summary":sum})
    //res.writeHead(res.statusCode, {"Content-Type" : "text/plain"});
})

app.post('/app/flip/call/', (req, res) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
    //res.send('{"call":"' + map.get("call") + '","flip":"' + map.get("flip") + '","result":"' + map.get("result") + " }")
    //res.writeHead(res.statusCode, {"Content-Type" : "text/plain"});
})

app.use(function(req, res){
    res.statusCode = 404;
    res.status(404).send("404 NOT FOUND")
});

const server = app.listen(port, () => {
    console.log("App listening on port " + port)
})

function coinFlip() {
	return (Math.random() > 0.5 ? "heads" : "tails");
}

function coinFlips(flips) {
  const flip_array = [];
  var i = 0;
  while (i < flips) {
    flip_array.push('"' + coinFlip() + '"')
    i++;
  }
  return flip_array;
}

/** Count multiple flips
 * 
 * Write a function that accepts an array consisting of "heads" or "tails" 
 * (e.g. the results of your `coinFlips()` function) and counts each, returning 
 * an object containing the number of each.
 * 
 * example: conutFlips(['heads', 'heads','heads', 'tails','heads', 'tails','tails', 'heads','tails', 'heads'])
 * { tails: 5, heads: 5 }
 * 
 * @param {string[]} array 
 * @returns {{ heads: number, tails: number }}
 */

function countFlips(array) {
  var i = 0;
  var heads = 0;
  var tails = 0;
  while (i < array.length) {
    if (array[i] == "heads") {
      heads++;
    } else {
      tails++;
    }
    i++;
  }
  const final_nums = new Map();
  final_nums.set("tails", tails);
  final_nums.set("heads", heads)
  return final_nums;
}

/** Flip a coin!
 * 
 * Write a function that accepts one input parameter: a string either "heads" or "tails", flips a coin, and then records "win" or "lose". 
 * 
 * @param {string} call 
 * @returns {object} with keys that are the input param (heads or tails), a flip (heads or tails), and the result (win or lose). See below example.
 * 
 * example: flipACoin('tails')
 * returns: { call: 'tails', flip: 'heads', result: 'lose' }
 */

function flipACoin(call) {
  if (call != "heads" & call != "tails" | call == null) {
    console.log("Error: no input.")
    console.log("Usage: node guess-flip --call=[heads|tails]")
  } else {
    const flip = coinFlip();
    var result = "";
    if (call == flip) {
      result = "win";
    } else {
      result = "lose";
    }
    const final_results = new Map();
    final_results.set("call", call);
    final_results.set("flip", flip);
    final_results.set("result", result);
    return final_results;
  }
}