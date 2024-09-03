document.addEventListener('DOMContentLoaded', function() {
    var locationForm = document.getElementById('locationForm');
    var catalogResults = document.getElementById('catalogResults');
    var categoryList = document.getElementById('categoryList');
    var locationInfo = document.getElementById('locationInfo');

    // Check if geolocation is supported by the browser
    if (navigator.geolocation) {
        locationForm.style.display = 'block';

        // Add event listener to the "Detect Location" button
        document.getElementById('locationBtn').addEventListener('click', function() {
            locationForm.style.display = 'none';

            // Call the function to retrieve location information
            retrieveLocationInfo();
        });
    } else {
        locationForm.style.display = 'none';
        locationInfo.innerHTML = '<p>Geolocation is not supported by your browser.</p>';
    }

    function retrieveLocationInfo() {
        // Show loader
        const loader = document.createElement('div');
        loader.classList.add('spinner-border');
        loader.setAttribute('role', 'status');
        loader.style.color = '#091722'; // Set the color directly using inline style
        const span = document.createElement('span');
        span.classList.add('visually-hidden');
        span.textContent = 'Loading...';
        loader.appendChild(span);
        locationInfo.innerHTML = '';
        locationInfo.appendChild(loader);


        // Retrieve the client's IP address
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(async data => {
                const clientIP = data.ip;

                try {
                    // Make an AJAX request to the PHP script with the client's IP
                    const response = await fetch(`api_handler.php?ip=${clientIP}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });

                    if (response.ok) {
                        const responseData = await response.json();

                        // Display additional location information on the screen
                        displayLocationInfo(clientIP, responseData);

                        // Check if catalog response is available
                        if (responseData.catalogResponse) {
                            processCatalogResponse(responseData.catalogResponse);
                        } else {
                            // Catalog response not available
                            // catalogResults.innerHTML = '<p>Unable to retrieve catalog data.</p>';
                        }
                    } else {
                        // Error retrieving location information
                        catalogResults.innerHTML = '<p>Unable to retrieve location information.</p>';
                    }
                } catch (error) {
                    console.log('Error retrieving client IP address:', error);
                    catalogResults.innerHTML = '<p>Unable to retrieve IP address.</p>';
                }
            })
            .catch(error => {
                console.log('Error retrieving client IP address:', error);
                catalogResults.innerHTML = '<p>Unable to retrieve IP address.</p>';
            });
    }



    // Function to display location information on the screen
    function displayLocationInfo(clientIP, response) {
        var locationInfoHtml = `
<div class="location-info text-center">
  <div class="row justify-content-center"> <!-- Add justify-content-center class here -->

    <div class="col-md-2">
      <div class="d-inline">
        <i class="fas fa-globe"></i>
    
        <span>${response.country_name}</span>
      </div>
    </div>
    <div class="col-md-2">
      <div class="d-inline">
        <i class="fas fa-city"></i>
        <span class="city">${response.city}</span>
      </div>
    </div>
  </div>
</div>
`;

        locationInfo.innerHTML = locationInfoHtml;

        // Process the catalog response
        processCatalogResponse(response.papers, response);

    }

    function processCatalogResponse(catalogResponse, response) {
        console.log(response);

        // Check if the response has an error
        if (catalogResponse && catalogResponse.error) {
            // Display the error message
            catalogResults.innerHTML = '<p>Unable to retrieve catalog data.</p>';
        } else if (catalogResponse && catalogResponse.length > 0) {
            // Initialize an empty string to store the HTML content
            var catalogResultsHtml = '';

            // Iterate over each paper in the catalog response
            catalogResponse.forEach(function(paper, index) {
                // Check if it's the first card of a row
                if (index % 4 === 0) {
                    // Close the previous row div if it exists
                    if (index !== 0) {
                        catalogResultsHtml += '</div>';
                    }
                    // Open a new row div
                    catalogResultsHtml += '<div class="row justify-content-center">';
                }

                // Add the card HTML to the row with a delay
                catalogResultsHtml += `
        <div class="col-md-3">
          <div class="card card-animation" style="animation-delay: ${index * 0.2}s;">
            <div class="position-relative">
              <img src="https://viewer.ipaper.io${paper.url}/Image.ashx?PageNumber=1&ImageType=Normal" class="card-img-top" alt="Fissure in Sandstone">
              <img src="${response.country_flag}" class="country-flag" alt="Country Flag" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            </div>
            <div class="card-body text-center">
              <h5 class="card-title">${paper.name}</h5>
              <a href="https://viewer.ipaper.io${paper.url}" class="btn btn-primary btn-rounded" target="_blank">Link</a>
            </div>
          </div>
        </div>
      `;

                // Check if it's the last card of a row
                if (((index + 1) % 4 === 0 && index !== 0) || index === catalogResponse.length - 1) {
                    // Close the current row div
                    catalogResultsHtml += '</div>';
                }
            });

            // Set the catalogResults HTML content
            catalogResults.innerHTML = catalogResultsHtml;
        } else {
            // No papers found
            catalogResults.innerHTML = '<p>No papers found in your region. 😞</p>';
        }
    }

});