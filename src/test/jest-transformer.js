const { transform } = require('sucrase');

module.exports = {
  process(src, filename) {
    const result = transform(src, {
      transforms: ['typescript', 'jsx', 'imports'],
      filePath: filename,
      production: false,
    });
    return {
      code: result.code,
    };
  },
};
