var url = require('url');
var moment = require('moment');
module.exports={
    list:function(req,res,next){
        // notescontroller.list
        if(req.session.user!=null){
            var page=Number(url.parse(req.url,true).query.page);
            if(!page){
                page=1;
            }

            req.models.notes.find({where:{author:req.session.user.username},skip:(page-1)*5,limit:5,sort:"createdAt DESC"}).exec(function(err, docs){
                if(err){
                    console.log('获取笔记列表失败');
                    return res.redirect('/');
                }
                return res.render('detail',{
                    user:req.session.user,
                    list:docs,
                    totalPage:1,
                    currentPage:page,
                    moment:moment,
                    pageTitle:'首页'
                });
            });
        }else{
            res.redirect('/login')
        }
    },
    new:function(req,res,next){

        var title=req.body.title.trim(),
            tag=req.body.tag.trim(),
            content=req.body.content.trim(),
            _id=req.body._id,
            author=req.session.user.username;
        if(!_id) {
            //新建note实体
            var note = {
                title: title,
                author: author,
                tag: tag,
                content: content
            };
            console.log(note);
            //保存数据库
            req.models.notes.create(note,function (err, doc) {
                if (err) {
                    console.log(err);
                    return res.redirect('/');
                }
                console.log(doc,'笔记发布成功！');
                return res.redirect('/');
            });
        }else{
            req.models.notes.update({id:_id},{"title":title,"tag":tag,"content":content},function(err, doc){
                if(err){
                    console.log(err);
                    return res.redirect('/');
                }
                console.log(doc);
                console.log("id"+_id+"updated")
                return res.redirect('/');
            })
        }
    },
    old:function(req,res,next){
        res.render('post',{
            user:req.session.user,
            title:"",
            tag:"",
            content:'',
            err:"",
            pageTitle:'发布笔记'
        });
    },
    delete:function(req,res,next){

        var id = url.parse(req.url,true).query._id;
        console.log("delete note,id="+id);
        console.log(url.parse(req.url,true));
        req.models.notes.destroy({id:id},function(err){
            if(err){
                console.log(err);
                res.redirect('/')
            }else{
                console.log('note删除成功');
                res.redirect('/');
            }
        });
    }
};