//加载依赖库
var express =require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto=require('crypto');
var mongoose = require('mongoose');
var orm = require('./models/myorm');
var session = require('express-session');
var url=require('url');
var moment=require('moment');
var checkLogin = require('./checkLogin.js');
//加载工具模块
var checkStr=require('./util/checkStr');

//创建express实例
var app = express();

//定义EJS模板引擎和模板文件位置
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname,'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//建立session模型
app.use(session({
	secret:'1234',
	name:'mynote',
	cookie:{maxAge:1000*60*20},//设置session的保存时间为20分钟
	resave:false,
	saveUninitialized:true
}));
var pageSize=8;
//响应首页get请求

// Initialise the waterline instance.
orm.waterline.initialize(orm.config, function (err, models) {
	if (err) {
		return console.error(err);
	}

	app.set('models', models.collections);
});

app.use(function(req, res, next){
	req.models = app.get('models');
	next();
});


app.get('/',checkLogin.noLogin);
var notesRoute = require('./app/routes/notesRoute')(app);
var usersRoute = require('./app/routes/usersRoute')(app);
//监听3000端口
app.listen(3000,function(req,res){
	console.log('app is running at port 3000');
});
