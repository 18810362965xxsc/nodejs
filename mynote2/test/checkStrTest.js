var checkStr=require('../util/checkStr')

err = checkStr.registerCheck('陈静','','');
console.log(err);
err = checkStr.registerCheck('chenjing_','Chenjingi001','Chenjing001');
console.log(err);
err = checkStr.registerCheck('chenjing','Chenjing001','');
console.log(err);
/*err = checkStr.registerCheck('','','');
console.log(err);
err = checkStr.registerCheck('','','');
console.log(err);
err = checkStr.registerCheck('','','');
console.log(err);
err = checkStr.registerCheck('','','');
console.log(err);*/
