"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FMPS = void 0;
const koishi_1 = require("koishi");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
//ba-koharu-talk-FMPS-V1
//Alin's File Management and Processing Systems v1.0-beta 2024-04-05 
//koishi api versions 
const schale_db_url = 'https://schale.gg/data/';
const log1 = "khrtalk-FMPS";
const logger = new koishi_1.Logger(log1);
class FMPS {
    ctx;
    constructor(ctx) {
        this.ctx = ctx; // ctx
    }
    /**
     * json解析函数
     * @param path json文件的路径
     * @returns 解析后的JSON对象或在出错时返回null
     */
    async json_parse(path) {
        const attempts = 3;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                const data = await fs.promises.readFile(path, { encoding: 'utf-8' });
                return JSON.parse(data);
            }
            catch (error) {
                logger.info(`尝试读取${path}失败，尝试次数：${attempt}`);
                if (attempt === attempts) {
                    logger.info(`尝试${attempt}次后依旧报错，停止尝试`);
                    return null; // 达到最大尝试次数，返回null
                }
                await new Promise(resolve => setTimeout(resolve, 500)); // 等待0.5s再次尝试
            }
        }
        return null; // 理论上不会执行到这里，但为了类型安全添加
    }
    /**
     * json文件创建函数
     * @param path 生成文件存放的路径
     * @param fname 文件名
     * @param json 传入的内容
     * @returns 返回文件路径
     */
    async json_create(dirPath, fname, json) {
        // 确保文件名以 .json 结尾
        if (!fname.endsWith('.json')) {
            fname += '.json';
        }
        // 构造完整的文件路径
        const filePath = path.join(dirPath, fname);
        // 将 JSON 对象转换为字符串
        const data = JSON.stringify(json, null, 2);
        // 异步写入文件
        await fs.promises.writeFile(filePath, data, 'utf8');
        // 返回文件路径
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
                const response = await this.ctx.http.get(url, { responseType: 'arraybuffer' }); // 使用axios配置
                const buffer = Buffer.from(response); // response.data已经是ArrayBuffer
                const fullPath = path.join(dirPath, fname);
                // 确保目录存在
                await fs.promises.mkdir(dirPath, { recursive: true });
                // 将Buffer写入文件
                await fs.promises.writeFile(fullPath, buffer);
                //logger.info("文件下载成功");
                break; // 成功后退出循环
            }
            catch (error) {
                const status = error.response ? error.response.status : '无法获取';
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
        const fs = require('fs').promises;
        if (file) {
            const filePath = path.join(dirPath, file);
            try {
                await fs.unlink(filePath);
                logger.info(`文件 ${filePath} 已被删除`);
            }
            catch (error) {
                logger.info(`删除文件时出错: ${error}`);
            }
        }
        else {
            try {
                await fs.rmdir(dirPath, { recursive: true });
                logger.info(`目录 ${dirPath} 及其内容已被删除`);
            }
            catch (error) {
                logger.info(`删除目录时出错: ${error}`);
            }
        }
    }
}
exports.FMPS = FMPS;
