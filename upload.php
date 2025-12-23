<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost';
$dbname = 'book_reviews';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Check if files were uploaded
        if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
            throw new Exception('No files uploaded');
        }

        $uploadedFiles = $_FILES['images'];
        $successCount = 0;
        $errors = [];

        // Prepare SQL statement
        $stmt = $pdo->prepare("INSERT INTO uploaded_images (image_data, file_name, file_type, file_size) VALUES (?, ?, ?, ?)");

        // Process each uploaded file
        foreach ($uploadedFiles['name'] as $index => $name) {
            if ($uploadedFiles['error'][$index] === UPLOAD_ERR_OK) {
                $tmpName = $uploadedFiles['tmp_name'][$index];
                $fileType = $uploadedFiles['type'][$index];
                $fileSize = $uploadedFiles['size'][$index];
                
                // Validate file type
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($fileType, $allowedTypes)) {
                    $errors[] = "File $name: Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.";
                    continue;
                }
                
                // Validate file size (5MB max)
                if ($fileSize > 5 * 1024 * 1024) {
                    $errors[] = "File $name: File too large. Maximum size is 5MB.";
                    continue;
                }
                
                // Read file data
                $imageData = file_get_contents($tmpName);
                
                // Insert into database
                $stmt->execute([$imageData, $name, $fileType, $fileSize]);
                $successCount++;
            } else {
                $errors[] = "File $name: Upload error (" . $uploadedFiles['error'][$index] . ")";
            }
        }

        $response = [
            'success' => true,
            'message' => "Successfully uploaded $successCount image(s)",
            'count' => $successCount
        ];
        
        if (!empty($errors)) {
            $response['warnings'] = $errors;
        }

        echo json_encode($response);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>