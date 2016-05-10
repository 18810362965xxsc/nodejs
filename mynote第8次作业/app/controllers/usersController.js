var checkStr = require('../../util/checkStr');
var crypto = require('crypto');
module.exports={
    getlogin:function(req,res,next){
        // userscontroller.getlogin
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
    },
    postlogin:function(req,res,next){
        // userscontroller.postlogin
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
        req.models.users.findOne({username:username},function(err,user){
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
    },
    getregister:function(req,res,next){
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
    },
    postregister:function(req,res,next){
        // userscontroller.postregister
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
        req.models.users.findOne({username:username},function(err,user){
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
            req.models.users.create({username:username,password:md5password,email:'123@example.com'},function(err,user){
                if(err) console.log(err);
                console.log(user.username,'created');
            });
            console.log('用户'+username+'注册成功');

            return res.redirect('/login');
        });
    },
    quit:function(req,res,next){
        // userscontroller.quit
        req.session.user = null;
        console.log('退出!');
        return res.redirect('/login');
    }
};