(function () {
  'use strict';

  // ============================================
  // Hamburger Menu Toggle
  // ============================================
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('nav-open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close nav when a link is clicked (mobile)
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('nav-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!hamburgerBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('nav-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ============================================
  // Contact Form Validation
  // ============================================
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      let hasErrors = false;
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');

      // Clear previous errors
      document.querySelectorAll('.form-error').forEach(function (el) {
        el.textContent = '';
      });

      // Validate name
      if (nameInput) {
        const errorEl = document.getElementById('name-error');
        if (nameInput.value.trim().length < 2) {
          if (errorEl) errorEl.textContent = 'Please enter your name (at least 2 characters).';
          hasErrors = true;
        }
      }

      // Validate email
      if (emailInput) {
        const errorEl = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
          if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
          hasErrors = true;
        }
      }

      // Validate message
      if (messageInput) {
        const errorEl = document.getElementById('message-error');
        if (messageInput.value.trim().length < 10) {
          if (errorEl) errorEl.textContent = 'Please enter a message (at least 10 characters).';
          hasErrors = true;
        }
      }

      if (hasErrors) {
        e.preventDefault();
      }
    });
  }

  // ============================================
  // Active nav highlight from current URL
  // ============================================
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

})();
