var notescontroller = require('../controllers/notesController');

module.exports = function(app){
    app.route('/')
            .get(notescontroller.list);
    app.route('/post')
            .post(notescontroller.new)
            .get(notescontroller.old);
    app.route('/delete')
            .get(notescontroller.delete);
}