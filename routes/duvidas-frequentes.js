var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/duvidas-frequentes', function(req, res) {
  res.render('duvidas-frequentes', { title: 'Dúvidas Frequentes' });
});

module.exports = router;
