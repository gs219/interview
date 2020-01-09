const http = require("http");
const fsp = require("fs").promises;
const mime = require("mime");
const path = require("path");

const headerStr =
  "<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <title>\u9759\u6001\u6587\u4EF6\u670D\u52A1\u5668</title>\r\n</head>\r\n<body>\r\n";
const footerStr = "</body>\r\n\r\n</html>";

const handleDir = async (req, res, filePath) => {
  const files = await fsp.readdir(filePath);
  let str = "<div>";
  if (req.url !== "/") {
    const array = req.url.split("/");
    let href = "/";
    array.map((item, index) => {
      if (item && index !== array.length - 1) {
        href += item + "/";
      }
    });
    str += "<div><a href=" + '"' + href + '"' + ">返回上层</a></div>";
  }
  str += "<ul>";
  files.map(name => {
    let endWithSlash = false;
    let url = '';
    if (req.url.charAt(req.url.length) === "/") {
      endWithSlash = true;
    }
    if (endWithSlash) {
      url = url + name;
    } else {
      url = url + "/" + name;
    }
    str += "<li>" + "<a href=" + url + ">" + name + "</a>";
    ("</li>");
  });
  str += "</ul></div>";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "text/html;charset=utf-8");
  res.end(headerStr + str + footerStr);
};

const handleFile = async (req, res, filePath) => {
  const mineType = mime.getType(filePath);
  let data = null;
  switch (mineType) {
    case "text/html": {
      data = await fsp.readFile(filePath);
      res.setHeader("content-type", "text/html");
      break;
    }
    case "text/plain":
    case "text/css":
    case "application/javascript": {
      data = await fsp.readFile(filePath);
      res.setHeader("Content-Type", "text/plain");
      break;
    }
    default: {
      data = await fsp.readFile(filePath);
      res.setHeader("Content-Type", mineType);
    }
  }
  const stat = await fsp.lstat(filePath);
  const ifModifiedSince = req.headers["if-modified-since"];
  let LastModified = stat.ctime.toGMTString();
  if (ifModifiedSince == LastModified) {
    res.writeHead(304);
    res.end();
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "private,max-age=30");
    res.setHeader("Expires", new Date(Date.now() + 30 * 1000).toGMTString());
    res.setHeader("Last-Modified", stat.ctime.toGMTString());
    res.end(data);
  }
};

http
  .createServer(async (req, res) => {
    if (req.url === "/favicon.ico") {
      throw new Error("not found");
    }

    try {
      let filePath = path.join(__dirname, req.url);
      const stat = await fsp.lstat(filePath);
      if (stat.isDirectory()) {
        // 目录
        await handleDir(req, res, filePath);
      } else {
        // 文件
        await handleFile(req, res, filePath);
      }
    } catch (e) {
      res.statusCode = 404;
      res.end("Not Found");
    }
  })
  .listen(8080);
