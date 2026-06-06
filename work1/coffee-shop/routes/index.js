const express = require('express');
const router = express.Router();
const path = require('path');

// Load menu data
let menuData;
try {
  menuData = require('../data/menu.json');
} catch (err) {
  console.error('Failed to load menu data:', err.message);
  menuData = [];
}

// Default contact form state
function getContactState(params = {}) {
  return {
    success: params.success || null,
    errors: params.errors || {},
    formData: params.formData || { name: '', email: '', message: '' }
  };
}

// GET / — Home page with featured coffees
router.get('/', (req, res) => {
  const featured = menuData.filter(item => item.featured);
  res.render('pages/home', {
    title: 'Brew & Bean — Home',
    currentPage: 'home',
    featured
  });
});

// GET /menu — Full coffee menu
router.get('/menu', (req, res) => {
  // Group by category
  const categories = {};
  menuData.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  res.render('pages/menu', {
    title: 'Brew & Bean — Menu',
    currentPage: 'menu',
    categories,
    menuItems: menuData
  });
});

// GET /about — About page
router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'Brew & Bean — Our Story',
    currentPage: 'about'
  });
});

// GET /contact — Contact page (also rendered on POST with errors/success)
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Brew & Bean — Contact Us',
    currentPage: 'contact',
    ...getContactState()
  });
});

// POST /contact — Handle contact form submission
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  const errors = {};

  // Validate name
  if (!name || name.trim().length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  // Validate message
  if (!message || message.trim().length < 10) {
    errors.message = 'Please enter a message (at least 10 characters).';
  }

  if (Object.keys(errors).length > 0) {
    // Re-render with errors
    return res.render('pages/contact', {
      title: 'Brew & Bean — Contact Us',
      currentPage: 'contact',
      success: null,
      errors,
      formData: { name: name || '', email: email || '', message: message || '' }
    });
  }

  // Log the contact submission
  console.log('📬 Contact form submission:', {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    timestamp: new Date().toISOString()
  });

  // Render success
  res.render('pages/contact', {
    title: 'Brew & Bean — Contact Us',
    currentPage: 'contact',
    success: 'Thank you! Your message has been received. We\'ll get back to you soon.',
    errors: {},
    formData: { name: '', email: '', message: '' }
  });
});

module.exports = router;
