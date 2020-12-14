<?php

header("Content-Type: text/plain");

define("CONFIG", array(
    "ROOT" => __DIR__,
    "GPG_FINGERPRINT" => "BDA292CAAED6F139396165A699E059BFFC10F559",
    "GPG_PRIVATE_KEY_PATH" => __DIR__ . "/key.asc",
    "GPG_PUBLIC_KEY_PATH" => __DIR__ . "/pubkey.pub",
));