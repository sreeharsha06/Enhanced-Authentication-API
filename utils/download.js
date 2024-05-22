
const downloadImage = async (url, filepath) => {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(filepath))
        .on('finish', () => resolve(filepath))
        .on('error', e => reject(e));
    });
  };

module.exports = downloadImage;