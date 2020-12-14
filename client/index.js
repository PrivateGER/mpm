let fs = require("fs");
let openpgp = require("openpgp");
let requests = require("request");
let Agent = require('socks5-http-client/lib/Agent');

let config = {
    "server_url": "http://localhost:9999",
    "socks5enabled": false,
    "socks5host": "localhost",
    "socks5port": 9050,
    "gpgPublicKey": "key.pub",
    "packageListFile": "cache.db",
    "dataPath": "files/"
}

let packageListData = {

};

console.log("mpm - v0.0.1")

if(!fs.existsSync("config.json")) {
    fs.appendFileSync("config.json", JSON.stringify(config));
    console.log("[ERR] config.json does not exist. It has been created, please fill it accordingly.")
    process.exit(1);
} else {
    config = JSON.parse(fs.readFileSync("config.json").toString());
}

if(!fs.existsSync(config.packageListFile)) {
    fs.appendFileSync(config.packageListFile, "{}");
    console.log("[INFO] Created package DB.");
} else {
    packageListData = JSON.parse(fs.readFileSync(config.packageListFile).toString());
}

if(!fs.existsSync(config.dataPath)) {
    fs.mkdirSync(config.dataPath, { recursive: true });
    console.log("[INFO] Created data storage directory recursively.")
}

function save_package_list() {
    fs.writeFileSync(config.packageListFile, JSON.stringify(packageListData));
}

async function gpgSetup() {
    if (fs.existsSync(config.gpgPublicKey)) {
        let publicKey = await openpgp.key.readArmored(fs.readFileSync(config.gpgPublicKey).toString());
        console.log("Loaded GPG Key with fingerprint " + publicKey.keys[0].primaryKey.getFingerprint().toUpperCase() + " for verification.");
        return publicKey;
    } else {
        console.log(`[ERR] Please create ${config.gpgPublicKey} and fill it with the server's public key. You can find it at ${config.server_url}/publicKey.php`)
        process.exit(1);
    }
}

async function gpg_verify(text, publicKey) {
    const verified = await openpgp.verify({
        message: await openpgp.cleartext.readArmored(text),
        publicKeys: publicKey.keys
    });

    if(verified.signatures[0].valid) {
        console.log("[INFO] Verified response signed by " + verified.signatures[0].keyid.toHex().toUpperCase());
        return true;
    } else {
        console.log("[ERR] Could not verify server response with the GPG key. Please check if you have the correct one configured.")
        process.exit(1);
    }
}

function gpg_strip(text) {
    let newText = text.replace("Hash: SHA512", "")
        .replace(/(?<=-----BEGIN PGP SIGNATURE-----)(.*)(?=-----END PGP SIGNATURE-----)/s, "")
        .replace("-----BEGIN PGP SIGNATURE----------END PGP SIGNATURE-----", "")
        .replace("-----BEGIN PGP SIGNED MESSAGE-----", "")
        .replace(/\\\n/sg, "");
    return newText;
}

let fetch;
if(config.socks5enabled) {
    const wrappedFetch = require('socks5-node-fetch')
    fetch = wrappedFetch({
        socksHost: config.socks5host,
        socksPort: config.socks5port
    });
} else {
    fetch = require('node-fetch');
}

(async function() {
    gpgSetup().then((publicKey) => {
        if(process.argv[2] === undefined) {
            console.log(`Commands:
            help - Show this
            list - List all known packages
            sync - Synchronize with the upstream server
            search <author | genre> <term> - Search the known packages
            download <title[]> - download given packages
            `)
        } else {
            command_handler(process.argv, publicKey)
        }
    });
}());

function command_handler(argv, publicKey) {
    let topLevelCommand = argv[2];
    if(topLevelCommand === "help") {
        console.log(`Commands:
            help - Show this
            list - List all known packages
            sync - Synchronize with the upstream server
            search <artist | genre> <term> - Search the known packages
            download <title[]> - download given packages
            `)
    } else if(topLevelCommand === "list") {
        Object.keys(packageListData).forEach((el) => {
            console.log(el);
        });
    } else if(topLevelCommand === "sync") {
        fetch(config.server_url + "/package_list.php", {
            method: "GET"
        })
            .then((res) => { return res.text() })
            .then((res) => {
                gpg_verify(res, publicKey);

                packageListData = JSON.parse(gpg_strip(res)).packages;
                save_package_list();
        });
    } else if(topLevelCommand === "download") {
        for(let i = 3; i < argv.length; i++) {
            if(fs.existsSync(config.dataPath + "/" + argv[i] + "/song.mp3")) {
                console.log("[INFO] Skipping " + argv[i] + ", files already exist.");
                continue;
            }

            console.log("[INFO] Downloading " + argv[i]);

            fetch(config.server_url + "/storage/packages/" + argv[i] + "/song.mp3")
                .then(res => {
                    fs.mkdirSync(config.dataPath + "/" + argv[i], { recursive: true });
                    const dest = fs.createWriteStream(config.dataPath + "/" + argv[i] + "/song.mp3");
                    res.body.pipe(dest);
                });
        }
    } else if(topLevelCommand === "search") {
        if((argv[3] !== "artist" && argv[3] !== "genre") || argv[4] === undefined) {
            console.log("[ERR] Please provide either author or genre as search tag.");
            process.exit(1);
        }

        let term = [...argv];
        term.splice(0, 4);
        term = term.join(" ").toLowerCase();

        let results = [];
        Object.keys(packageListData).forEach((key) => {
            if(argv[3] === "artist") {

                if(packageListData[key]["artist"] === term) {
                    results.push(key);
                }
            }
            if(argv[3] === "genre") {

                if(packageListData[key]["genre"] === term) {
                    results.push(key);
                }
            }
        });

        results.forEach((el) => console.log(el));
    }
}

