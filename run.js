const axios = require('axios');
const JSZip = require('jszip');
const fs = require('fs');

const host = "http://34.125.53.86:2358/";
const setupContents = fs.readFileSync("./setup.js").toString();
const testContents = fs.readFileSync("./test/sample-test.js").toString();
const hardhatContents = fs.readFileSync("./hardhat.config.js").toString();
const contractsContents = fs.readFileSync("./contracts/Greeter.sol").toString();

function formatStream(outputStream) {
    return atob(outputStream.replace(/(\r\n|\n|\r)/gm, ""));
}

(async () => {
    const submitURL = host + "submissions/?base64_encoded=true&wait=false";

    try {
        const zip = new JSZip();
        zip.file("hardhat.config.js", hardhatContents);
        const testFolder = zip.folder("test");
        testFolder.file("sample-test.js", testContents);
        const contractsFolder = zip.folder("contracts");
        contractsFolder.file("Greeter.sol", contractsContents);

        const content = await zip.generateAsync({ type: "base64" });

        const response = await axios.post(submitURL, {
            "source_code": btoa(setupContents),
            "additional_files": content,
            "language_id": 163
        });

        const { token } = response.data;

        const fetchURL = host + `submissions/${token}`;

        setInterval(async () => {
            const response = await axios.get(fetchURL);

            const { data: { status, stdout, stderr } } = response;
            
            if (status.id > 2) {
                if (stderr) {
                    console.log(formatStream(stderr));
                }
                else {
                    console.log(formatStream(stdout));
                }
                process.exit();
            }
        }, 1000);
    }
    catch (ex) {
        console.log(ex.message);
    }
})();