var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/inicio');
});

router.get('/inicio', function(req, res) {
  res.render('index', { link: 'inicio', title: 'Bem-vindo à facilidade!' });
});

module.exports = router;
