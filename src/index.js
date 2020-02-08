const fs = require("fs");

// List all files in a directory in Node.js recursively in a synchronous fashion
const walkSync = function(dir = __dirname, files = []) {
  const _files = fs.readdirSync(dir).map(file => `${dir}/${file}`);
  _files.forEach(file => {
    if (fs.statSync(file).isDirectory()) {
      walkSync(file, files);
    } else {
      files.push(file);
    }
  });
  return files;
};
const files = walkSync("src");
console.log(files);

const getFileContent = file => {
  console.log(file);
  fs.readFile(file, (e, data) => {
    if (e) {
      throw e;
    }
    data = data.toString();
    const pattern = /\/\*{2}(\n^\s\*.*)*\//gim;
    while ((a = pattern.exec(data))) {
      console.log(a[0]);
    }
  });
};

getFileContent(files[0]);
