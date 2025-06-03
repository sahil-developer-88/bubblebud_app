const fs = require('fs');
const path = require('path');
const https = require('https');

const downloadFile = (url, destination) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
        console.log(`Downloaded ${url} to ${destination}`);
      });
    }).on('error', err => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(err);
    });
  });
};

const main = async () => {
  try {
    const soundsDir = path.join('client', 'public', 'sounds');
    
    // Create sounds directory if it doesn't exist
    if (!fs.existsSync(soundsDir)) {
      fs.mkdirSync(soundsDir, { recursive: true });
    }
    
    // Download relaxing background music
    await downloadFile(
      'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-54.mp3',
      path.join(soundsDir, 'relaxing_background.mp3')
    );
    
    // Download a nicer coin sound
    await downloadFile(
      'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1992.mp3',
      path.join(soundsDir, 'coin_collect.mp3')
    );
    
    console.log('All sounds downloaded successfully');
  } catch (error) {
    console.error('Error downloading sounds:', error);
  }
};

main();