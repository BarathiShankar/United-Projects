<?php
//PHP file to link the data form web to database
// Database credentials
$servername = "Main_Server";
$username = "Host";
$password = "12345";
$dbname = "Main_DataBase";
// Creates connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Checks connection
if ($conn->connect_error) {
    die("Connection to database failed : " . $conn->connect_error);
}
$sql = "SELECT * FROM STAFF";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // Output data of each row
    while($row = $result->fetch_assoc()) {
        echo "ID: " . $row["SID"] . " - Name: " . $row["Name"] . "<br>";
    }
} else {
    echo "0 results";
}
$conn->close();
?>
