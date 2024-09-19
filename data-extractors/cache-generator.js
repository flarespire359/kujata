const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')

// In fenrir, a large number of assets are used
// This is a convenience method to bundle the assets already in the kujata-data directory
// Into a single zip that can be downloaded once unzipped and cached by a service worker

/* Current files:
    `${KUJATA_BASE}/metadata/window-assets/window.bin.metadata.json`
    into
    `${KUJATA_BASE}/metadata/window-assets/${assetType}/${asset.description}.png`

    
    `${KUJATA_BASE}/metadata/menu-assets/menu_us.metadata.json`
    into
    `${KUJATA_BASE}/metadata/menu-assets/${assetType}/${asset.description}.png`

    
    `${KUJATA_BASE}/metadata/credits-assets/credits-font.metadata.json`
    into
    `${KUJATA_BASE}/metadata/credits-assets/${assetType}/${asset.description}.png`

    
    `${KUJATA_BASE}/metadata/disc-assets/disc.metadata.json`
    into
    `${KUJATA_BASE}/metadata/disc-assets/${assetType}/${asset.description}.png`


    `${KUJATA_BASE}/metadata/field-assets/flevel.metadata.json`
    into
    `${KUJATA_BASE}/metadata/field-assets/${assetType}/${asset.description}.png`
*/
const generateCachedBundle = async config => {
  console.log('generateCachedBundle: START')
  const rootDir = config['kujata-data-output-directory']
  const zipConfig = [
    { folder: '/metadata/window-assets', file: 'window.bin.metadata.json' },
    { folder: '/metadata/menu-assets', file: 'menu_us.metadata.json' },
    { folder: '/metadata/credits-assets', file: 'credits-font.metadata.json' },
    { folder: '/metadata/disc-assets', file: 'disc.metadata.json' },
    { folder: '/metadata/field-assets', file: 'flevel.metadata.json' }
  ]

  let allFilesToZip = []

  // Loop through zipConfig
  for (let config of zipConfig) {
    const configFilePath = path.join(rootDir, config.folder, config.file)

    // Read the config file (flevel.metadata.json)
    const configFile = JSON.parse(fs.readFileSync(configFilePath))

    // Loop through each folder key in the config file
    for (const folderName in configFile) {
      if (Array.isArray(configFile[folderName])) {
        // Each folder will have an array of objects with 'description' field
        const folderItems = configFile[folderName]

        for (const item of folderItems) {
          // Build the full path for each required file (e.g. description.png)
          const filePath = path.join(
            rootDir,
            config.folder,
            folderName,
            `${item.description}.png`
          )
          allFilesToZip.push(filePath)
        }
      }
    }
  }

  // console.log('allFilesToZip', allFilesToZip.length)
  // Create a ZIP file using JSZip
  const zip = new JSZip()

  // Add each file to the ZIP
  for (let file of allFilesToZip) {
    const fileNameInZip = path.relative(rootDir, file) // Keep relative path inside the ZIP
    const fileData = fs.readFileSync(file) // Read the file contents
    zip.file(fileNameInZip, fileData) // Add the file to the ZIP
  }

  // Generate the ZIP file
  const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

  // Write the ZIP file to the specified output
  const zipPath = path.join(rootDir, 'cache.zip')
  fs.writeFileSync(zipPath, zipContent)

  console.log('generateCachedBundle: END', allFilesToZip.length, zipPath)
}

module.exports = {
  generateCachedBundle
}
