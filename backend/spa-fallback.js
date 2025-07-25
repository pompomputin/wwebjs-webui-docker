const path = require('path');

// This middleware function will serve the main index.html file
// for any route that isn't an API route or a static file.
const spaFallback = (req, res, next) => {
  // Check if the request is for an API endpoint. If so, let it pass.
  // Add any other API prefixes you might have, like '/auth'
  if (req.path.startsWith('/session')) {
    return next();
  }

  // Check if the request is for a static file with an extension.
  // If it has an extension (like .css, .js, .png), assume it's a file request.
  if (path.extname(req.path)) {
    return next();
  }
  
  // For all other requests, send the main entry point of your Vue app.
  res.sendFile(path.join(__dirname, 'frontend_build', 'index.html'));
};

module.exports = spaFallback;
