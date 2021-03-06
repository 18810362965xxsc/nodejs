//加载依赖库
var express =require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto=require('crypto');
var mongoose = require('mongoose');
var models = require('./models/models');
var session = require('express-session');
var url=require('url');
var moment=require('moment')

//加载工具模块
var checkStr=require('./util/checkStr')

//加载models
var User = models.User;
var Note = models.Note;



//使用mongoose连接服务
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'连接数据库失败'));


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

//建立session模型,实现多用户
app.use(session({
	secret:'1234',
	name:'mynote',
	cookie:{maxAge:1000*60*20},//设置session的保存时间为20分钟
	resave:false,
	saveUninitialized:true
}));
var pageSize=5;
//相应首页get请求
app.get('/',function(req,res){
	if(req.session.user!=null){
		var page=Number(url.parse(req.url,true).query.page);
		if(!page){
			page=1;
		}
		Note.find({author:req.session.user.username},function(err,list){
			if(err){
				console.log('获取笔记列表失败');
				return res.redirect('/');
			}
			Note.count({author:req.session.user.username},function(err,total){
				if(err){
					console.log('获取笔记列表失败');
					return res.redirect('/');
				}
				var totalPage=Math.ceil(total/5);
				if(totalPage==0){
					totalPage=1;
				}
				return res.render('detail',{
					user:req.session.user,
					list:list,
					totalPage:totalPage,
					currentPage:page,
					pageTitle:'首页',
					moment:moment
				});
			})

		}).limit(pageSize).skip((page-1)*pageSize);
	}else{
		res.redirect('/login')
	}
});
app.get('/register',function(req,res){
	if(req.session.user){
		return res.redirect('/');
	}
	res.render('register',{
		user:req.session.user,
		username:'',
		password:'',
		passwordRepeat:'',
		err:'',
		pageTitle:'注册'
	});
});
/*app.get('/test',function(req,res){
	if(req.session.user){
		return res.redirect('/');
	}
	res.render('test',{
		user:req.session.user,
		username:'',
		password:'',
		passwordRepeat:'',
		err:'',
		pageTitle:'测试页面'
	});
});*/
app.post('/register',function(req,res){
	var username=req.body.username,
		password=req.body.password,
		passwordRepeat=req.body.passwordRepeat;
	//检查输入的用户名密码是否合乎要求
	var err=checkStr.registerCheck(username,password,passwordRepeat);
	if(err!=''){
		console.log(err);
		return res.render('register',{
			user:req.session.user,
			username:username,
			password:password,
			passwordRepeat:passwordRepeat,
			err:err,
			pageTitle:'注册'
		});
	}
	
	//检查用户名是否已经存在，如果不存在则保存该条记录
	User.findOne({username:username},function(err,user){
		if(err){
			console.log(err);
			return res.render('register',{
				user:req.session.user,
				username:username,
				password:password,
				passwordRepeat:passwordRepeat,
				err:'内部错误，请重试！',
				pageTitle:'注册'
			});
		}
		if(user){
			console.log('用户名已存在！');
			return res.render('register',{
				user:req.session.user,
				username:username,
				password:password,
				passwordRepeat:passwordRepeat,
				err:'该用户名已被注册！',
				pageTitle:'注册'
			});
		}
		//对密码进行md5加密
		var md5=crypto.createHash('md5'),
			md5password=md5.update(password).digest('hex');
		
		//新建user对象用于保存数据
		var newUser=new User({
			username:username,
			password:md5password
		});
		
		newUser.save(function(err,doc){
			if(err){
				console.log(err);
				return res.render('register',{
					user:req.session.user,
					username:username,
					password:password,
					passwordRepeat:passwordRepeat,
					err:'内部错误，请重试！',
					pageTitle:'注册'
				});
			}
			console.log('用户'+username+'注册成功');
			return res.redirect('/login');
		});
	});
});

//login get
app.get('/login',function(req,res){
	if(req.session.user){
		return res.redirect('/');
	}
	res.render('login',{
		user:req.session.user,
		username:'',
		password:'',
		err:'',
		pageTitle:'登录'
	});
});
app.post('/login',function(req,res){
	var username=req.body.username,
		password=req.body.password,
		rememberMe=req.body.rememberMe;
	if(username.trim().length==0||password.trim().length==0){
		var err='用户名密码不能为空！';
		return res.render('login',{
			user:req.session.user,
			username:username,
			password:password,
			err:err,
			pageTitle:'登录'
		});
	}
	User.findOne({username:username},function(err,user){
		if(err){
			console.log(err)
			return res.redirect('/login');
		}
		if(!user){
			console.log('用户不存在！');
			return res.render('login',{
				user:req.session.user,
				username:username,
				password:password,
				err:'用户不存在！',
				pageTitle:'登录'
			});
		}
		var md5= crypto.createHash('md5'),
			md5password=md5.update(password).digest('hex');
		if(user.password!==md5password){
			console.log('密码错误！');
			return res.render('login',{
				user:req.session.user,
				username:username,
				password:password,
				err:'密码错误！',
				pageTitle:'登录'
			});
		}
		console.log('用户'+username+'登录系统！');
		user.password=null;
		delete user.password;
		req.session.user=user;
		//用户点击记住我，将session.cookie.maxAge设为1000*60*60*24*7
		if(rememberMe){
			req.session.cookie.maxAge=1000*60*60*24*7;
		}
		return res.redirect('/');
	});
});
app.get('/quit',function(req,res){
	req.session.user=null;
	console.log('用户'+username+'退出登录！');
	return res.redirect('/login');
});
app.get('/post',function(req,res){
	res.render('post',{
		user:req.session.user,
		title:"",
		tag:"",
		content:'',
		err:"",
		pageTitle:'发布笔记'
	});
});
app.post('/post',function(req,res){
	var title=req.body.title.trim(),
		tag=req.body.tag.trim(),
		content=req.body.content.trim(),
		author=req.session.user.username;
	//检查笔记title和content
	var err = checkStr.postNoteCheck(title,content);
	//有错误，返回错误信息
	if(err!=""){
		return res.render('post',{
			user:req.session.user,
			title:title,
			tag:tag,
			content:content,
			err:err,
			pageTitle:'发布笔记'
		});
	}
	//新建note实体
	var note = new Note({
		title:title,
		author:author,
		tag:tag,
		content:content
	})
	//保存数据库
	note.save(function(err,doc){
		if(err){
			console.log(err);
			return res.redirect('/post');
		}
		console.log('笔记发布成功！');
		return res.redirect('/');
	});
})

/*app.get('/detail',function(req,res){
	//依据用户名从数据看获取笔记列表
	User.findAll({author:author},function(err,list){
		if(err){
			console.log('获取笔记列表失败');
			return res.redirect('/');
		}
		return res.render('detail',{
			user:req.session.user,
			list:list,
			pageTitle:'发布笔记'
		});
	});

});*/
app.get('/delete',function(req,res){
	var id = url.parse(req.url,true).query._id
	console.log("delete note,_id="+id);
	Note.remove({_id:id},function(err){
		if(err){
			console.log(err);
			res.redirect('/')
		}else{
			console.log('note删除成功');
			res.redirect('/');
		}
	});
})

//监听3000端口
app.listen(3000,function(req,res){
	console.log('app is running at port 3000');
});
