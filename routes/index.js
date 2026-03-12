const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Ruta principal /
router.get('/', function(req, res) {
    res.render('index', { title: 'Monumentos de Málaga' });
});

// Endpoint API que devuelve los monumentos desde el archivo en la carpeta public/data/monumentos.geojson
router.get('/api/monumentos', function(req, res) {
    const filePath = path.join(__dirname, '..', 'public', 'data', 'monumentos.geojson');
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) {
            return res.status(500).json({ error: 'No se han podido cargar los datos' });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

module.exports = router;
