var express = require('express');
var router = express.Router();

// Ruta GET para obtener el listado de usuarios
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
