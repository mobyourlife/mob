var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/contato', function(req, res) {
  res.render('contato', { title: 'Contato' });
});

module.exports = router;
