var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  inject: () => inject,
  json_file_name: () => json_file_name,
  name: () => name,
  usage: () => usage
});
module.exports = __toCommonJS(src_exports);
var import_koishi4 = require("koishi");

// src/sanae_match_system/match_mmt.ts
var import_koishi3 = require("koishi");

// src/FMPS/FMPS.ts
var import_koishi = require("koishi");
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var log1 = "khrtalk-FMPS";
var logger = new import_koishi.Logger(log1);
var FMPS = class {
  static {
    __name(this, "FMPS");
  }
  ctx;
  constructor(ctx3) {
    this.ctx = ctx3;
  }
  /**
   * json解析函数
   * @param path json文件的路径
   * @returns 解析后的JSON对象或在出错时返回null
   */
  async json_parse(path3) {
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const data = await fs.promises.readFile(path3, { encoding: "utf-8" });
        return JSON.parse(data);
      } catch (error) {
        logger.info(`尝试读取${path3}失败，尝试次数：${attempt}`);
        if (attempt === attempts) {
          logger.info(`尝试${attempt}次后依旧报错，停止尝试`);
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    return null;
  }
  /**
   * json文件创建函数
   * @param path 生成文件存放的路径
   * @param fname 文件名
   * @param json 传入的内容
   * @returns 返回文件路径
   */
  async json_create(dirPath, fname, json) {
    if (!fname.endsWith(".json")) {
      fname += ".json";
    }
    const filePath = path.join(dirPath, fname);
    const data = JSON.stringify(json, null, 2);
    await fs.promises.writeFile(filePath, data, "utf8");
    return filePath;
  }
  /**
   * 文件下载函数
   * @param url 传入下载的链接
   * @param dirPath 完整的文件存放的路径
   * @param fname 带拓展名的文件名
   */
  async file_download(url, dirPath, fname) {
    for (let i = 1; i <= 3; i++) {
      try {
        const response = await this.ctx.http.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response);
        const fullPath = path.join(dirPath, fname);
        await fs.promises.mkdir(dirPath, { recursive: true });
        await fs.promises.writeFile(fullPath, buffer);
        break;
      } catch (error) {
        const status = error.response ? error.response.status : "无法获取";
        logger.info(`文件下载出现错误，进行第${i}次尝试: 
                Error: HTTP error! status: ${status}
                url:${url}
                `);
        if (i === 3) {
          logger.info(`${i}次尝试后依旧出错😭`);
          return error;
        }
      }
    }
  }
  /**
   * 文件删除函数
   * @param dirPath 文件夹路径
   * @param file 文件名称，缺省时将删除文件夹内全部内容
   */
  async file_delete(dirPath, file) {
    const fs3 = require("fs").promises;
    if (file) {
      const filePath = path.join(dirPath, file);
      try {
        await fs3.unlink(filePath);
        logger.info(`文件 ${filePath} 已被删除`);
      } catch (error) {
        logger.info(`删除文件时出错: ${error}`);
      }
    } else {
      try {
        await fs3.rmdir(dirPath, { recursive: true });
        logger.info(`目录 ${dirPath} 及其内容已被删除`);
      } catch (error) {
        logger.info(`删除目录时出错: ${error}`);
      }
    }
  }
  /**
   * 图片保存函数
   * @param dirPath 完整的文件存放的路径
   * @param fname 带拓展名的文件名
   * @param b64 图片的 Base64 编码字符串，包括前缀
   */
  async img_save(dirPath, fname, b64) {
    try {
      const base64Data = b64.split(";base64,").pop();
      if (!base64Data) {
        throw new Error("Invalid Base64 data");
      }
      const buffer = Buffer.from(base64Data, "base64");
      const fullPath = path.join(dirPath, fname);
      await fs.promises.mkdir(dirPath, { recursive: true });
      await fs.promises.writeFile(fullPath, buffer);
    } catch (error) {
      console.error(`保存图片时出错: ${error.message}`);
    }
  }
};

// src/FMPS/FMPS_F.ts
var import_koishi2 = require("koishi");
var fs2 = __toESM(require("fs/promises"));
var path2 = __toESM(require("path"));
var log = "ba-plugin-FMPS";
var logger2 = new import_koishi2.Logger(log);
var ctx = new import_koishi2.Context();
async function rootF(mainfile, filename) {
  const mfile = mainfile ? mainfile : "bap-FMDS";
  const filepath = filename ? "/" + filename : "";
  let root;
  for (let i = 0; i < 3; i++) {
    try {
      root = path2.join(ctx.baseDir, "data", mfile + filepath);
      await fs2.mkdir(root, { recursive: true });
      break;
    } catch (error) {
      if (i == 2) {
        logger2.info("尝试创建文件夹" + i + "次后依旧出错");
      }
    }
  }
  return root;
}
__name(rootF, "rootF");
async function file_search(filePath) {
  try {
    await fs2.access(filePath, fs2.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}
__name(file_search, "file_search");

// src/sanae_match_system/match_mmt.ts
var ctx2 = new import_koishi3.Context();
var fmp = new FMPS(ctx2);
function DeleteSpace(input) {
  return input.replace(/\s+/g, "");
}
__name(DeleteSpace, "DeleteSpace");
function TransToSmall(input) {
  return input.replace(/[A-Za-z]+/g, (match) => match.toLowerCase());
}
__name(TransToSmall, "TransToSmall");
function TransToHalf(input) {
  let half = "";
  for (const char of input) {
    const insideCode = char.charCodeAt(0);
    if (65281 <= insideCode && insideCode <= 65374) {
      half += String.fromCharCode(insideCode - 65248);
    } else {
      half += char;
    }
  }
  return half;
}
__name(TransToHalf, "TransToHalf");
function pretreat(input) {
  input = DeleteSpace(input);
  input = TransToHalf(input);
  input = TransToSmall(input);
  return input;
}
__name(pretreat, "pretreat");
async function ExactMatchName(input) {
  let result = [];
  input = pretreat(input);
  const root = await rootF("mmt_img");
  const NameData = await fmp.json_parse(`${root}/${json_file_name}`);
  const ExactNameData = NameData.map((student) => {
    const processedStudent = {};
    for (const key in student) {
      if (typeof student[key] === "string") {
        processedStudent[key] = pretreat(student[key]);
      } else if (Array.isArray(student[key])) {
        processedStudent[key] = student[key].map((nickname) => pretreat(nickname));
      }
    }
    return processedStudent;
  });
  for (const student of ExactNameData) {
    if (student.FirstName_jp == input) {
      result.push(student.Id);
    }
    if (student.FirstName_zh == input) {
      result.push(student.Id);
    }
    if (student.Name_en == input) {
      result.push(student.Id);
    }
    if (student.Name_jp == input) {
      result.push(student.Id);
    }
    if (student.Name_kr == input) {
      result.push(student.Id);
    }
    if (student.Name_zh_cn == input) {
      result.push(student.Id);
    }
    if (student.Name_zh_ft == input) {
      result.push(student.Id);
    }
    if (student.Name_zh_tw == input) {
      result.push(student.Id);
    }
    for (const name2 of student.NickName) {
      if (name2 == input) {
        result.push(student.Id);
      }
    }
  }
  const result_set = new Set(result);
  return Array.from(result_set);
}
__name(ExactMatchName, "ExactMatchName");
function JaccardSimilarity(str1, str2) {
  const arr1 = str1.split("");
  const arr2 = str2.split("");
  const intersectionSize = arr1.filter((item) => arr2.includes(item)).length;
  const unionSize = arr1.length + arr2.length - intersectionSize;
  const similarity = intersectionSize / unionSize;
  return similarity;
}
__name(JaccardSimilarity, "JaccardSimilarity");
async function JaccardFuzzyMatch(input) {
  input = pretreat(input);
  const root = await rootF("mmt_img");
  const NameData = await fmp.json_parse(`${root}/${json_file_name}`);
  const ExactNameData = NameData.map((student) => {
    const processedStudent = {};
    for (const key in student) {
      if (typeof student[key] === "string") {
        processedStudent[key] = pretreat(student[key]);
      } else if (Array.isArray(student[key])) {
        processedStudent[key] = student[key].map((nickname) => pretreat(nickname));
      }
    }
    return processedStudent;
  });
  const StudentList = ExactNameData.map((names) => {
    const SetStudent = {};
    SetStudent.Id = names.Id;
    let FirstNames = [names.FirstName_jp, names.FirstName_zh];
    const FirstNames_set = new Set(FirstNames);
    SetStudent.FirstNames = Array.from(FirstNames_set);
    let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
    const Names_set = new Set(Names);
    SetStudent.Names = Array.from(Names_set);
    SetStudent.NickNames = names.NickName;
    return SetStudent;
  });
  let results = [];
  for (const student of StudentList) {
    let FirstName_result = 0;
    for (const name2 of student.FirstNames) {
      const zi_input = input.indexOf("子");
      const zi_lib = name2.indexOf("子");
      let input_nozi = "";
      let name_nozi = "";
      if (zi_input != -1 && zi_lib != -1 && input !== "子") {
        input_nozi = input.replace("子", "");
        name_nozi = name2.replace("子", "");
      } else {
        input_nozi = input;
        name_nozi = name2;
      }
      let r = JaccardSimilarity(name_nozi, input_nozi);
      if (r > FirstName_result) {
        FirstName_result = r;
      }
    }
    let Name_result = 0;
    for (const name2 of student.Names) {
      const zi_input = input.indexOf("子");
      const zi_lib = name2.indexOf("子");
      let input_nozi = "";
      let name_nozi = "";
      if (zi_input != -1 && zi_lib != -1 && input !== "子") {
        input_nozi = input.replace("子", "");
        name_nozi = name2.replace("子", "");
      } else {
        input_nozi = input;
        name_nozi = name2;
      }
      let r = JaccardSimilarity(name_nozi, input_nozi);
      if (r > Name_result) {
        Name_result = r;
      }
    }
    let NickName_result = 0;
    for (const name2 of student.NickNames) {
      const zi_input = input.indexOf("子");
      const zi_lib = name2.indexOf("子");
      let input_nozi = "";
      let name_nozi = "";
      if (zi_input != -1 && zi_lib != -1 && input !== "子") {
        input_nozi = input.replace("子", "");
        name_nozi = name2.replace("子", "");
      } else {
        input_nozi = input;
        name_nozi = name2;
      }
      let r = JaccardSimilarity(name_nozi, input_nozi);
      if (r > NickName_result) {
        NickName_result = r;
      }
    }
    results.push([student.Id, FirstName_result, Name_result, NickName_result]);
  }
  let finalResults = [];
  for (const result of results) {
    finalResults.push([result[0], Math.max(result[1], result[2], result[3])]);
  }
  let JaccardResults = [];
  finalResults.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < finalResults.length; i++) {
    if (finalResults[i][1] != 0) {
      JaccardResults[i] = finalResults[i];
    }
  }
  return JaccardResults;
}
__name(JaccardFuzzyMatch, "JaccardFuzzyMatch");
function JaroWinklerDistance(str1, str2) {
  function jaroSimilarity(s1, s2) {
    const maxDistance = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 1);
    const matches = new Array(Math.min(s1.length, s2.length)).fill(false);
    let matchCount = 0;
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - maxDistance);
      const end = Math.min(i + maxDistance + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (!matches[j] && s1[i] === s2[j]) {
          matches[j] = true;
          matchCount++;
          break;
        }
      }
    }
    if (matchCount === 0) {
      return 0;
    }
    let t = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (matches[i]) {
        while (!matches[k]) {
          k++;
        }
        if (s1[i] !== s2[k]) {
          t++;
        }
        k++;
      }
    }
    return 1 / 3 * (matchCount / s1.length + matchCount / s2.length + (matchCount - t) / matchCount);
  }
  __name(jaroSimilarity, "jaroSimilarity");
  const jaroSimilarityScore = jaroSimilarity(str1, str2);
  const prefixScale = 0.05;
  let prefixLength = 0;
  for (let i = 0; i < Math.min(3, Math.min(str1.length, str2.length)); i++) {
    if (str1[i] === str2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }
  return jaroSimilarityScore + prefixLength * prefixScale * (1 - jaroSimilarityScore);
}
__name(JaroWinklerDistance, "JaroWinklerDistance");
async function JaroWinklerFuzzyMatch(input) {
  input = pretreat(input);
  const root = await rootF("mmt_img");
  const NameData = await fmp.json_parse(`${root}/${json_file_name}`);
  const ExactNameData = NameData.map((student) => {
    const processedStudent = {};
    for (const key in student) {
      if (typeof student[key] === "string") {
        processedStudent[key] = pretreat(student[key]);
      } else if (Array.isArray(student[key])) {
        processedStudent[key] = student[key].map((nickname) => pretreat(nickname));
      }
    }
    return processedStudent;
  });
  const StudentList = ExactNameData.map((names) => {
    const SetStudent = {};
    SetStudent.Id = names.Id;
    let FirstNames = [names.FirstName_jp, names.FirstName_zh];
    const FirstNames_set = new Set(FirstNames);
    SetStudent.FirstNames = Array.from(FirstNames_set);
    let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
    const Names_set = new Set(Names);
    SetStudent.Names = Array.from(Names_set);
    SetStudent.NickNames = names.NickName;
    return SetStudent;
  });
  let results = [];
  for (const student of StudentList) {
    let FirstName_result = 0;
    for (const name2 of student.FirstNames) {
      const zi_input = input.indexOf("子");
      const zi_lib = name2.indexOf("子");
      let input_nozi = "";
      let name_nozi = "";
      if (zi_input != -1 && zi_lib != -1 && input !== "子") {
        input_nozi = input.replace("子", "");
        name_nozi = name2.replace("子", "");
      } else {
        input_nozi = input;
        name_nozi = name2;
      }
      let r = JaroWinklerDistance(name_nozi, input_nozi);
      if (r > FirstName_result) {
        FirstName_result = r;
      }
    }
    let Name_result = 0;
    for (const name2 of student.Names) {
      const zi_input = input.indexOf("子");
      const zi_lib = name2.indexOf("子");
      let input_nozi = "";
      let name_nozi = "";
      if (zi_input != -1 && zi_lib != -1 && input !== "子") {
        input_nozi = input.replace("子", "");
        name_nozi = name2.replace("子", "");
      } else {
        input_nozi = input;
        name_nozi = name2;
      }
      let r = JaroWinklerDistance(name_nozi, input_nozi);
      if (r > Name_result) {
        Name_result = r;
      }
    }
    let NickName_result = 0;
    for (const name2 of student.NickNames) {
      const zi_input = input.indexOf("子");
      const zi_lib = name2.indexOf("子");
      let input_nozi = "";
      let name_nozi = "";
      if (zi_input != -1 && zi_lib != -1 && input !== "子") {
        input_nozi = input.replace("子", "");
        name_nozi = name2.replace("子", "");
      } else {
        input_nozi = input;
        name_nozi = name2;
      }
      let r = JaroWinklerDistance(name_nozi, input_nozi);
      if (r > NickName_result) {
        NickName_result = r;
      }
    }
    results.push([student.Id, FirstName_result, Name_result, NickName_result]);
  }
  let FirstNameResults = new Array(5);
  let NameResults = new Array(5);
  let NickNameResults = new Array(5);
  let possibleFirstNameResults = [];
  let possibleNameResults = [];
  let possibleNickNameResults = [];
  for (const result of results) {
    possibleFirstNameResults.push([result[0], result[1]]);
    possibleNameResults.push([result[0], result[2]]);
    possibleNickNameResults.push([result[0], result[3]]);
  }
  possibleFirstNameResults.sort((a, b) => b[1] - a[1]);
  possibleNameResults.sort((a, b) => b[1] - a[1]);
  possibleNickNameResults.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < 5; i++) {
    if (possibleFirstNameResults[i][1] != 0) {
      FirstNameResults[i] = possibleFirstNameResults[i];
    } else {
      FirstNameResults[i] = ["0", 0];
    }
    if (possibleNameResults[i][1] != 0) {
      NameResults[i] = possibleNameResults[i];
    } else {
      NameResults[i] = ["0", 0];
    }
    if (possibleNickNameResults[i][1] != 0) {
      NickNameResults[i] = possibleNickNameResults[i];
    } else {
      NickNameResults[i] = ["0", 0];
    }
  }
  const filteredFirstNameResults = FirstNameResults.filter((item) => !(item[0] === "0" && item[1] === 0));
  const filteredNameResults = NameResults.filter((item) => !(item[0] === "0" && item[1] === 0));
  const filteredNickNameResults = NickNameResults.filter((item) => !(item[0] === "0" && item[1] === 0));
  const combinedResults_FN = [...filteredFirstNameResults, ...filteredNameResults];
  let finalResults_FN = [];
  function processArray(arr) {
    let processedArray = [];
    for (const [str, num] of arr) {
      let mark = false;
      for (let i = 0; i < processedArray.length; i++) {
        if (str === processedArray[i][0]) {
          processedArray[i][1] = Math.max((num + processedArray[i][1]) / 2 + 0.1, num, processedArray[i][1]);
          mark = true;
        }
      }
      if (!mark) {
        processedArray.push([str, num]);
      }
    }
    return processedArray;
  }
  __name(processArray, "processArray");
  finalResults_FN = processArray(combinedResults_FN);
  finalResults_FN.sort((a, b) => b[1] - a[1]);
  let possibleResults = [];
  const combinedResults_NN = [...finalResults_FN, ...filteredNickNameResults];
  possibleResults = processArray(combinedResults_NN);
  possibleResults.sort((a, b) => b[1] - a[1]);
  let JaroWinklerDistanceResults = [];
  possibleResults.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < possibleResults.length; i++) {
    if (possibleResults[i][1] >= 0.2) {
      JaroWinklerDistanceResults[i] = possibleResults[i];
    }
  }
  return JaroWinklerDistanceResults;
}
__name(JaroWinklerFuzzyMatch, "JaroWinklerFuzzyMatch");
function TransToPinyin(input) {
  const zh = require("zh_cn");
  const pinyinArray = zh(input, { style: zh.STYLE_TONE });
  const pinyinString = pinyinArray.map((item) => item).join(" ");
  return pinyinString;
}
__name(TransToPinyin, "TransToPinyin");
function LevenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = 0;
    }
  }
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}
__name(LevenshteinDistance, "LevenshteinDistance");
function LevenshteinSimilarityScore(s1, s2) {
  const distance = LevenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarityScore = 1 - distance / maxLength;
  return similarityScore;
}
__name(LevenshteinSimilarityScore, "LevenshteinSimilarityScore");
async function LevenshteinFuzzyMatch(input) {
  input = TransToPinyin(pretreat(input));
  const root = await rootF("mmt_img");
  const NameData = await fmp.json_parse(`${root}/${json_file_name}`);
  const ExactNameData = NameData.map((student) => {
    const processedStudent = {};
    for (const key in student) {
      if (typeof student[key] === "string") {
        processedStudent[key] = TransToPinyin(pretreat(student[key]));
      } else if (Array.isArray(student[key])) {
        processedStudent[key] = student[key].map((nickname) => TransToPinyin(pretreat(nickname)));
      }
    }
    return processedStudent;
  });
  const StudentList = ExactNameData.map((names) => {
    const SetStudent = {};
    SetStudent.Id = names.Id;
    let FirstNames = [names.FirstName_jp, names.FirstName_zh];
    const FirstNames_set = new Set(FirstNames);
    SetStudent.FirstNames = Array.from(FirstNames_set);
    let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
    const Names_set = new Set(Names);
    SetStudent.Names = Array.from(Names_set);
    SetStudent.NickNames = names.NickName;
    return SetStudent;
  });
  let results = [];
  for (const student of StudentList) {
    let FirstName_result = 0;
    for (const name2 of student.FirstNames) {
      let r = LevenshteinSimilarityScore(name2, input);
      if (r > FirstName_result) {
        FirstName_result = r;
      }
    }
    let Name_result = 0;
    for (const name2 of student.Names) {
      let r = LevenshteinSimilarityScore(name2, input);
      if (r > Name_result) {
        Name_result = r;
      }
    }
    let NickName_result = 0;
    for (const name2 of student.NickNames) {
      let r = LevenshteinSimilarityScore(name2, input);
      if (r > NickName_result) {
        NickName_result = r;
      }
    }
    results.push([student.Id, FirstName_result, Name_result, NickName_result]);
  }
  let FirstNameResults = new Array(5);
  let NameResults = new Array(5);
  let NickNameResults = new Array(5);
  let possibleFirstNameResults = [];
  let possibleNameResults = [];
  let possibleNickNameResults = [];
  for (const result of results) {
    possibleFirstNameResults.push([result[0], result[1]]);
    possibleNameResults.push([result[0], result[2]]);
    possibleNickNameResults.push([result[0], result[3]]);
  }
  possibleFirstNameResults.sort((a, b) => b[1] - a[1]);
  possibleNameResults.sort((a, b) => b[1] - a[1]);
  possibleNickNameResults.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < 5; i++) {
    if (possibleFirstNameResults[i][1] != 0) {
      FirstNameResults[i] = possibleFirstNameResults[i];
    } else {
      FirstNameResults[i] = ["0", 0];
    }
    if (possibleNameResults[i][1] != 0) {
      NameResults[i] = possibleNameResults[i];
    } else {
      NameResults[i] = ["0", 0];
    }
    if (possibleNickNameResults[i][1] != 0) {
      NickNameResults[i] = possibleNickNameResults[i];
    } else {
      NickNameResults[i] = ["0", 0];
    }
  }
  const filteredFirstNameResults = FirstNameResults.filter((item) => !(item[0] === "0" && item[1] === 0));
  const filteredNameResults = NameResults.filter((item) => !(item[0] === "0" && item[1] === 0));
  const filteredNickNameResults = NickNameResults.filter((item) => !(item[0] === "0" && item[1] === 0));
  const combinedResults_FN = [...filteredFirstNameResults, ...filteredNameResults];
  let finalResults_FN = [];
  function processArray(arr) {
    let processedArray = [];
    for (const [str, num] of arr) {
      let mark = false;
      for (let i = 0; i < processedArray.length; i++) {
        if (str === processedArray[i][0]) {
          processedArray[i][1] = Math.max(num, processedArray[i][1]);
          mark = true;
        }
      }
      if (!mark) {
        processedArray.push([str, num]);
      }
    }
    return processedArray;
  }
  __name(processArray, "processArray");
  finalResults_FN = processArray(combinedResults_FN);
  finalResults_FN.sort((a, b) => b[1] - a[1]);
  let possibleResults = [];
  const combinedResults_NN = [...finalResults_FN, ...filteredNickNameResults];
  possibleResults = processArray(combinedResults_NN);
  possibleResults.sort((a, b) => b[1] - a[1]);
  let LevenshteinDistanceResults = [];
  possibleResults.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < possibleResults.length; i++) {
    if (possibleResults[i][1] >= 0.5) {
      LevenshteinDistanceResults[i] = possibleResults[i];
    }
  }
  return LevenshteinDistanceResults;
}
__name(LevenshteinFuzzyMatch, "LevenshteinFuzzyMatch");
async function FuzzyMatchName(input) {
  const MatchResult_J = JaccardFuzzyMatch(input);
  const MatchResult_JW = JaroWinklerFuzzyMatch(input);
  const MatchResult_L = await LevenshteinFuzzyMatch(input);
  let JWresult = [];
  let J_JW = [];
  for (let i = 0; i < (await MatchResult_JW).length; i++) {
    MatchResult_JW[i][1] /= 1.1;
    for (let j = 0; j < (await MatchResult_J).length; j++) {
      if (MatchResult_J[j][0] === MatchResult_JW[i][0]) {
        J_JW.push(MatchResult_J[j]);
      }
    }
  }
  if ((await MatchResult_JW).length != J_JW.length) {
    return [];
  }
  for (let i = 0; i < (await MatchResult_JW).length; i++) {
    if (J_JW[i]) {
      JWresult.push([J_JW[i][0], MatchResult_JW[i][1] * 0.55 + J_JW[i][1] * 0.45]);
    }
  }
  JWresult.sort((a, b) => b[1] - a[1]);
  const combinedResults = [...JWresult, ...MatchResult_L];
  let finalResults = [];
  function processArray(arr) {
    let processedArray = [];
    let nopush = [];
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i][0] === arr[j][0]) {
          nopush.push(arr[i][0]);
          processedArray.push([arr[i][0], arr[i][1] * 0.5 + arr[j][1] * 0.5 + 0.15]);
          break;
        }
      }
      if (nopush.indexOf(arr[i][0]) === -1) {
        if (JWresult.indexOf(arr[i]) !== -1) {
          if (arr[i][1] >= 0.454) {
            processedArray.push(arr[i]);
          }
        } else {
          if (arr[i][1] >= 0.5) {
            processedArray.push(arr[i]);
          }
        }
      }
    }
    return processedArray;
  }
  __name(processArray, "processArray");
  finalResults = processArray(combinedResults);
  finalResults.sort((a, b) => b[1] - a[1]);
  return finalResults;
}
__name(FuzzyMatchName, "FuzzyMatchName");
async function MatchStudentName(input) {
  const ExactResults = ExactMatchName(input);
  if ((await ExactResults).length != 0) {
    if ((await ExactResults).length > 5) {
      let ExactResults5 = [];
      for (let i = 0; i < 5; i++) {
        ExactResults5.push(ExactResults[i]);
      }
      return ExactResults5;
    } else {
      return ExactResults;
    }
  } else {
    const FuzzyResults = await FuzzyMatchName(input);
    let FuzzyResults_nonum = [];
    for (const result of FuzzyResults) {
      FuzzyResults_nonum.push(result[0]);
    }
    if (FuzzyResults_nonum.length != 0) {
      if (FuzzyResults_nonum.length > 5) {
        let FuzzyResults_nonum5 = [];
        for (let i = 0; i < 5; i++) {
          FuzzyResults_nonum5.push(FuzzyResults_nonum[i]);
        }
        return FuzzyResults_nonum5;
      } else {
        return FuzzyResults_nonum;
      }
    } else {
      return [];
    }
  }
}
__name(MatchStudentName, "MatchStudentName");

// src/index.ts
var import_url = require("url");
var inject = { required: ["canvas"] };
var name = "ba-koharu-talk";
var usage = `
<div style="font-size:30px; font-weight:bold;">
<span style="color: #FFD2ED;">koharu</span>-talk
<div style="border:1px solid #CCC"></div> 

<h6>0.3.0-rc</h6>
<h6>日志出现报错可尝试重启插件</h6>
<h6>指令没加载出来可尝试重启commands插件</h6>

<div style="border:1px solid #CCC"></div> 
`;
var Config = import_koishi4.Schema.object({
  auto_update: import_koishi4.Schema.boolean().required().description("### 是否每次重启都下载资源"),
  help_model: import_koishi4.Schema.boolean().default(true).description("是否使用图片的使用说明"),
  save_img: import_koishi4.Schema.boolean().default(true).description("是否本地保存输出的图片"),
  font: import_koishi4.Schema.string().default("YouYuan").description("字体设置(beta)"),
  resolution: import_koishi4.Schema.union([
    import_koishi4.Schema.const(0.25).description("x 0.25"),
    import_koishi4.Schema.const(0.5).description("x 0.5"),
    import_koishi4.Schema.const(1).description("x 1")
  ]).role("radio").required().description("分辨率设置"),
  draw_modle: import_koishi4.Schema.union([
    import_koishi4.Schema.const("canvas").description("canvas"),
    import_koishi4.Schema.const("puppeteer").description("puppeteer")
  ]).description("选择渲染方法").role("radio").required(),
  input_time: import_koishi4.Schema.number().default(6e4).description("等待图片输入时间"),
  inte: import_koishi4.Schema.intersect([
    import_koishi4.Schema.object({
      returns: import_koishi4.Schema.string().default("输入内容可能有问题(◎﹏◎)").description("不合规的回复内容"),
      type: import_koishi4.Schema.union(["百度审核", "自定义审核"]).required()
    }).description("输入文本审核配置"),
    import_koishi4.Schema.union([
      import_koishi4.Schema.object({
        type: import_koishi4.Schema.const("百度审核").required(),
        id: import_koishi4.Schema.string().description("APP ID"),
        APIKey: import_koishi4.Schema.string().description("API Key").role("secret"),
        SKey: import_koishi4.Schema.string().description("Secret Key").role("secret")
      }).description("百度审核"),
      import_koishi4.Schema.object({
        type: import_koishi4.Schema.const("自定义审核").required(),
        urls: import_koishi4.Schema.string().description("自定义审核，还没适配")
      }).description("自定义审核")
    ])
  ])
});
var json_file_name = "sms_studata_main_talk.json";
async function apply(ctx3, config) {
  const fonts = config.font;
  const A = config.resolution;
  const baiduapi = "https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined";
  const baidu_token_url = "https://aip.baidubce.com/oauth/2.0/token";
  const cos1 = "https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/";
  const qqavaurl = "https://api.qqsuu.cn/api/dm-qt?qq=";
  const id = config.inte.id;
  const apikey = config.inte.APIKey;
  const skey = config.inte.SKey;
  const drawm = config.draw_modle == "canvas" ? "" : "file://";
  const violate_text = config.inte.returns;
  const inp_time = config.input_time;
  const helpmod = config.help_model;
  const costurl = config.inte.urls;
  const color_di = "#FFEFF4";
  const log12 = "koharu-talk";
  const logger3 = new import_koishi4.Logger(log12);
  const fmp2 = new FMPS(ctx3);
  const random = new import_koishi4.Random(() => Math.random());
  const root = await rootF("mmt_img");
  const saveimg = await rootF("mmt_img", "output_save");
  var token = "";
  async function create_json() {
    await fmp2.file_download("https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/json%2Fsms_studata_main.json", root, "sms_studata_main.json");
    await fmp2.file_download("https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/json%2Fkhrtalk_satellite.json", root, "khrtalk_satellite.json");
    const smsdata = await fmp2.json_parse(`${root}/sms_studata_main.json`);
    const khrdata = await fmp2.json_parse(`${root}/khrtalk_satellite.json`);
    await fmp2.json_create(root, json_file_name, [...smsdata, ...khrdata]);
  }
  __name(create_json, "create_json");
  await create_json();
  async function tokens() {
    const grant = "grant_type=client_credentials";
    const tokenurl = `${baidu_token_url}?${grant}&client_id=${apikey}&client_secret=${skey}`;
    try {
      const out1 = await ctx3.http.get(tokenurl);
      console.log(out1.access_token);
      token = out1.access_token;
      return token;
    } catch (error) {
      logger3.info(error);
      return false;
    }
  }
  __name(tokens, "tokens");
  let process = 0;
  if (apikey == null || skey == null || id == null) {
    logger3.info("⛔ 百度审核配置填写不完整，已停用");
    process = 0;
    if (config.inte.urls) {
      process = 2;
    }
  } else {
    if (await tokens() == false) {
      logger3.info("⛔ 百度审核配置填写可能有误，已停用");
    } else {
      logger3.info("🟢 已启用百度审核");
      process = 1;
    }
  }
  console.log(process);
  async function process_baidu(text) {
    const accessToken = token;
    const urls = `${baiduapi}?access_token=${accessToken}`;
    const configs = {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    };
    const data = new URLSearchParams();
    data.append("text", text);
    const post = await ctx3.http.post(urls, data, configs);
    console.log(await post);
    if (post.conclusion == "不合规") {
      logger3.info("内容不合规");
      logger3.info(post);
    }
    return post.conclusion;
  }
  __name(process_baidu, "process_baidu");
  async function process_cut(texts) {
    const output = await ctx3.http.get("http://127.0.0.1:18000/shenhe?word=" + texts);
    return output;
  }
  __name(process_cut, "process_cut");
  async function file_random_survey() {
    let plugin_ass;
    try {
      const smsdata = await fmp2.json_parse(`${root}/sms_studata_main.json`);
      const khrdata = await fmp2.json_parse(`${root}/khrtalk_satellite.json`);
      plugin_ass = [...smsdata, ...khrdata];
    } catch (e) {
      logger3.info(e);
      return false;
    }
    for (let i = 0; i < 20; i++) {
      try {
        const pluass = random.pick(plugin_ass, 20);
        const fileChecks = pluass.map(async (i2) => {
          return await file_search(`${root}/${i2["Id_db"]}.png`);
        });
        const results = await Promise.all(fileChecks);
        const status = results.every((result) => result);
        return status;
      } catch (e) {
        logger3.info(e);
        return false;
      }
    }
  }
  __name(file_random_survey, "file_random_survey");
  async function initia() {
    logger3.info("🟡 正在更新json文件");
    const hashurl = "https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/hash.json";
    const jsonurl = "https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/json%2F";
    const newhash = await ctx3.http.get(hashurl);
    const oldjson = await fmp2.json_parse(root + "/hash.json");
    if (!oldjson) {
      await fmp2.file_download(hashurl, root, "hash.json");
    }
    function arraysEqual(a, b) {
      if (a.length !== b.length)
        return false;
      for (let i = 0; i < a.length; i++) {
        if (Object.keys(a[i]).length !== Object.keys(b[i]).length)
          return false;
        for (let key in a[i]) {
          if (a[i][key] !== b[i][key])
            return false;
        }
      }
      return true;
    }
    __name(arraysEqual, "arraysEqual");
    if (!arraysEqual(newhash, oldjson)) {
      logger3.info("☁️🆕🟡云hash更新");
      const stu_data = await fmp2.json_parse(`${root}/sms_studata_toaro_stu.json`);
      if (!await file_search(`${root}/${stu_data[stu_data.length - 1].Id_db}.png`)) {
        await init_download();
      }
    } else {
      logger3.info("☁️   🟢云hash未更新");
      for (let i = 0; i < newhash.length; i++) {
        const jsons = await fmp2.json_parse(`${root}/${oldjson[i].fname}`);
        if (jsons == null) {
          await fmp2.file_download(`${jsonurl}${newhash[i].fname}`, root, `${newhash[i].fname}`);
        }
      }
      if (config.auto_update) {
        logger3.info("🟡本地资源随机更新");
        await init_download();
      }
      return;
    }
    for (let i = 1; i < 4; i++) {
      try {
        await fmp2.file_download(hashurl, root, "hash.json");
        for (let i2 = 0; i2 < newhash.length; i2++) {
          await fmp2.file_download(`${jsonurl}${newhash[i2].fname}`, root, `${newhash[i2].fname}`);
        }
        break;
      } catch (e) {
        if (i < 3) {
          logger3.info("🟡json文件下载出错：进行第" + i + "次尝试" + e);
        } else {
          logger3.info("🔴" + i + "次尝试后依旧出错" + e);
          break;
        }
      }
    }
    logger3.info("🟢 json文件更新完毕");
  }
  __name(initia, "initia");
  async function init_download() {
    logger3.info("⬇️ 开始下载插件必须资源，请稍等哦(*＾-＾*)");
    await fmp2.file_download("https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/json%2Fsms_studata_main.json", root, "sms_studata_main.json");
    const jsondata = await fmp2.json_parse(`${root}//sms_studata_main.json`);
    const stardata = await fmp2.json_parse(`${root}/khrtalk_satellite.json`);
    try {
      const stulen = jsondata.length;
      for (let i = 0; i < stulen; i++) {
        await fmp2.file_download(`${cos1}stu_icon_db_png/${jsondata[i].Id_db}.png`, root, jsondata[i].Id_db + ".png");
        const num = Math.round(i / stulen * 100);
        if (num == 25 || num == 50 || num == 75 || num == 95) {
          logger3.info("下载进度" + num + "%");
        }
      }
      logger3.info("✔️（1/2）学生头像下载完毕");
      const starlen = stardata.length;
      for (let i = 0; i < starlen; i++) {
        await fmp2.file_download(`${cos1}mmt_stuimg/${stardata[i].Id_db}.png`, root, stardata[i].Id_db + ".png");
        const num = Math.round(i / starlen * 100);
        if (num == 25 || num == 50 || num == 75 || num == 95) {
          logger3.info("下载进度" + num + "%");
        }
      }
      logger3.info("✔️（2/2）卫星学生头像下载完毕");
      await fmp2.file_download(`${cos1}img_file/khrtalk_favor.png`, root, "khrtalk_favor.png");
      await fmp2.file_download(`${cos1}img_file/talk_helptext.jpg`, root, "talk_helptext.jpg");
      logger3.info("✔️ khr-talk资源文件下载完毕");
    } catch (e) {
      logger3.error("出现错误" + e);
      return;
    }
  }
  __name(init_download, "init_download");
  if (!await file_random_survey()) {
    logger3.info("随机资源检测未通过😿😿");
    await initia();
    await init_download();
  }
  await initia();
  async function create_background(hi) {
    const wi = 2600 * A;
    const canvas = await ctx3.canvas.createCanvas(wi, hi);
    const back = canvas.getContext("2d");
    back.fillStyle = color_di;
    back.fillRect(0, 0, wi, hi);
    return canvas.toBuffer("image/png");
  }
  __name(create_background, "create_background");
  async function create_favor_img(name2) {
    const wid = 2762 * A;
    const hei = 638 * A;
    let font_size = 100 * A;
    const favorimg = await ctx3.canvas.loadImage(`${drawm}${root}/khrtalk_favor.png`);
    const favor = await ctx3.canvas.createCanvas(wid, hei);
    const cre = favor.getContext("2d");
    cre.drawImage(favorimg, 0, 0, wid / 1.5, hei / 1.5);
    cre.textAlign = "center";
    cre.fillStyle = color_di;
    const text = `前往${name2}的羁绊剧情`;
    console.log(text.length);
    if (text.length > 16) {
      const fsize = (text.length - 16) * 1.2;
      cre.font = `bold ${font_size - fsize}px ${fonts}`;
    } else {
      cre.font = `bold ${font_size}px ${fonts}`;
    }
    cre.fillText(text, 920 * A, 345 * A);
    return favor.toDataURL("image/png");
  }
  __name(create_favor_img, "create_favor_img");
  async function create_Avatar_creation(url, stu_name) {
    const avatar_hi = 500 * A;
    const avatar_wi = 2600 * A;
    const fontsize = 140 * A;
    const img_data = await ctx3.canvas.loadImage(url);
    let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
    let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
    let bighw;
    img_data[heis] < img_data[wids] ? bighw = img_data[heis] : bighw = img_data[wids];
    const f = 500 / bighw;
    let new_h = img_data[heis] * f;
    let new_w = img_data[wids] * f;
    const canvas = await ctx3.canvas.createCanvas(avatar_wi, avatar_hi);
    const ctx_a = canvas.getContext("2d");
    ctx_a.fillStyle = color_di;
    ctx_a.fillRect(0, 0, avatar_wi, avatar_hi);
    ctx_a.save();
    ctx_a.beginPath();
    ctx_a.arc(250 * A, 250 * A, 240 * A, 0, Math.PI * 2);
    ctx_a.clip();
    ctx_a.drawImage(img_data, 0, 0, new_w * A, new_h * A);
    ctx_a.restore();
    ctx_a.fillStyle = "#000000";
    ctx_a.font = `bold ${fontsize}px ${fonts}`;
    ctx_a.fillText(stu_name, 540 * A, 180 * A);
    return canvas.toBuffer("image/png");
  }
  __name(create_Avatar_creation, "create_Avatar_creation");
  var N = 0;
  async function create_dialog_box(text, color) {
    N = 0;
    const fontSize = 105 * A;
    const lineHeight = 150 * A;
    const maxLineLength = 34;
    let baseHeight = 80 * A;
    let baseWidth = 300 * A;
    let rad = 60 * A;
    let wid_text = 0;
    function splitText(text2, maxLineWidth) {
      let lines2 = [];
      let currentLine = "";
      let currentLineWidth = 0;
      for (let char of text2) {
        let charWidth = /[\u0391-\uFFE5]/.test(char) ? 2 : 1;
        if (currentLineWidth + charWidth > maxLineWidth) {
          N++;
          lines2.push(currentLine);
          currentLine = char;
          currentLineWidth = charWidth;
        } else {
          currentLine += char;
          currentLineWidth += charWidth;
          /[\u0391-\uFFE5]/.test(char) ? wid_text += fontSize : wid_text += fontSize / 2;
        }
      }
      if (currentLine) {
        lines2.push(currentLine);
      }
      return lines2;
    }
    __name(splitText, "splitText");
    let lines = splitText(text, maxLineLength);
    baseHeight += lines.length * lineHeight;
    wid_text > 1800 * A ? wid_text = 1800 * A : "";
    baseWidth = wid_text + rad * 2;
    const canvas = await ctx3.canvas.createCanvas(baseWidth, baseHeight);
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(rad, 0);
    context.arcTo(baseWidth, 0, baseWidth, baseHeight, rad);
    context.arcTo(baseWidth, baseHeight, 0, baseHeight, rad);
    context.arcTo(0, baseHeight, 0, 0, rad);
    context.arcTo(0, 0, baseWidth, 0, rad);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.font = `bold ${fontSize}px ${fonts}`;
    context.fillStyle = "#FFFFFF";
    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i], rad - 10 * A, rad + i * lineHeight + 90 * A);
    }
    return canvas.toDataURL("image/png");
  }
  __name(create_dialog_box, "create_dialog_box");
  async function create_aside(text) {
    const fontSize = 85 * A;
    const lineHeight = 100 * A;
    const maxLineLength = 55;
    let baseHeight = 50 * A;
    let baseWidth = 180 * A;
    let rad = 40 * A;
    let wid_text = 0;
    function splitText(text2, maxLineWidth) {
      let lines2 = [];
      let currentLine = "";
      let currentLineWidth = 0;
      for (let char of text2) {
        let charWidth = /[\u0391-\uFFE5]/.test(char) ? 2 : 1;
        if (currentLineWidth + charWidth > maxLineWidth) {
          lines2.push(currentLine);
          currentLine = char;
          currentLineWidth = charWidth;
        } else {
          currentLine += char;
          currentLineWidth += charWidth;
          /[\u0391-\uFFE5]/.test(char) ? wid_text += fontSize : wid_text += fontSize / 2;
        }
      }
      if (currentLine) {
        lines2.push(currentLine);
      }
      return lines2;
    }
    __name(splitText, "splitText");
    let lines = splitText(text, maxLineLength);
    baseHeight += lines.length * lineHeight;
    wid_text > 2280 * A ? wid_text = 2280 * A : "";
    baseWidth = wid_text + rad * 2;
    const canvas = await ctx3.canvas.createCanvas(baseWidth, baseHeight);
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(rad, 0);
    context.arcTo(baseWidth, 0, baseWidth, baseHeight, rad);
    context.arcTo(baseWidth, baseHeight, 0, baseHeight, rad);
    context.arcTo(0, baseHeight, 0, 0, rad);
    context.arcTo(0, 0, baseWidth, 0, rad);
    context.closePath();
    context.fillStyle = "#D9CBD0";
    context.fill();
    context.font = `bold ${fontSize}px ${fonts}`;
    context.fillStyle = "#1C1A1B";
    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i], rad - 14 * A, rad + i * lineHeight + 55 * A);
    }
    return canvas.toDataURL("image/png");
  }
  __name(create_aside, "create_aside");
  async function create_user_Image(imagePath) {
    const image = await ctx3.canvas.loadImage(imagePath);
    const canvaswidth = 800 * A;
    let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
    let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
    const scale = canvaswidth / image[heis];
    const canvasHeight = image[heis] * scale;
    const new_wi = image[wids] * scale;
    const canvasWidth = new_wi;
    const canvas = await ctx3.canvas.createCanvas(new_wi, canvasHeight);
    const ctxs = canvas.getContext("2d");
    const cornerRadius = 60 * A;
    ctxs.beginPath();
    ctxs.moveTo(cornerRadius, 0);
    ctxs.lineTo(canvasWidth - cornerRadius, 0);
    ctxs.quadraticCurveTo(canvasWidth, 0, canvasWidth, cornerRadius);
    ctxs.lineTo(canvasWidth, canvasHeight - cornerRadius);
    ctxs.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - cornerRadius, canvasHeight);
    ctxs.lineTo(cornerRadius, canvasHeight);
    ctxs.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - cornerRadius);
    ctxs.lineTo(0, cornerRadius);
    ctxs.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctxs.closePath();
    ctxs.clip();
    ctxs.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    return canvas.toDataURL("image/png");
  }
  __name(create_user_Image, "create_user_Image");
  function type_ful(input) {
    if (input[0].type == "text") {
      return input[0].attrs.content;
    } else if (input[0].type == "img") {
      return input[0].attrs.src;
    }
  }
  __name(type_ful, "type_ful");
  function getStringLength(str) {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode >= 0 && charCode <= 255 || // 半角字符范围
      charCode >= 65377 && charCode <= 65439) {
        length += 1;
      } else {
        length += 2;
      }
    }
    return length;
  }
  __name(getStringLength, "getStringLength");
  let arr_add = true;
  function hei_cal(input) {
    let yout = 0;
    if (input[0].type == "text") {
      const tlength = getStringLength(input[0].attrs.content);
      let aa = tlength / 36;
      aa = Math.round(aa);
      aa < 1 ? aa = 1 : aa = aa;
      yout = 230 * A * aa + 20 * A;
      if (/s=/.test(input[0].attrs.content) && arr_add) {
        yout += 300 * A;
        arr_add = false;
      } else if (input[0].attrs.content == "=img") {
        yout = 800 * A + 20 * A;
      } else {
        arr_add = true;
      }
      if (input.length > 1) {
        yout += 800 * A + 20 * A;
      }
    } else if (input[0].type == "img") {
      yout = 800 * A + 20 * A;
    }
    return yout;
  }
  __name(hei_cal, "hei_cal");
  ctx3.command("talk <arg1> [...rest]", "生成momotalk对话").option("name", "-n [beta]").example("talk 小春 呜呜呜 老师").option("favo", "-f").action(async ({ session, options }, arg1, ...rest) => {
    let help_pla = [];
    if (session.event.platform == "qq") {
      help_pla[0] = "";
      help_pla[1] = "@机器人/";
      help_pla[2] = "";
      help_pla[3] = `  
🟢5.使用指令触发者的头像和自定义昵称
      ${help_pla[1]}talk =me 啊哈哈 -n 夏莱老师`;
      help_pla[4] = `🟨注意
-目前手机端的qq需要9.0.65以上版本才能发送图文消息，=img功能需要@机器人并在消息内包含图片`;
    } else {
      help_pla[0] = "和昵称";
      help_pla[1] = "";
      help_pla[2] = "▪️当@群成员时，会使用该群成员的头像和昵称(beta)";
      help_pla[3] = `  
🟢5.使用指令触发者的头像和昵称
      ${help_pla[1]}talk =me 啊哈哈`;
      help_pla[4] = "";
    }
    const help_text = `
koharu-talk-v0.3-beta
使用方法：
talk [对话对象] [正文1 正文2 正文3...] [选项]
◻️正文之间使用空格来分隔
◻️参数介绍：
◽[对话对象]：
    ▪️需输入学生名
    ▪️当输入 =me 时，会使用指令调用者的头像${help_pla[0]}
    ▪️当匹配不到角色会随机抽取
    ${help_pla[2]}
◽[正文]：
    ▪️对话内容，使用空格来分隔，每个正文会生成对话气泡
    ▪️当正文内容为 s=[文本] 时，会生成老师的消息气泡
    ▪️当正文内容为 a=[文本] 时，会生成旁白的气泡
    ▪️当正文内容为 stu=[文本] 时，会切换对话的角色
    ▪️当正文内容为 =img 时，会在这个=img的位置占位一张图片
◽[选项]
    ▪️-f 当带有“-f”选项时，会在对话尾部生成进入羁绊剧情的气泡
    ▪️-n [自定义昵称] 当带有“-n”选项时，会将-n后面的文字作为自定义昵称。注意：-n后面需要带上空格

◻️各种功能使用示例：
🟢1.常规方法
      ${help_pla[1]}talk 小春 呜呜 老师好 我来补习了
🟢2.生成老师的对话
      ${help_pla[1]}talk 爱丽丝 邦邦咔邦！ 老师早上好 s=早上好，爱丽丝
🟢3.生成旁白
      ${help_pla[1]}talk 白子 a=白子兴奋地来到了夏莱办公室 老师。现在要不要一起去骑行？
🟢4.自定义昵称
      ${help_pla[1]}talk 小春 呜呜呜呜 怎么还是不及格... -n 小笨春${help_pla[3]}
🟢6.进入羁绊剧情
      ${help_pla[1]}talk -f 若藻 呼呼呼呼 老师 你逃不掉的❤ 
      ▪️“-f”选项需要放在指令“talk”后面，并用空格分隔
🟢7.输入图片
      ${help_pla[1]}talk 柚子 =img 老师，这么快就要用我送您的劵吗 s=打大蛇能全暴击吗
      ▪️“=img”的位置会预留一个图片，后继需要根据引导发送图片
      ${help_pla[4]}
🟢8.切换对话对象
      ${help_pla[1]}talk 小绿 能陪我去买点东西吗 老师❤ s=好...好的 stu=小桃 老师怎么还不来打游戏 小绿怎么也不在 苦呀西~！  
      ▪️“stu=[角色]” 会切换默认对话的角色
      反馈：2609631906@QQ.COM 
    `;
    const json_data = await fmp2.json_parse(`${root}/${json_file_name}`);
    const optionss = {
      nick: options.name,
      favo: options.favo
    };
    console.log(optionss);
    logger3.info("arg1:" + arg1, rest);
    if (process == 1) {
      if (optionss.nick) {
        const proce_out = await process_baidu(optionss.nick);
        if (proce_out == "不合规") {
          return violate_text;
        }
      }
    } else if (process == 2) {
      if (optionss.nick) {
        const proce_out = await process_cut(optionss.nick);
        if (!proce_out.status) {
          return violate_text;
        }
      }
    }
    async function cal_arg1(arg12) {
      let stuname = [];
      let avaimg_url = "";
      if (!arg12) {
        if (helpmod) {
          return import_koishi4.h.image(root + "talk_helptext.jpg");
        } else {
          return help_text;
        }
      } else {
        try {
          if (import_koishi4.h.parse(arg12)[0].type == "text") {
            if (import_koishi4.h.parse(arg12).length > 1) {
              rest = [import_koishi4.h.parse(arg12)[0].attrs.content, ...rest];
              if (optionss.nick) {
                stuname[0] = optionss.nick;
              } else {
                stuname[0] = "";
              }
              avaimg_url = import_koishi4.h.parse(arg12)[1].attrs.src;
              return [...stuname, avaimg_url];
            }
            if (arg12 == "=me") {
              if (session.event.platform == "qq") {
                const arrurl = `https://q.qlogo.cn/qqapp/${session.bot.config.id}/${session.event.user?.id}/640`;
                const get = await ctx3.http.get(arrurl);
                if (get.byteLength <= 1512) {
                  stuname.push((await random.pick(json_data))["Id"]);
                  let stuid = json_data.find((i) => i.Id == stuname[0])?.Id_db;
                  stuname[0] = json_data.find((i) => i.Id == stuname[0])?.Name_zh_ft;
                  avaimg_url = `${drawm}${root}/${stuid}.png`;
                } else {
                  if (optionss.nick) {
                    stuname[0] = optionss.nick;
                  } else {
                    stuname[0] = "";
                  }
                  avaimg_url = arrurl;
                  return [...stuname, avaimg_url];
                }
              } else {
                try {
                  const ids = session.event.user.id;
                  const username = session.event.member.nick;
                  avaimg_url = qqavaurl + ids;
                  stuname[0] = username;
                  return [...stuname, avaimg_url];
                } catch (e) {
                  logger3.info(e);
                  stuname.push((await random.pick(json_data))["Id"]);
                  let stuid = json_data.find((i) => i.Id == stuname[0])?.Id_db;
                  stuname[0] = json_data.find((i) => i.Id == stuname[0])?.Name_zh_ft;
                  avaimg_url = `${drawm}${root}/${stuid}.png`;
                  return [...stuname, avaimg_url];
                }
              }
            } else {
              try {
                stuname = await MatchStudentName(arg12);
                console.log("sanae_match:" + stuname);
              } catch (e) {
                stuname.push((await random.pick(json_data))["Id"]);
              }
              if (stuname.length == 0) {
                stuname.push((await random.pick(json_data))["Id"]);
              } else {
                if (optionss.nick) {
                  let stuid = json_data.find((i) => i.Id == stuname[0])?.Id_db;
                  stuname[0] = optionss.nick;
                  stuname[0] == "" ? stuname[0] = json_data.find((i) => i.Id_db == stuid)?.Name_zh_ft : "";
                  avaimg_url = `${drawm}${root}/${stuid}.png`;
                  return [...stuname, avaimg_url];
                } else {
                  let stuid = json_data.find((i) => i.Id == stuname[0])?.Id_db;
                  stuname[0] = json_data.find((i) => i.Id == stuname[0])?.Name_zh_ft;
                  avaimg_url = `${drawm}${root}/${stuid}.png`;
                  return [stuname[0], avaimg_url];
                }
              }
            }
          } else if (import_koishi4.h.parse(arg12)[0].type == "at") {
            const ids = import_koishi4.h.parse(arg12)[0].attrs.id;
            const username = (await session.bot.getGuildMember(session.guildId, ids)).nick;
            avaimg_url = qqavaurl + ids;
            if (optionss.nick) {
              stuname[0] = optionss.nick;
            } else {
              stuname[0] = username;
            }
            return [...stuname, avaimg_url];
          } else {
            if (optionss.nick) {
              stuname[0] = optionss.nick;
            } else {
              stuname[0] = "";
            }
            avaimg_url = import_koishi4.h.parse(arg12)[0].attrs.src;
            return [...stuname, avaimg_url];
          }
        } catch (e) {
          logger3.info(e);
          return ["呜呜，无法处理输入的昵称"];
        }
      }
    }
    __name(cal_arg1, "cal_arg1");
    if (process == 1) {
      let arry = "";
      for (let i = 0; i < rest.length; i++) {
        if (import_koishi4.h.parse(rest[i])[0].type == "text") {
          arry += rest[i];
        }
      }
      if (!(arry == "")) {
        const proce_out = await process_baidu(arry);
        if (proce_out == "不合规") {
          return violate_text;
        }
      }
    } else if (process == 2) {
      let arry = "";
      for (let i = 0; i < rest.length; i++) {
        if (import_koishi4.h.parse(rest[i])[0].type == "text") {
          arry += rest[i];
        }
      }
      if (!(arry == "")) {
        const proce_out = await process_cut(arry);
        if (!proce_out) {
          return violate_text;
        }
      }
    }
    if (!arg1) {
      if (helpmod) {
        return import_koishi4.h.image((0, import_url.pathToFileURL)(root + "/talk_helptext.jpg").href);
      } else {
        return help_text;
      }
    }
    let arr_newy = 0;
    if (/a=/.test(rest[0])) {
      arr_newy = 260 * A;
      for (let i = 0; i < rest.length; i++) {
        if (/a=/.test(rest[i])) {
          const regex = /a=(.*)/;
          const match = rest[i].match(regex)[1];
          if (match == "") {
            const tlength = getStringLength(import_koishi4.h.parse(rest[i + 1])[0].attrs.content);
            let aa = tlength / 36;
            aa = Math.round(aa);
            aa < 1 ? aa = 1 : aa = aa;
            arr_newy += 170 * A * aa + 20 * A;
            i++;
          } else {
            const tlength = getStringLength(match);
            let aa = tlength / 36;
            aa = Math.round(aa);
            aa < 1 ? aa = 1 : aa = aa;
            arr_newy += 170 * A * aa + 20 * A;
          }
        } else {
        }
      }
    }
    if (/s=/.test(rest[0])) {
      arr_newy = 260 * A;
      for (let i = 0; i < rest.length; i++) {
        if (/s=/.test(rest[i])) {
          const regex = /s=(.*)/;
          const match = rest[i].match(regex)[1];
          if (match == "") {
            const tlength = getStringLength(import_koishi4.h.parse(rest[i + 1])[0].attrs.content);
            let aa = tlength / 36;
            aa = Math.round(aa);
            aa < 1 ? aa = 1 : aa = aa;
            arr_newy += 230 * A * aa + 20 * A;
            i++;
          } else {
            const tlength = getStringLength(match);
            let aa = tlength / 36;
            aa = Math.round(aa);
            aa < 1 ? aa = 1 : aa = aa;
            arr_newy += 230 * A * aa + 20 * A;
          }
        } else {
        }
      }
    }
    let arg1s = await cal_arg1(arg1);
    console.log(arg1s);
    async function draw_ultra() {
      let hi = 750 * A;
      for (let i = 0; i < rest.length; i++) {
        hi += hei_cal(import_koishi4.h.parse(rest[i]));
      }
      optionss.favo ? hi += 400 * A : "";
      arr_newy != 0 ? hi += 400 * A : "";
      const canvas = await ctx3.canvas.createCanvas(2600 * A, hi);
      const c = canvas.getContext("2d");
      let avadraw = await ctx3.canvas.loadImage(await create_Avatar_creation(arg1s[1], arg1s[0]));
      const backimg = await ctx3.canvas.loadImage(await create_background(hi));
      c.drawImage(backimg, 0, 0);
      c.drawImage(avadraw, 100 * A, 100 * A + arr_newy);
      let y1 = 360 * A;
      let arr_add2 = false;
      let img_place = {
        num: 0,
        x_img: 0,
        y_img: 0
      };
      const img_parr = [];
      img_parr.push(img_place.num);
      let arr_add_amend = false;
      for (let i = 0; i < rest.length; i++) {
        if (/s=/.test(rest[0])) {
          arr_add2 = false;
          arr_add_amend = true;
        } else if (arr_add_amend && /s=/.test(rest[i])) {
          if (/a=/.test(rest[i + 1])) {
            arr_add_amend = false;
            arr_add2 = false;
          } else {
            arr_add2 = true;
            arr_add_amend = true;
          }
        } else {
          arr_add_amend = false;
        }
        if (arr_add2 && !/s=/.test(rest[i]) && !/a=/.test(rest[i]) && !/stu=/.test(rest[i])) {
          y1 += 30 * A;
          c.drawImage(avadraw, 100 * A, y1);
          y1 += 240 * A;
          arr_add2 = false;
        }
        if (import_koishi4.h.parse(rest[i])[0].type == "img") {
          arr_newy == 0 ? 0 : y1 += 280 * A;
          arr_newy = 0;
          const image_bubb = await ctx3.canvas.loadImage(await create_user_Image(type_ful(import_koishi4.h.parse(rest[i]))));
          c.drawImage(image_bubb, 630 * A, y1);
          let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
          y1 += image_bubb[heis] + 20 * A;
        } else if (/s=/.test(rest[i])) {
          if (import_koishi4.h.parse(rest[i])[0].type == "img") {
            const image_bubb = await ctx3.canvas.loadImage(await create_user_Image(type_ful(import_koishi4.h.parse(rest[i + 1]))));
            let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
            c.drawImage(image_bubb, 2500 * A - image_bubb[wids], y1);
            let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
            y1 += image_bubb[heis] + 20 * A;
            arr_add2 = true;
            i++;
          } else {
            const regex = /s=(.*)/;
            const match = rest[i].match(regex)[1];
            if (match == "") {
              const talk_bubb = await ctx3.canvas.loadImage(await create_dialog_box(type_ful(import_koishi4.h.parse(rest[i + 1])), "#4a8aca"));
              let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
              c.drawImage(talk_bubb, 2550 * A - talk_bubb[wids], y1);
              let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
              y1 += talk_bubb[heis] + 20 * A;
              arr_add2 = true;
              i++;
            } else {
              const talk_bubb = await ctx3.canvas.loadImage(await create_dialog_box(match, "#4a8aca"));
              let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
              c.drawImage(talk_bubb, 2550 * A - talk_bubb[wids], y1);
              let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
              y1 += talk_bubb[heis] + 20 * A;
              arr_add2 = true;
            }
          }
        } else if (/a=/.test(rest[i])) {
          const regex = /a=(.*)/;
          const match = rest[i].match(regex)[1];
          if (match == "") {
            const talk_bubb = await ctx3.canvas.loadImage(await create_aside(type_ful(import_koishi4.h.parse(rest[i + 1]))));
            let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
            c.drawImage(talk_bubb, 1300 * A - talk_bubb[wids] / 2, y1);
            let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
            y1 += talk_bubb[heis] + 20 * A;
            i++;
          } else {
            const talk_bubb = await ctx3.canvas.loadImage(await create_aside(match));
            let wids = config.draw_modle == "canvas" ? "width" : "naturalWidth";
            c.drawImage(talk_bubb, 1300 * A - talk_bubb[wids] / 2, y1);
            let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
            y1 += talk_bubb[heis] + 20 * A;
          }
        } else if (rest[i] == "=img") {
          arr_newy == 0 ? 0 : y1 += 280 * A;
          arr_newy = 0;
          let img_p = {
            num: img_parr[0] + 1,
            x_img: 630 * A,
            y_img: y1
          };
          img_parr[0] = img_parr[0] + 1;
          img_parr.push(img_p);
          y1 += 800 * A + 20 * A;
        } else if (/stu=/.test(rest[i])) {
          const regex = /stu=(.*)/;
          const match = rest[i].match(regex)[1];
          let stuname = [];
          let avaimg_urls;
          try {
            stuname = await MatchStudentName(match);
            console.log("sanae_match:" + stuname);
          } catch (e) {
            logger3.info(e);
            stuname[0] = 0;
          }
          if (stuname[0] == 0 || stuname.length == 0) {
            stuname[0] = arg1s[0];
            avaimg_urls = arg1s[1];
            arr_add2 = false;
          } else {
            let stuid = json_data.find((i2) => i2.Id == stuname[0])?.Id_db;
            stuname[0] = json_data.find((i2) => i2.Id == stuname[0])?.Name_zh_ft;
            avaimg_urls = `${drawm}${root}/${stuid}.png`;
            arr_add2 = true;
          }
          avadraw = await ctx3.canvas.loadImage(await create_Avatar_creation(avaimg_urls, stuname[0]));
        } else {
          arr_newy == 0 ? 0 : y1 += 280 * A;
          arr_newy = 0;
          const talk_bubb = await ctx3.canvas.loadImage(await create_dialog_box(type_ful(import_koishi4.h.parse(rest[i])), "#4c5b70"));
          c.drawImage(talk_bubb, 630 * A, y1);
          let heis = config.draw_modle == "canvas" ? "height" : "naturalHeight";
          y1 += talk_bubb[heis] + 20 * A;
        }
      }
      if (optionss.favo) {
        const favoimg = await ctx3.canvas.loadImage(await create_favor_img(arg1s[0]));
        y1 += 50 * A;
        c.drawImage(favoimg, 630 * A, y1);
      }
      console.log(img_parr);
      let img_prom = [];
      if (img_parr[0] > 0) {
        session.send(`需要输入${img_parr[0]}张图片
${session.event.platform == "qq" ? "请@机器人后" : "请"}逐张发送图片`);
        let erri = 0;
        for (let i = 0; i < img_parr[0]; i++) {
          const mess = import_koishi4.h.parse(await session.prompt(inp_time));
          if (mess[0].type == "img") {
            img_prom.push(type_ful(mess));
            if (img_parr[0] - i == 1) {
              session.send(`输入完毕，图片渲染中~`);
            } else {
              session.send(`还需要输入${img_parr[0] - i - 1}张图片`);
            }
          } else if (mess[0].attrs.content == "退出" || erri >= 2) {
            return "已经终止创作";
          } else {
            session.send(`输入的不是图片，请重新输入
${session.event.platform == "qq" ? "@机器人并发送“退出”终止写文" : "发送“退出”终止写文"}`);
            erri++;
            i--;
          }
        }
        if (img_prom.length != img_parr[0])
          return "输入图片超时，请重新写作";
        for (let i = 0; i < img_prom.length; i++) {
          y1 -= 700 * A;
        }
        for (let i = 0; i < img_prom.length; i++) {
          const image_bubb = await ctx3.canvas.loadImage(await create_user_Image(img_prom[i]));
          c.drawImage(image_bubb, 630 * A, img_parr[i + 1].y_img);
          let heis = config.draw_modle ? "height" : "naturalHeight";
          y1 += image_bubb[heis] + 20 * A;
        }
      }
      const img2 = await canvas.toDataURL("image/png");
      return img2;
    }
    __name(draw_ultra, "draw_ultra");
    const img = await draw_ultra();
    if (config.save_img) {
      await fmp2.img_save(saveimg, `${session.event.user?.id}_${random.int(0, 9999999)}.png`, img);
    }
    return import_koishi4.h.image(img);
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  inject,
  json_file_name,
  name,
  usage
});
