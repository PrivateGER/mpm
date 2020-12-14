<?php

require_once __DIR__ . "/gpg.php";

if(!isset($_GET["genre"]) || empty($_GET["genre"])) {
    die(gpg_sign(json_encode(array(
        "results" => [],
        "err" => "Supply a ?genre parameter.",
    ))));
}

$packages = json_decode(file_get_contents(__DIR__ . "/storage/meta.json"), true);

$results = [];
foreach ($packages["packages"] as $package => $data) {
    if($data["genre"] === $_GET["genre"]) {
        $results[] = $package;
    }
}

echo gpg_sign(json_encode([
    "results" => $results
]));
