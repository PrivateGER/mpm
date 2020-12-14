<?php

require_once __DIR__ . "/gpg.php";

echo file_get_contents(CONFIG["GPG_PUBLIC_KEY_PATH"]);

