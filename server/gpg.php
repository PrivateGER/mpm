<?php

require_once __DIR__ . "/../CONFIG.php";

function gpg_config_initialize() : gnupg {
    $gpg = new gnupg();
    $gpg->seterrormode(gnupg::ERROR_EXCEPTION);

    // Check key ring for recipient public key, otherwise import it
    $keyInfo = $gpg->keyinfo(CONFIG["GPG_FINGERPRINT"]);
    if (empty($keyInfo)) {
        echo "Trying import.";
        $gpg->import(CONFIG["GPG_PRIVATE_KEY_PATH"]);
    }
    $gpg->addencryptkey(CONFIG["GPG_FINGERPRINT"]);
    $gpg->addsignkey(CONFIG["GPG_FINGERPRINT"]);

    return $gpg;
}

function gpg_sign($text) {
    $gpg_instance = gpg_config_initialize();

    return $gpg_instance->sign($text);
}

