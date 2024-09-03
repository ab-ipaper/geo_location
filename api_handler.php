<?php
function getClientIP() {
    // Get the client's IP address from the query parameter
    $clientIP = filter_input(INPUT_GET, 'ip', FILTER_VALIDATE_IP);

    // Validate and sanitize the IP address
    if ($clientIP === false) {
        // Invalid IP address provided, handle the error
        $response['error'] = 'Invalid IP address';
        return $response;
    }

    return $clientIP;
}

function getGeolocationData($clientIP) {
    // Retrieve the API key from the environment variable
    $apiKey = getenv('IP_GEOLOCATION_API_KEY');

    // Make a request to the ipgeolocation.io API to get the location details
    $requestUrl = "https://api.ipgeolocation.io/ipgeo?apiKey={$apiKey}&ip={$clientIP}";

    // Initialize the response variable
    $response = [];

    // Make the API request and handle errors
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    $data = file_get_contents($requestUrl, false, $context);

    if ($data === false) {
        // Error handling
        $response['error'] = 'Failed to retrieve geolocation information';
    } else {
        $locationData = json_decode($data, true);
        $response['ip'] = $locationData['ip'];
        $response['country_flag'] = $locationData['country_flag'];
        $response['country_name'] = $locationData['country_name'];
        $response['state_prov'] = $locationData['state_prov'];
        $response['city'] = $locationData['city'];
      
    }

    return $response;
}

function getMatchingPapers($country_name) {
    // Retrieve the credentials and paper ID from environment variables
    $plUsername = getenv('ip_user');
    $plPassword = getenv('ip_password');
    $paperID = getenv('ip_paper');

    // Make the POST request to ipaper.api.ipapercms.dk
    $postData = http_build_query([
        'plUsername' => $plUsername,
        'plPassword' => $plPassword,
        'paperID' => $paperID
    ]);

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, 'https://ipaper.api.ipapercms.dk/V2/Paper.asmx/GetAllPapers');
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($curl);
    curl_close($curl);

    $matchingPapers = [];

    if ($result === false) {
        // Error handling
        $matchingPapers['error'] = 'Failed to retrieve catalog data';
    } else {
        $catalogResponse = simplexml_load_string($result);

        // Find the category
        $category = $catalogResponse->xpath("//category[@name='" . $country_name . "']");

        if ($category) {
            // Iterate over the paper elements inside the category
            foreach ($category[0]->paper as $paper) {
                // Extract the attributes of each paper
                $paperId = (string) $paper['id'];
                $paperName = (string) $paper['name'];
                $paperUrl = (string) $paper['url'];

                // Add the paper details to the array
                $matchingPapers[] = [
                    'name' => $paperName,
                    'url' => $paperUrl
                ];
            }
        }

        if (empty($matchingPapers)) {
            $matchingPapers['error'] = 'No papers found matching the country';
        }
    }

    return $matchingPapers;
}

function processRequest() {
    // Get the client's IP address
    $clientIP = getClientIP();

    // Get geolocation data for the client IP
    $geolocationData = getGeolocationData($clientIP);

    // Initialize the response variable
    $response = [];

    if (isset($geolocationData['error'])) {
        // Return geolocation error
        $response['error'] = $geolocationData['error'];
    } else {
        $response['country_flag'] = $geolocationData['country_flag'];
        $response['country_name'] = $geolocationData['country_name'];
        $response['state_prov'] = $geolocationData['state_prov'];
        $response['city'] = $geolocationData['city'];
        // Get matching papers based on the city
        $matchingPapers = getMatchingPapers($response['country_name']);

        if (isset($matchingPapers['error'])) {
            // Return catalog error
            $response['error'] = $matchingPapers['error'];
            unset($response['papers']); // Remove the papers field if there is an error
        } else {
            $response['papers'] = $matchingPapers;
        }
    }

    // Return the response as JSON
    echo json_encode($response);
}

// Process the request
processRequest();


