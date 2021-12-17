const axios = require("axios");
const fs = require("fs");
const htmlparser2 = require("htmlparser2");

const url = "https://sitetwo.netlify.app/";
// const url = "https://whatithinkofher.netlify.app/";

axios.get(url).then((response) => {
  const dir = `./site`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir);

  let document = "";

  const parser = new htmlparser2.Parser({
    onopentag(name, attributes) {
      const atts = [];

      Object.keys(attributes).forEach((key) => {
        if (attributes[key]) {
          atts.push(`${key}="${attributes[key]}"`);
        } else {
          atts.push(`${key}`);
        }
      });

      atts.forEach((attribute, i) => {
        if (attribute.includes("/") || attribute.includes(".")) {
          const sourcePath = attribute.split("=")[1].slice(1, -1);
          const sourceURL =
            (sourcePath.includes("http") ? "" : url) +
            sourcePath.replace(/\.\//, "");
          const baseName = sourceURL.split("/").pop().split(".")[0];
          const urlString = sourceURL.split("/")[2].split(".").join("-");
          const fileExtension = sourceURL.split(".").pop();
          const fileName = baseName + "-" + urlString + "." + fileExtension;

          console.log(sourcePath, fileName);

          axios.get(sourceURL).then(({ data }) => {
            // Make this root files
            // Make this downlaod images
            fs.writeFileSync(`${dir}/${fileName}`, data);
          });
          atts[i] = `${attribute.split("=")[0]}=${fileName}`;
        }
      });

      if (atts.length) {
        document += `<${name} ${atts.join(" ")}>`;
      } else {
        document += `<${name}>`;
      }
    },
    ontext(text) {
      document += text;
    },
    onclosetag(name) {
      document += `</${name}>`;
    },
  });
  parser.write(response.data);
  parser.end();
  fs.writeFileSync(dir + "/index.html", document);
});
