const axios = require("axios");
const htmlparser2 = require("htmlparser2");
const fs = require("fs");

const url = "https://sitetwo.netlify.app/";

axios.get(url).then((response) => {
  fs.rmSync("./site", { recursive: true, force: true });
  fs.mkdirSync("./site");

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
        // This ensure its a tag with a link to a file
        if (attribute.includes(".")) {
          let sourcePath = attribute.split("=")[1].slice(1, -1); // .slice removes quotes around

          if (sourcePath.startsWith("/")) {
            sourcePath = sourcePath.substring(1); // remove starting "/" if it exists
          }

          const sourceURL =
            (sourcePath.includes("http") ? "" : url) +
            sourcePath.replace(/\.\//, ""); // generate a url to valid file

          const fileExtension = sourceURL.split(".").pop();

          const fileName =
            sourceURL.split("/").pop().split(".")[0] + // base name of the original file
            "-" +
            sourceURL.split("/")[2].split(".").join("-") + // url domain seperated by "-"
            "." +
            fileExtension;

          const pathname = new URL(sourceURL).pathname.split("/");
          pathname.pop();
          pathname.shift();
          pathname.push("");

          const dir =
            "./site/" +
            pathname.join("/").substring(0, pathname.join("/").length + 6);

          if (
            fileExtension === "jpg" ||
            fileExtension === "png" ||
            fileExtension === "jpeg"
          ) {
            axios({
              method: "get",
              url: sourceURL,
              responseType: "stream",
            }).then((response) => {
              fs.mkdirSync(dir, { recursive: true });
              response.data.pipe(
                fs.createWriteStream("./site/" + pathname.join("/") + fileName)
              );
            });
          } else {
            axios.get(sourceURL).then(({ data }) => {
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync("./site/" + pathname.join("/") + fileName, data);
            });
          }

          atts[i] = `${attribute.split("=")[0]}="${
            pathname.join("/") + fileName
          }"`;
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
  fs.writeFileSync("./site/index.html", document);
});
