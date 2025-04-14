// event-bridge.js - Connects URL parameters to the app's existing file upload functionality
(function() {
    // Keep track of whether we've already processed URL parameters
    let urlParamsProcessed = false;

    // Function to find and monkey-patch the app's file reader event
    function setupFileReaderOverride() {
        // The original FileReader.prototype.readAsText method
        const originalReadAsText = FileReader.prototype.readAsText;
        
        // Override the readAsText method to intercept file reads
        FileReader.prototype.readAsText = function(blob) {
            // Check if we have URL parameter data and haven't processed it yet
            if (window.urlParamData && !urlParamsProcessed) {
                // Convert our data to a string
                const jsonString = JSON.stringify(window.urlParamData);
                
                // Create a fake load event
                const event = new ProgressEvent('load');
                
                // Set the result on the FileReader instance
                Object.defineProperty(this, 'result', {
                    get: function() {
                        return jsonString;
                    }
                });
                
                // Mark as processed so we don't do this again
                urlParamsProcessed = true;
                
                // Dispatch the load event asynchronously
                setTimeout(() => {
                    this.dispatchEvent(event);
                }, 0);
                
                return;
            }
            
            // Otherwise, call the original method
            return originalReadAsText.apply(this, arguments);
        };
    }

    // Listen for our custom event from the url-parser.js file
    document.addEventListener('urlParamDataReady', function(e) {
        // Store the data from the URL parameters
        window.urlParamData = e.detail;
        
        // Set up the FileReader override
        setupFileReaderOverride();
        
        // Now we need to trigger the app's file upload functionality
        // We'll do this by finding any file input elements and simulating a change event
        setTimeout(() => {
            // Try to find a file input in the document
            const fileInputs = document.querySelectorAll('input[type="file"]');
            
            if (fileInputs.length > 0) {
                // Create a fake File object
                const fakeFile = new File(['{}'], 'params.json', { type: 'application/json' });
                
                // Create a fake FileList
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(fakeFile);
                
                // Set the fake file on the input
                fileInputs[0].files = dataTransfer.files;
                
                // Dispatch a change event on the file input
                const changeEvent = new Event('change', { bubbles: true });
                fileInputs[0].dispatchEvent(changeEvent);
            } else {
                console.log('No file inputs found. Waiting for DOM updates...');
                
                // Set up a MutationObserver to watch for file inputs being added to the page
                const observer = new MutationObserver((mutations) => {
                    const fileInputs = document.querySelectorAll('input[type="file"]');
                    if (fileInputs.length > 0) {
                        observer.disconnect();
                        
                        // Create a fake File object
                        const fakeFile = new File(['{}'], 'params.json', { type: 'application/json' });
                        
                        // Create a fake FileList
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(fakeFile);
                        
                        // Set the fake file on the input
                        fileInputs[0].files = dataTransfer.files;
                        
                        // Dispatch a change event on the file input
                        const changeEvent = new Event('change', { bubbles: true });
                        fileInputs[0].dispatchEvent(changeEvent);
                    }
                });
                
                observer.observe(document.body, { 
                    childList: true, 
                    subtree: true 
                });
            }
        }, 500); // Small delay to ensure the app has initialized
    });
})();