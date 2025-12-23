<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database configuration
$host = 'localhost';
$dbname = 'book_reviews';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get latest 50 images
    $stmt = $pdo->query("SELECT id, file_name, file_type, file_size, uploaded_at FROM uploaded_images ORDER BY uploaded_at DESC LIMIT 50");
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert to base64 data URLs for frontend display
    $imageData = [];
    foreach ($images as $image) {
        $stmt = $pdo->prepare("SELECT image_data FROM uploaded_images WHERE id = ?");
        $stmt->execute([$image['id']]);
        $imageBlob = $stmt->fetchColumn();
        
        $imageData[] = [
            'id' => $image['id'],
            'url' => 'data:' . $image['file_type'] . ';base64,' . base64_encode($imageBlob),
            'file_name' => $image['file_name'],
            'file_type' => $image['file_type'],
            'file_size' => $image['file_size'],
            'uploaded_at' => $image['uploaded_at']
        ];
    }

    echo json_encode($imageData);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>