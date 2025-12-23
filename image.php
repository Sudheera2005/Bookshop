<?php
// Serve individual images by ID
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'book_reviews';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        
        $stmt = $pdo->prepare("SELECT image_data, file_type FROM uploaded_images WHERE id = ?");
        $stmt->execute([$id]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($image) {
            header('Content-Type: ' . $image['file_type']);
            echo $image['image_data'];
        } else {
            http_response_code(404);
            echo 'Image not found';
        }
    } else {
        http_response_code(400);
        echo 'Image ID required';
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo 'Database error';
}
?>