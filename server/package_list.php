<?php

require_once __DIR__ . "/gpg.php";

header("Content-Type: text/plain");

echo gpg_sign(file_get_contents(__DIR__ . "/storage/meta.json"));