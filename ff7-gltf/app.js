require("./ff7-to-gltf.js")();
const fs = require("fs");

var config = JSON.parse(require("fs").readFileSync("config.json"));

let hrcFileId = "AAAA";       // "AAAA" = translate AAAA.HRC (Cloud)
let baseAnimFileId = "AAFE";  // "AAFE" = use Cloud standing animation as default structure (null = use Ifalna DB)
let animFileId = "AAGA";      // "AAGA" = add Cloud running aniation to the output glTF     (null = don't add any animations)
let includeTextures = true;   // true = include references to xxxx.png in the output glTF

translate_ff7_field_hrc_to_gltf(config, hrcFileId, baseAnimFileId, animFileId, includeTextures);

/*
// translate every *.hrc.json file in the skeletons directory
let filenames = fs.readdirSync(config.inputFieldDirectory);
for (let i=0; i<filenames.length; i++) {
  let filename = filenames[i];
  if (filename.toLowerCase().endsWith(".hrc")) {
    let hrcFileId = filename.slice(0, 4);
    try {
      translate_ff7_field_hrc_to_gltf(config, hrcFileId, null, null, includeTextures);
    } catch (err) {
      console.log('Error while trying to translate: ' + filename + ':', err);
      //break; // uncomment this line to stop on failure
    }
  }
}
*/
