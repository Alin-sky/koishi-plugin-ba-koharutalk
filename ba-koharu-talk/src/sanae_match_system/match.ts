// 定义各种学生名字的接口
interface StudentName {
    "Id": string;
    "FirstName_jp": string;
    "FirstName_zh": string;
    "Name_jp": string;
    "Name_en": string;
    "Name_zh_tw": string;
    "Name_kr": string;
    "Name_zh_cn": string;
    "Name_zh_ft": string;
    "NickName": string[]
}
// 从文件中读取学生名
const NameData: StudentName[] = require("./MatchLib.json") as StudentName[];

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义字符串预处理函数：删除字符串中的空白字符
function DeleteSpace(input: string): string {
    return input.replace(/\s+/g, '')
}
// 定义字符串预处理函数：将字符串中所有英文字母转换为小写
function TransToSmall(input: string): string {
    return input.replace(/[A-Za-z]+/g, match => match.toLowerCase())
}
// 定义字符串预处理函数：将字符串中所有的全角字符转换为半角字符
function TransToHalf(input: string): string {
    let half = "";
    for (const char of input) {
    const insideCode = char.charCodeAt(0);
    if (65281 <= insideCode && insideCode <= 65374) {
      half += String.fromCharCode(insideCode - 65248);
    } else {
      half += char;
    }
  }
  return half
}
// 定义字符串预处理统合函数
function pretreat(input: string): string {
    input = DeleteSpace(input);
    input = TransToHalf(input);
    input = TransToSmall(input);
    return input
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义精准匹配算法
function ExactMatchName(input: string): string[] {
    // 建立一个匹配结果集合用于记录匹配结果，匹配结果可能不止一个
    let result: string[] = [];
    // 预处理输入字符串
    input = pretreat(input)
    // 为确保比对准确性，对基础文本同样进行预处理
    const ExactNameData: StudentName[] = NameData.map(student => {
        const processedStudent: StudentName = {} as StudentName;
        for (const key in student) {
          if (typeof student[key] === 'string') {
            processedStudent[key] = pretreat(student[key]);
          } else if (Array.isArray(student[key])) {
            processedStudent[key] = student[key].map(nickname => pretreat(nickname));
          }
        }
        return processedStudent;
      });
    // 遍历所有学生名字信息进行匹配
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
        for (const name of student.NickName) {
            if (name == input) {
                result.push(student.Id);
            }
        }
    }
    // 合并结果并输出
    const result_set = new Set(result);
    return Array.from(result_set)
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义 Jaccard 相似度计算函数
function JaccardSimilarity(str1: string, str2: string): number {
    // 将字符串转换为字符集合
    const arr1 = str1.split('');
    const arr2 = str2.split('');
    // 计算交集大小
    const intersectionSize = arr1.filter(item => arr2.includes(item)).length;
    // 计算并集大小
    const unionSize = arr1.length + arr2.length - intersectionSize;
    // 计算 Jaccard 相似度
    const similarity = intersectionSize / unionSize;
    return similarity;
}
  
// 定义基于 Jaccard 相似度的中文字符串模糊匹配算法
function JaccardFuzzyMatch(input: string): [string, number][] {
    // 预处理输入字符串
    input = pretreat(input);
    // Lib字符串预处理
    const ExactNameData: StudentName[] = NameData.map(student => {
        const processedStudent: StudentName = {} as StudentName;
        for (const key in student) {
          if (typeof student[key] === 'string') {
            processedStudent[key] = pretreat(student[key]);
          } else if (Array.isArray(student[key])) {
            processedStudent[key] = student[key].map(nickname => pretreat(nickname));
          }
        }
        return processedStudent;
      });
    // 合并Lib中的重复名字
    interface NameSet {
        "Id": string;
        "FirstNames": string[];
        "Names": string[];
        "NickNames": string[]
    }
    const StudentList: NameSet[] = ExactNameData.map(names => {
        const SetStudent: NameSet = {} as NameSet; 
        // 角色id，不变
        SetStudent.Id = names.Id;
        // 合并姓氏集    
        let FirstNames = [names.FirstName_jp, names.FirstName_zh];
        const FirstNames_set = new Set(FirstNames);
        SetStudent.FirstNames = Array.from(FirstNames_set);
        // 合并名字集
        let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
        const Names_set = new Set(Names);
        SetStudent.Names = Array.from(Names_set);
        // 昵称数组不变
        SetStudent.NickNames = names.NickName;
        return SetStudent
    })
    // 按顺序进行 jaccard 相似度计算，每个属性中仅取最高值
    let results: [string, number, number, number][] = [];
    for (const student of StudentList) {
        let FirstName_result = 0;
        // 由于“子”在日文名字里出现次数过高，会严重影响匹配精度，因此当匹配双方都含有“子”时，删除它们再匹配
        for (const name of student.FirstNames) {
            const zi_input = input.indexOf("子");
            const zi_lib = name.indexOf("子");
            let input_nozi = "";
            let name_nozi = "";
            if (zi_input != -1 && zi_lib != -1 && input !== "子") {
                input_nozi = input.replace("子", '');
                name_nozi = name.replace("子", '');
            } else {
                input_nozi = input;
                name_nozi = name;
            }
            let r = JaccardSimilarity(name_nozi, input_nozi);
            if (r > FirstName_result) {
                FirstName_result = r;
            }
        }
        let Name_result = 0;
        for (const name of student.Names) {
            const zi_input = input.indexOf("子");
            const zi_lib = name.indexOf("子");
            let input_nozi = "";
            let name_nozi = "";
            if (zi_input != -1 && zi_lib != -1 && input !== "子") {
                input_nozi = input.replace("子", '');
                name_nozi = name.replace("子", '');
            } else {
                input_nozi = input;
                name_nozi = name;
            }
            let r = JaccardSimilarity(name_nozi, input_nozi);
            if (r > Name_result) {
                Name_result = r;
            }
        }
        let NickName_result = 0;
        for (const name of student.NickNames) {
            const zi_input = input.indexOf("子");
            const zi_lib = name.indexOf("子");
            let input_nozi = "";
            let name_nozi = "";
            if (zi_input != -1 && zi_lib != -1 && input !== "子") {
                input_nozi = input.replace("子", '');
                name_nozi = name.replace("子", '');
            } else {
                input_nozi = input;
                name_nozi = name;
            }
            let r = JaccardSimilarity(name_nozi, input_nozi);
            if (r > NickName_result) {
                NickName_result = r;
            }
        }
        results.push([student.Id, FirstName_result, Name_result, NickName_result])
    }
    // 在计算“含量”时，三种名字结果全部互斥，认为其中最大值代表该学生的最终结果
    let finalResults: [string, number][] = [];
    for (const result of results) {
        finalResults.push([result[0], Math.max(result[1], result[2], result[3])]);
    }
    // 排序输出非零计算结果
    let JaccardResults: [string, number][] = [];
    finalResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < finalResults.length; i++) {
        if (finalResults[i][1] != 0) {
            JaccardResults[i] = finalResults[i];
        }
    }
    return JaccardResults
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义 Jaro-Winkler 距离计算函数
function JaroWinklerDistance(str1: string, str2: string): number {
    
    // 定义 Jaro 相似度计算函数
    function jaroSimilarity(s1: string, s2: string): number {
        // 定义最大匹配距离，并限制最小为1（可修改）
        const maxDistance = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 1);
        // 初始化匹配结果数组
        const matches = new Array(Math.min(s1.length, s2.length)).fill(false);
        // 寻找相同字符并标记
        let matchCount = 0;
        for (let i = 0; i < s1.length; i++) {
            const start = Math.max(0, i - maxDistance);
            const end = Math.min(i + maxDistance + 1, s2.length);
            // 每个字符只匹配第一次，匹配到了就停
            for (let j = start; j < end; j++) {
                if (!matches[j] && s1[i] === s2[j]) {
                    matches[j] = true;
                    matchCount++;
                    break
                }
            }
        }
        // 没匹配到直接返回0
        if (matchCount === 0) {
            return 0
        }
        // 计算相似度
        // 初始化字符交换次数
        let t = 0;
        // 初始化s2字符位置指针
        let k = 0;
        for (let i = 0; i < s1.length; i++) {
            if (matches[i]) {
                // 如果匹配到的s1中的字符与s2中的字符位置不一致，将指针k移动到正确的位置
                while (!matches[k]) {
                    k++;
                }
                // 如果移动后两边字符不一致，则记一次交换
                if (s1[i] !== s2[k]) {
                    t++;
                }
                k++;
            }
        }
        return (1 / 3) * (matchCount / s1.length + matchCount / s2.length + (matchCount - t) / matchCount);
    }
  
    // Jaro 相似度评分
    const jaroSimilarityScore = jaroSimilarity(str1, str2);
  
    // 前缀权重，可调，越大就越看重前面的字符
    const prefixScale = 0.05; 
    let prefixLength = 0;
    // 最大取前3个字符，可调。取3是因为大部分学生（包括皮肤）的名字或外号都在前3个字
    for (let i = 0; i < Math.min(3, Math.min(str1.length, str2.length)); i++) {
        if (str1[i] === str2[i]) {
            prefixLength++;
        } else {
            break;
        }
    }
    return jaroSimilarityScore + prefixLength * prefixScale * (1 - jaroSimilarityScore);
}

// 定义基于 Jaro-Winkler 距离的中文字符串模糊匹配算法
function JaroWinklerFuzzyMatch(input: string): [string, number][] {
    // 预处理输入字符串
    input = pretreat(input);
    // Lib字符串预处理
    const ExactNameData: StudentName[] = NameData.map(student => {
        const processedStudent: StudentName = {} as StudentName;
        for (const key in student) {
          if (typeof student[key] === 'string') {
            processedStudent[key] = pretreat(student[key]);
          } else if (Array.isArray(student[key])) {
            processedStudent[key] = student[key].map(nickname => pretreat(nickname));
          }
        }
        return processedStudent;
      });
    // 合并Lib中的重复名字
    interface NameSet {
        "Id": string;
        "FirstNames": string[];
        "Names": string[];
        "NickNames": string[]
    }
    const StudentList: NameSet[] = ExactNameData.map(names => {
        const SetStudent: NameSet = {} as NameSet; 
        // 角色id，不变
        SetStudent.Id = names.Id;
        // 合并姓氏集    
        let FirstNames = [names.FirstName_jp, names.FirstName_zh];
        const FirstNames_set = new Set(FirstNames);
        SetStudent.FirstNames = Array.from(FirstNames_set);
        // 合并名字集
        let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
        const Names_set = new Set(Names);
        SetStudent.Names = Array.from(Names_set);
        // 昵称数组不变
        SetStudent.NickNames = names.NickName;
        return SetStudent
    })  
    // 按顺序进行 Jaro-Winkler 距离计算，每个属性中仅取最高值
    let results: [string, number, number, number][] = [];
    for (const student of StudentList) {
        let FirstName_result = 0;
        // 由于“子”在日文名字里出现次数过高，会严重影响匹配精度，因此当匹配双方都含有“子”时，删除它们再匹配
        for (const name of student.FirstNames) {
            const zi_input = input.indexOf("子");
            const zi_lib = name.indexOf("子");
            let input_nozi = "";
            let name_nozi = "";
            if (zi_input != -1 && zi_lib != -1 && input !== "子") {
                input_nozi = input.replace("子", '');
                name_nozi = name.replace("子", '');
            } else {
                input_nozi = input;
                name_nozi = name;
            }
            let r = JaroWinklerDistance(name_nozi, input_nozi);
            if (r > FirstName_result) {
                FirstName_result = r;
            }
        }
        let Name_result = 0;
        for (const name of student.Names) {
            const zi_input = input.indexOf("子");
            const zi_lib = name.indexOf("子");
            let input_nozi = "";
            let name_nozi = "";
            if (zi_input != -1 && zi_lib != -1 && input !== "子") {
                input_nozi = input.replace("子", '');
                name_nozi = name.replace("子", '');
            } else {
                input_nozi = input;
                name_nozi = name;
            }
            let r = JaroWinklerDistance(name_nozi, input_nozi);
            if (r > Name_result) {
                Name_result = r;
            }
        }
        let NickName_result = 0;
        for (const name of student.NickNames) {
            const zi_input = input.indexOf("子");
            const zi_lib = name.indexOf("子");
            let input_nozi = "";
            let name_nozi = "";
            if (zi_input != -1 && zi_lib != -1 && input !== "子") {
                input_nozi = input.replace("子", '');
                name_nozi = name.replace("子", '');
            } else {
                input_nozi = input;
                name_nozi = name;
            }
            let r = JaroWinklerDistance(name_nozi, input_nozi);
            if (r > NickName_result) {
                NickName_result = r;
            }
        }
        results.push([student.Id, FirstName_result, Name_result, NickName_result])
    }
    // 统计三种名字的前五名计算结果
    let FirstNameResults: [string, number][] = new Array(5); 
    let NameResults: [string, number][] = new Array(5); 
    let NickNameResults: [string, number][] = new Array(5); 
    let possibleFirstNameResults: [string, number][] = [];
    let possibleNameResults: [string, number][] = [];
    let possibleNickNameResults: [string, number][] = [];
    for (const result of results) {
        possibleFirstNameResults.push([result[0], result[1]]);
        possibleNameResults.push([result[0], result[2]]);
        possibleNickNameResults.push([result[0], result[3]]);   
    }
    possibleFirstNameResults.sort((a, b) => b[1] - a[1]);
    possibleNameResults.sort((a, b) => b[1] - a[1]);
    possibleNickNameResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < 5; i++) {
        // 对于没匹配到5个结果的数组，用Id"0"来补位
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
    // 姓、名互斥且同权，与昵称平权
    // 删除补位元素
    const filteredFirstNameResults = FirstNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNameResults = NameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNickNameResults = NickNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    // 合并姓、名数组，并判断是否有重复Id，若存在，则认为该学生匹配的准确度增加
    const combinedResults_FN = [...filteredFirstNameResults, ...filteredNameResults];
    let finalResults_FN: [string, number][] = [];
    // 定义数组合并加权函数
    function processArray(arr: [string, number][]): [string, number][] {
        let processedArray: [string, number][] = [];
        for (const [str, num] of arr) {
            let mark = false;
            for (let i = 0; i < processedArray.length; i++) {
                if (str === processedArray[i][0]) {
                    processedArray[i][1] = Math.max((num+processedArray[i][1])/2+0.1, num, processedArray[i][1]);
                    mark = true;
                }
            }
            if (!mark) {
                processedArray.push([str, num]);
            }
        }
        return processedArray
    }
    finalResults_FN = processArray(combinedResults_FN)
    finalResults_FN.sort((a, b) => b[1] - a[1]);
    // 在姓名数组和昵称数组之间进行平权计算，若两边都有，则匹配准确度增加
    let possibleResults: [string, number][] = [];
    const combinedResults_NN = [...finalResults_FN, ...filteredNickNameResults];
    possibleResults = processArray(combinedResults_NN);
    possibleResults.sort((a, b) => b[1] - a[1]);
    // 排序输出大于0.2的计算结果
    let JaroWinklerDistanceResults: [string, number][] = [];
    possibleResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < possibleResults.length; i++) {
        if (possibleResults[i][1] >= 0.2) {
            JaroWinklerDistanceResults[i] = possibleResults[i];
        }
    }
    return JaroWinklerDistanceResults
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义中文转拼音函数，需zh_cn依赖
function TransToPinyin(input: string): string {
    // 使用 zh-cn 库将中文字符串转换为带声调的拼音
    const zh = require("zh_cn");
    const pinyinArray = zh(input, {style: zh.STYLE_TONE});
    // 将拼音数组转换为字符串，用空格分字
    const pinyinString = pinyinArray.map((item) => item).join(' ');
    return pinyinString;
}
  
// 定义 Levenshtein 距离计算函数
function LevenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    // 创建一个二维数组来存储距离
    const dp: number[][] = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      for (let j = 0; j <= n; j++) {
        dp[i][j] = 0;
      }
    }
    // 初始化第一行和第一列
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    // 计算 Levenshtein 距离
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 插入
          dp[i][j - 1] + 1,    // 删除
          dp[i - 1][j - 1] + cost // 替换
        );
      }
    }
    return dp[m][n];
}

// 定义 Levenshtein 相似度评分函数
function LevenshteinSimilarityScore(s1: string, s2: string): number {
    const distance = LevenshteinDistance(s1, s2);
    // 获取字符串长度的较大值
    const maxLength = Math.max(s1.length, s2.length);
    // 计算相似度得分
     const similarityScore = 1 - distance / maxLength;
    return similarityScore;
}
  
// 定义基于 Levenshtein 距离的拼音字符串模糊匹配算法
function LevenshteinFuzzyMatch(input: string): [string, number][] {
    // 预处理输入中文字符串，并转换成拼音字符串，其他文字无法进行转换
    input = TransToPinyin(pretreat(input));
    // 预处理Lib中文字符串，并转换成拼音字符串，其中日文汉字也按中文被识别，其他文字无法进行转换
    const ExactNameData: StudentName[] = NameData.map(student => {
        const processedStudent: StudentName = {} as StudentName;
        for (const key in student) {
          if (typeof student[key] === 'string') {
            processedStudent[key] = TransToPinyin(pretreat(student[key]));
          } else if (Array.isArray(student[key])) {
            processedStudent[key] = student[key].map(nickname => TransToPinyin(pretreat(nickname)));
          }
        }
        return processedStudent;
    });
    // 合并Lib中的重复名字
    interface NameSet {
        "Id": string;
        "FirstNames": string[];
        "Names": string[];
        "NickNames": string[]
    }
    const StudentList: NameSet[] = ExactNameData.map(names => {
        const SetStudent: NameSet = {} as NameSet; 
        // 角色id，不变
        SetStudent.Id = names.Id;
        // 合并姓氏集    
        let FirstNames = [names.FirstName_jp, names.FirstName_zh];
        const FirstNames_set = new Set(FirstNames);
        SetStudent.FirstNames = Array.from(FirstNames_set);
        // 合并名字集
        let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
        const Names_set = new Set(Names);
        SetStudent.Names = Array.from(Names_set);
        // 昵称数组不变
        SetStudent.NickNames = names.NickName;
        return SetStudent
    })
    // 按顺序进行 Levenshtein 相似度评分
    let results: [string, number, number, number][] = [];
    for (const student of StudentList) {
        let FirstName_result = 0;
        for (const name of student.FirstNames) {
            let r = LevenshteinSimilarityScore(name, input);
            if (r > FirstName_result) {
                FirstName_result = r;
            }
        }
        let Name_result = 0;
        for (const name of student.Names) {
            let r = LevenshteinSimilarityScore(name, input);
            if (r > Name_result) {
                Name_result = r;
            }
        }
        let NickName_result = 0;
        for (const name of student.NickNames) {
            let r = LevenshteinSimilarityScore(name, input);
            if (r > NickName_result) {
                NickName_result = r;
            }
        }
        results.push([student.Id, FirstName_result, Name_result, NickName_result])
    }
    // 统计三种名字的前五名计算结果
    let FirstNameResults: [string, number][] = new Array(5); 
    let NameResults: [string, number][] = new Array(5); 
    let NickNameResults: [string, number][] = new Array(5); 
    let possibleFirstNameResults: [string, number][] = [];
    let possibleNameResults: [string, number][] = [];
    let possibleNickNameResults: [string, number][] = [];
    for (const result of results) {
        possibleFirstNameResults.push([result[0], result[1]]);
        possibleNameResults.push([result[0], result[2]]);
        possibleNickNameResults.push([result[0], result[3]]);   
    }
    possibleFirstNameResults.sort((a, b) => b[1] - a[1]);
    possibleNameResults.sort((a, b) => b[1] - a[1]);
    possibleNickNameResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < 5; i++) {
        // 对于没匹配到5个结果的数组，用Id"0"来补位
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
    // 姓、名互斥且同权，与昵称平权
    // 删除补位元素
    const filteredFirstNameResults = FirstNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNameResults = NameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNickNameResults = NickNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    // 合并姓、名数组，并判断是否有重复Id，若存在，则取较大的一侧
    const combinedResults_FN = [...filteredFirstNameResults, ...filteredNameResults];
    let finalResults_FN: [string, number][] = [];
    // 定义数组合并加权函数
    function processArray(arr: [string, number][]): [string, number][] {
        let processedArray: [string, number][] = [];
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
        return processedArray
    }
    finalResults_FN = processArray(combinedResults_FN)
    finalResults_FN.sort((a, b) => b[1] - a[1]);
    // 在姓名数组和昵称数组之间进行平权计算，若两边都有，则取较大的一侧
    let possibleResults: [string, number][] = [];
    const combinedResults_NN = [...finalResults_FN, ...filteredNickNameResults];
    possibleResults = processArray(combinedResults_NN);
    possibleResults.sort((a, b) => b[1] - a[1]);
    // 排序输出大于0.500的计算结果
    let LevenshteinDistanceResults: [string, number][] = [];
    possibleResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < possibleResults.length; i++) {
        if (possibleResults[i][1] >= 0.500) {
            LevenshteinDistanceResults[i] = possibleResults[i];
        }
    }
    return LevenshteinDistanceResults
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义模糊匹配算法
function FuzzyMatchName(input: string): [string, number][] {
    // 子算法内包含输入字符串预处理功能，直接调用
    // J算法标志着输入字符的“含量”，评价结果最大值为1（有一项完全一致）
    const MatchResult_J = JaccardFuzzyMatch(input);
    // JW算法标志着输入字符串的“准确度”与前部分的“顺序度”，评价结果最大值为1.1（名字或姓氏其中之一完全一致，且与昵称完全一致）
    const MatchResult_JW = JaroWinklerFuzzyMatch(input);
    // L算法标志着输入拼音与标准的“相似度”，评价结果最大值为1（有一项完全一致）
    const MatchResult_L = LevenshteinFuzzyMatch(input);
    // 对JW评价结果归一化，并使用J算法评价结果修正JW算法评价结果
    let JWresult: [string, number][] = [];
    let J_JW: [string, number][] = [];
    for (let i = 0; i < MatchResult_JW.length; i++) {
        MatchResult_JW[i][1] /= 1.1;
        // 按JW元素顺序抓取J中与JW对应的计算结果
        for (let j = 0; j < MatchResult_J.length; j++) {
            if (MatchResult_J[j][0] === MatchResult_JW[i][0]) {
                J_JW.push(MatchResult_J[j]);
            }
        }
    }
    // 防错误检验
    if (MatchResult_JW.length != J_JW.length) {
        return []
    }
    // 按JW：J=5.5:4.5的权重比修正JW结果
    for (let i = 0; i < MatchResult_JW.length; i++) {
        if (J_JW[i]) {
            JWresult.push([J_JW[i][0], MatchResult_JW[i][1] * 0.55 + J_JW[i][1] * 0.45]);
        }
    }
    JWresult.sort((a, b) => b[1] - a[1]);
    // 合并修正后的JW数组与L数组，并判断是否有重复Id，若存在，则认为该学生匹配的准确度大幅度增加
    const combinedResults = [...JWresult, ...MatchResult_L];
    let finalResults: [string, number][] = [];
    // 定义数组处理函数
    function processArray(arr: [string, number][]): [string, number][] {
        let processedArray: [string, number][] = [];
        // 设定确信标准，JW匹配为0.454，L匹配为0.500，高于此标准的匹配结果全部被保留
        // 对于二者都匹配到的结果，无论是否低于置信标准均保留，结果做加权平均后额外奖励0.15
        let nopush: string[] = [];
        for (let i = 0; i < arr.length - 1; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i][0] === arr[j][0]) {
                    nopush.push(arr[i][0]);
                    processedArray.push([arr[i][0], arr[i][1] * 0.5 + arr[j][1] * 0.5 + 0.15]);
                    break
                }
            }
            if (nopush.indexOf(arr[i][0]) === -1) {
                if (JWresult.indexOf(arr[i]) !== -1) {
                    if (arr[i][1] >= 0.454) {
                        processedArray.push(arr[i]);
                    } 
                } else {
                    if (arr[i][1] >= 0.500) {
                        processedArray.push(arr[i]);
                    }
                }
            }
        }
        return processedArray
    }
    // 计算输出最后结果
    finalResults = processArray(combinedResults)
    finalResults.sort((a, b) => b[1] - a[1]);
    return finalResults
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// 定义全局匹配算法（不输出模糊结果评价值，最多5个结果）
export function MatchStudentName(input: string): string[] {
    // 先精准后模糊
    const ExactResults = ExactMatchName(input);
    if (ExactResults.length != 0) {
        if (ExactResults.length > 5) {
            let ExactResults5: string[] = [];
            for (let i = 0; i < 5; i++) {
                ExactResults5.push(ExactResults[i]);
            }
            return ExactResults5
        } else {
            return ExactResults
        }
    } else {
        const FuzzyResults = FuzzyMatchName(input);
        let FuzzyResults_nonum: string[] = [];
        for (const result of FuzzyResults) {
            FuzzyResults_nonum.push(result[0]);
        }
        if (FuzzyResults_nonum.length != 0) {
            if (FuzzyResults_nonum.length > 5) {
                let FuzzyResults_nonum5: string[] = [];
                for (let i = 0; i < 5; i++) {
                    FuzzyResults_nonum5.push(FuzzyResults_nonum[i]);
                }
                return FuzzyResults_nonum5
            } else {
                return FuzzyResults_nonum
            }
        } else {
            return []
        }
    }
}

// ————————————————————————————————————————————————————————————————————————————————————————————————————

// // 测试区

// const input1 = "亞瑠";
// const input2 = "하루나";
// const input3 = "ヒナ";
// const input4 = "小涂";
// const input5 = "老八";
// const input6 = "Tsurugi   (swimsuit)";
// const input7 = "小不点女仆";
// const input8 = "春原";
// const input9 = "123";
// const input10 = "泳装梓";
// const input11 = "瞬之妹";
// const inputs = [input1, input2, input3, input4, input5, input6, input7, input8, input9, input10, input11];

// const q = "奶"
// const r = JaroWinklerFuzzyMatch(q)
// console.log(`“${q}”的JW匹配结果为:`)
// for (let i of r) {
//     if (i[0] != "0") {
//         console.log(`${i[0]}号角色名为${NameData[parseInt(i[0])-10000].Name_zh_ft}，JW匹配度为${i[1]}`)
//     }
// }
// const y = JaccardFuzzyMatch(q)
// console.log(`“${q}”的J匹配结果为:`)
// for (let i of y) {
//     if (i[0] != "0") {
//         console.log(`${i[0]}号角色名为${NameData[parseInt(i[0])-10000].Name_zh_ft}，J匹配度为${i[1]}`)
//     }
// }
// const t = LevenshteinFuzzyMatch(q)
// console.log(`“${q}”的L匹配结果为:`)
// for (let i of t) {
//     if (i[0] != "0") {
//         console.log(`${i[0]}号角色名为${NameData[parseInt(i[0])-10000].Name_zh_ft}，L匹配度为${i[1]}`)
//     }
// }
// const all = FuzzyMatchName(q)
// console.log(`“${q}”的模糊匹配结果为:`)
// for (let i of all) {
//     if (i[0] != "0") {
//         console.log(`${i[0]}号角色名为${NameData[parseInt(i[0])-10000].Name_zh_ft}，匹配度为${i[1]}`)
//     }
// }





















































