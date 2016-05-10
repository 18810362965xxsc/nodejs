var userscontroller = require('../controllers/usersController');

module.exports = function(app){
    app.route('/login')
            .get(userscontroller.getlogin)
            .post(userscontroller.postlogin);
    app.route('/register')
            .get(userscontroller.getregister)
            .post(userscontroller.postregister);
    app.route('/quit')
            .get(userscontroller.quit);
};