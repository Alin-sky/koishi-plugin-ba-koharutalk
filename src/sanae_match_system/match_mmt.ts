// 定义各种学生名字的接口
interface StudentName {
    "Id": string;
    "Id_db":number,
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

const NameData: StudentName[] = require("./MatchLib.json") as StudentName[];

function DeleteSpace(input: string): string {
    return input.replace(/\s+/g, '')
}

function TransToSmall(input: string): string {
    return input.replace(/[A-Za-z]+/g, match => match.toLowerCase())
}

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

function pretreat(input: string): string {
    input = DeleteSpace(input);
    input = TransToHalf(input);
    input = TransToSmall(input);
    return input
}


function ExactMatchName(input: string): string[] {
    let result: string[] = [];
    input = pretreat(input)
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
    const result_set = new Set(result);
    return Array.from(result_set)
}

function JaccardSimilarity(str1: string, str2: string): number {
    const arr1 = str1.split('');
    const arr2 = str2.split('');
    const intersectionSize = arr1.filter(item => arr2.includes(item)).length;
    const unionSize = arr1.length + arr2.length - intersectionSize;
    const similarity = intersectionSize / unionSize;
    return similarity;
}
  

function JaccardFuzzyMatch(input: string): [string, number][] {

    input = pretreat(input);

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

    interface NameSet {
        "Id": string;
        "FirstNames": string[];
        "Names": string[];
        "NickNames": string[]
    }
    const StudentList: NameSet[] = ExactNameData.map(names => {
        const SetStudent: NameSet = {} as NameSet; 
        SetStudent.Id = names.Id;
        let FirstNames = [names.FirstName_jp, names.FirstName_zh];
        const FirstNames_set = new Set(FirstNames);
        SetStudent.FirstNames = Array.from(FirstNames_set);
        let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
        const Names_set = new Set(Names);
        SetStudent.Names = Array.from(Names_set);
        SetStudent.NickNames = names.NickName;
        return SetStudent
    })
    let results: [string, number, number, number][] = [];
    for (const student of StudentList) {
        let FirstName_result = 0;
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

    let finalResults: [string, number][] = [];
    for (const result of results) {
        finalResults.push([result[0], Math.max(result[1], result[2], result[3])]);
    }

    let JaccardResults: [string, number][] = [];
    finalResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < finalResults.length; i++) {
        if (finalResults[i][1] != 0) {
            JaccardResults[i] = finalResults[i];
        }
    }
    return JaccardResults
}

function JaroWinklerDistance(str1: string, str2: string): number {
    
    function jaroSimilarity(s1: string, s2: string): number {
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
                    break
                }
            }
        }
        if (matchCount === 0) {
            return 0
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
        return (1 / 3) * (matchCount / s1.length + matchCount / s2.length + (matchCount - t) / matchCount);
    }

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

function JaroWinklerFuzzyMatch(input: string): [string, number][] {
    input = pretreat(input);
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
    interface NameSet {
        "Id": string;
        "FirstNames": string[];
        "Names": string[];
        "NickNames": string[]
    }
    const StudentList: NameSet[] = ExactNameData.map(names => {
        const SetStudent: NameSet = {} as NameSet; 
        SetStudent.Id = names.Id;    
        let FirstNames = [names.FirstName_jp, names.FirstName_zh];
        const FirstNames_set = new Set(FirstNames);
        SetStudent.FirstNames = Array.from(FirstNames_set);
        let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
        const Names_set = new Set(Names);
        SetStudent.Names = Array.from(Names_set);
        SetStudent.NickNames = names.NickName;
        return SetStudent
    })  
    let results: [string, number, number, number][] = [];
    for (const student of StudentList) {
        let FirstName_result = 0;
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
    const filteredFirstNameResults = FirstNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNameResults = NameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNickNameResults = NickNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const combinedResults_FN = [...filteredFirstNameResults, ...filteredNameResults];
    let finalResults_FN: [string, number][] = [];
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
    let possibleResults: [string, number][] = [];
    const combinedResults_NN = [...finalResults_FN, ...filteredNickNameResults];
    possibleResults = processArray(combinedResults_NN);
    possibleResults.sort((a, b) => b[1] - a[1]);
    let JaroWinklerDistanceResults: [string, number][] = [];
    possibleResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < possibleResults.length; i++) {
        if (possibleResults[i][1] >= 0.2) {
            JaroWinklerDistanceResults[i] = possibleResults[i];
        }
    }
    return JaroWinklerDistanceResults
}

function TransToPinyin(input: string): string {
    const zh = require("zh_cn");
    const pinyinArray = zh(input, {style: zh.STYLE_TONE});
    const pinyinString = pinyinArray.map((item) => item).join(' ');
    return pinyinString;
}
  
function LevenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = [];
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
function LevenshteinSimilarityScore(s1: string, s2: string): number {
    const distance = LevenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
     const similarityScore = 1 - distance / maxLength;
    return similarityScore;
}
function LevenshteinFuzzyMatch(input: string): [string, number][] {
    input = TransToPinyin(pretreat(input));
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
    interface NameSet {
        "Id": string;
        "FirstNames": string[];
        "Names": string[];
        "NickNames": string[]
    }
    const StudentList: NameSet[] = ExactNameData.map(names => {
        const SetStudent: NameSet = {} as NameSet; 
        SetStudent.Id = names.Id;
        let FirstNames = [names.FirstName_jp, names.FirstName_zh];
        const FirstNames_set = new Set(FirstNames);
        SetStudent.FirstNames = Array.from(FirstNames_set);
        let Names = [names.Name_en, names.Name_jp, names.Name_kr, names.Name_zh_cn, names.Name_zh_ft, names.Name_zh_tw];
        const Names_set = new Set(Names);
        SetStudent.Names = Array.from(Names_set);
        SetStudent.NickNames = names.NickName;
        return SetStudent
    })
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
    const filteredFirstNameResults = FirstNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNameResults = NameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const filteredNickNameResults = NickNameResults.filter(item => !(item[0] === "0" && item[1] === 0));
    const combinedResults_FN = [...filteredFirstNameResults, ...filteredNameResults];
    let finalResults_FN: [string, number][] = [];
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
    let possibleResults: [string, number][] = [];
    const combinedResults_NN = [...finalResults_FN, ...filteredNickNameResults];
    possibleResults = processArray(combinedResults_NN);
    possibleResults.sort((a, b) => b[1] - a[1]);
    let LevenshteinDistanceResults: [string, number][] = [];
    possibleResults.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < possibleResults.length; i++) {
        if (possibleResults[i][1] >= 0.500) {
            LevenshteinDistanceResults[i] = possibleResults[i];
        }
    }
    return LevenshteinDistanceResults
}
function FuzzyMatchName(input: string): [string, number][] {
    const MatchResult_J = JaccardFuzzyMatch(input);
    const MatchResult_JW = JaroWinklerFuzzyMatch(input);
    const MatchResult_L = LevenshteinFuzzyMatch(input);
    let JWresult: [string, number][] = [];
    let J_JW: [string, number][] = [];
    for (let i = 0; i < MatchResult_JW.length; i++) {
        MatchResult_JW[i][1] /= 1.1;
        for (let j = 0; j < MatchResult_J.length; j++) {
            if (MatchResult_J[j][0] === MatchResult_JW[i][0]) {
                J_JW.push(MatchResult_J[j]);
            }
        }
    }
    if (MatchResult_JW.length != J_JW.length) {
        return []
    }
    for (let i = 0; i < MatchResult_JW.length; i++) {
        if (J_JW[i]) {
            JWresult.push([J_JW[i][0], MatchResult_JW[i][1] * 0.55 + J_JW[i][1] * 0.45]);
        }
    }
    JWresult.sort((a, b) => b[1] - a[1]);

    const combinedResults = [...JWresult, ...MatchResult_L];
    let finalResults: [string, number][] = [];

    function processArray(arr: [string, number][]): [string, number][] {
        let processedArray: [string, number][] = [];

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
    finalResults = processArray(combinedResults)
    finalResults.sort((a, b) => b[1] - a[1]);
    return finalResults
}
export function MatchStudentName(input: string): string[] {
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




















































