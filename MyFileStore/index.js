/**
 * Created by chenjing on 16/5/3.
 *
 */

var express = require('express');
var app = express();
var session = require('express-session');
var MyFileStore = require('./mystore')(session);

app.use(session({
        store: new MyFileStore('cj'),
        secret: '123',
        resave: true,
        saveUninitialized: true
    })
);
app.listen(3000);
console.log('server is running at 3000');
app.get('/', function (req, res) {
    if (req.session.views) {
        req.session.views++;
        res.setHeader('Content-Type', 'text/html');
        res.write('<p>Views: ' + req.session.views + '</p>');
        res.end();
    } else {
        req.session.views = 1;
        res.end('this is the first visit!');
    }
});