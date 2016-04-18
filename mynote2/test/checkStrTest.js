var checkStr=require('../util/checkStr')

err = checkStr.registerCheck('章伟','','');
console.log(err);
err = checkStr.registerCheck('zhangwei_','Zhangwei001','Zhangwei001');
console.log(err);
err = checkStr.registerCheck('zhangwei','Zhangwei001','');
console.log(err);
/*err = checkStr.registerCheck('','','');
console.log(err);
err = checkStr.registerCheck('','','');
console.log(err);
err = checkStr.registerCheck('','','');
console.log(err);
err = checkStr.registerCheck('','','');
console.log(err);*/
