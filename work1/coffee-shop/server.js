const express = require('express');
const path = require('path');
const indexRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`☕ Brew & Bean Coffee Shop running at http://localhost:${PORT}`);
});

module.exports = app;
