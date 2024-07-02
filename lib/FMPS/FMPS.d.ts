import { Context } from "koishi";
export declare class FMPS {
    private ctx;
    constructor(ctx: Context);
    /**
     * json解析函数
     * @param path json文件的路径
     * @returns 解析后的JSON对象或在出错时返回null
     */
    json_parse(path: string): Promise<any | null>;
    /**
     * json文件创建函数
     * @param path 生成文件存放的路径
     * @param fname 文件名
     * @param json 传入的内容
     * @returns 返回文件路径
     */
    json_create(dirPath: string, fname: string, json: any): Promise<string>;
    /**
     * 文件下载函数
     * @param url 传入下载的链接
     * @param dirPath 完整的文件存放的路径
     * @param fname 带拓展名的文件名
     */
    file_download(url: string, dirPath: string, fname: string): Promise<void>;
    /**
     * 文件删除函数
     * @param dirPath 文件夹路径
     * @param file 文件名称，缺省时将删除文件夹内全部内容
     */
    file_delete(dirPath: string, file?: string): Promise<void>;
    /**
     * 图片保存函数
     * @param dirPath 完整的文件存放的路径
     * @param fname 带拓展名的文件名
     * @param b64 图片的 Base64 编码字符串，包括前缀
     */
    img_save(dirPath: string, fname: string, b64: string): Promise<void>;
}
