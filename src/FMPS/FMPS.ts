import { Context, Logger, } from "koishi";
import * as path from 'path';
import * as fs from 'fs'



//ba-koharu-talk-FMPS-V1
//Alin's File Management and Processing Systems v1.0-beta 2024-04-05 
//koishi api versions 

const schale_db_url = 'https://schale.gg/data/'
const log1 = "khrtalk-FMPS"
const logger: Logger = new Logger(log1)


export class FMPS {
    private ctx: Context;
    constructor(ctx: Context) {
        this.ctx = ctx; // ctx
    }

    /**
     * json解析函数
     * @param path json文件的路径
     * @returns 解析后的JSON对象或在出错时返回null
     */
    async json_parse(path: string): Promise<any | null> {
        const attempts: number = 3
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                const data = await fs.promises.readFile(path, { encoding: 'utf-8' });
                return JSON.parse(data);
            } catch (error) {
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
    async json_create(dirPath: string, fname: string, json: any): Promise<string> {
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
    async file_download(url: string, dirPath: string, fname: string): Promise<void> {
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
            } catch (error) {
                const status = error.response ? error.response.status : '无法获取';
                logger.info(`文件下载出现错误，进行第${i}次尝试: 
                Error: HTTP error! status: ${status}
                url:${url}
                `);
                if (i === 3) {
                    logger.info(`${i}次尝试后依旧出错😭`);
                    return error
                }
            }
        }
    }



    /**
     * 文件删除函数
     * @param dirPath 文件夹路径
     * @param file 文件名称，缺省时将删除文件夹内全部内容
     */
    async file_delete(dirPath: string, file?: string): Promise<void> {
        const fs = require('fs').promises;
        if (file) {
            const filePath = path.join(dirPath, file);
            try {
                await fs.unlink(filePath);
                logger.info(`文件 ${filePath} 已被删除`);
            } catch (error) {
                logger.info(`删除文件时出错: ${error}`);
            }
        } else {
            try {
                await fs.rmdir(dirPath, { recursive: true });
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
    async img_save(dirPath: string, fname: string, b64: string): Promise<void> {
        try {
            // 移除 Base64 前缀
            const base64Data = b64.split(';base64,').pop();
            if (!base64Data) {
                throw new Error('Invalid Base64 data');
            }
            // 解码 Base64 字符串
            const buffer = Buffer.from(base64Data, 'base64');
            const fullPath = path.join(dirPath, fname);
            // 确保目录存在
            await fs.promises.mkdir(dirPath, { recursive: true });
            // 将Buffer写入文件
            await fs.promises.writeFile(fullPath, buffer);
        } catch (error) {
            console.error(`保存图片时出错: ${error.message}`);
        }
    }



}
