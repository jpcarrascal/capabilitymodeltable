// url-parser.js - Handles URL parameters for capability model selection
(function() {
    // Function to parse URL query parameters
    function getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        
        if (queryString) {
            const pairs = queryString.split('&');
            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                params[key] = decodeURIComponent(value || '');
            });
        }
        
        return params;
    }

    // Function to convert URL params to the JSON format expected by the app
    function convertParamsToJson(params, tableData) {
        // Create a deep copy of the table data
        const jsonData = JSON.parse(JSON.stringify(tableData));
        
        // Map of param prefixes to their corresponding state in the JSON
        const stateMap = {
            'c': 'currentState',
            'g': 'aspirationalState'
        };
        
        // Map of parameter suffixes (a-f) to row indices (0-5)
        const rowMap = {
            'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5
        };
        
        // Process each parameter
        Object.keys(params).forEach(param => {
            if (param.length !== 2) return; // Skip parameters that don't match our format
            
            const statePrefix = param[0]; // 'c' or 'g'
            const rowSuffix = param[1];   // 'a' through 'f'
            
            // Check if this is a valid parameter format
            if (stateMap[statePrefix] && rowMap[rowSuffix] !== undefined) {
                const rowIndex = rowMap[rowSuffix];
                const cellIndex = parseInt(params[param], 10) - 1; // Convert 1-based to 0-based index
                
                // Only process if we have a valid row and cell index
                if (rowIndex < jsonData.rows.length && cellIndex >= 0 && cellIndex < jsonData.headers.length) {
                    const row = jsonData.rows[rowIndex];
                    const stateProp = stateMap[statePrefix];
                    
                    // If the state doesn't exist yet, create it
                    if (!row[stateProp]) {
                        row[stateProp] = { cellIndex: cellIndex };
                    } else {
                        row[stateProp].cellIndex = cellIndex;
                    }
                    
                    // Preserve x and y coordinates if they exist, or set default values
                    // These are placeholders that will likely be overridden by the app's rendering logic
                    if (!row[stateProp].x) {
                        // Calculate a default x value based on cellIndex (simple placeholder)
                        row[stateProp].x = 350 + (cellIndex * 250);
                    }
                    
                    if (!row[stateProp].y) {
                        // Calculate a default y value based on rowIndex (simple placeholder)
                        row[stateProp].y = 300 + (rowIndex * 70);
                    }
                }
            }
        });
        
        return jsonData;
    }

    // When the window loads, check for URL parameters and apply them
    window.addEventListener('load', function() {
        const params = getQueryParams();
        
        // Only proceed if we have parameters that match our expected format
        const hasCapabilityParams = Object.keys(params).some(param => 
            (param.startsWith('c') || param.startsWith('g')) && 
            param.length === 2 && 
            'abcdef'.includes(param[1])
        );
        
        if (hasCapabilityParams) {
            // Try to find the app's table data and table file upload function
            const findAndProcessAppData = function() {
                // The app likely has the table data stored in a global variable or a React component's state
                // We'll need to fetch the base table structure first
                fetch('table.json')
                    .then(response => response.json())
                    .then(tableData => {
                        // Convert our URL parameters to the JSON format expected by the app
                        const jsonData = convertParamsToJson(params, tableData);
                        
                        // Now we need to inject this data into the app
                        // This is tricky without knowing the exact app structure
                        // For now, we'll expose it as a global variable
                        window.urlParamData = jsonData;
                        
                        // Dispatch a custom event that our event-bridge.js file will listen for
                        const event = new CustomEvent('urlParamDataReady', { detail: jsonData });
                        document.dispatchEvent(event);
                    })
                    .catch(error => {
                        console.error('Error loading table data:', error);
                    });
            };
            
            // Start the process
            findAndProcessAppData();
        }
    });
})();