// path-fix.js - Intercepts fetch calls to fix absolute path references
(function() {
    // Store the original fetch function
    const originalFetch = window.fetch;
    
    // Function to get the base URL of the application
    function getBasePath() {
        // Use window.location to determine the base path more reliably
        // This will work no matter where the page is hosted or loaded from
        const location = window.location;
        return location.protocol + '//' + location.host + location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    }
    
    // Override the fetch function to intercept calls to /table.json
    window.fetch = function(resource, options) {
        // If the resource is /table.json (absolute path)
        if (resource === '/table.json') {
            // Get the base path
            const basePath = getBasePath();
            
            // Redirect to the relative path
            console.log('Redirecting fetch from /table.json to ' + basePath + 'table.json');
            return originalFetch(basePath + 'table.json', options);
        }
        
        // Otherwise, use the original fetch function
        return originalFetch.apply(this, arguments);
    };
})();