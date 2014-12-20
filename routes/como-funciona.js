var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/como-funciona', function(req, res) {
  res.render('como-funciona', { title: 'Como Funciona' });
});

module.exports = router;
