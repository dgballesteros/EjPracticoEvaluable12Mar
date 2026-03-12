// Importación de módulos
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Importación de rutas
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// Creación de la aplicación Express
var app = express();

// Configuración del motor de plantillas EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Rutas estáticas para servir las librerías desde node_modules
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/vendor/leaflet', express.static(path.join(__dirname, 'node_modules/leaflet/dist')));
app.use('/vendor/sweetalert2', express.static(path.join(__dirname, 'node_modules/sweetalert2/dist')));

// Registro de rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Manejo de error 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Manejo de errores generales
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
