import { Context, Schema, Logger, Random, h, } from 'koishi'
import * as fs from 'fs/promises'
import * as path from 'path'
import { MatchStudentName } from './sanae_match_system/match_mmt';
import { } from '@koishijs/canvas';
import { readdir, stat, unlink } from 'fs/promises';
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import { rootF } from './FMPS/FMPS_F';
import { FMPS } from './FMPS/FMPS';


export const inject = { required: ['canvas'] }
export const using = ['canvas']
export const name = 'ba-koharu-talk'
export const usage = `
## koishi-plugin-ba-koharu-talk
### 已基于koishi-canvas重构
可能还有不少bug,可去github反馈\n
\n
`
export interface Config {
    font: string
    resolution: 0.25 | 0.5 | 1;
    returns: string
    process: {
        id?: string
        APIKey?: string
        SKey?: string
    }
}
export const Config: Schema<Config> = Schema.object({
    font: Schema.string().default('YouYuan').description('字体设置（beta）'),
    resolution: Schema.union([
        Schema.const(0.25).description('x 0.25'),
        Schema.const(0.5).description('x 0.5'),
        Schema.const(1).description('x 1'),
    ]).role('radio').required().description('分辨率设置'),
    returns: Schema.string().default('输入内容可能有问题(◎﹏◎)').description('不合规的回复内容'),
    process: Schema.object({
        id: Schema.string().description('APP ID'),
        APIKey: Schema.string().description('API Key'),
        SKey: Schema.string().description('Secret Key')
    }).description('百度审核(缺省则不启用)'),
})

export async function apply(ctx: Context, config: Config) {
    //字体读取
    const fonts = config.font
    //分辨率倍率
    const A = (config.resolution)

    const baiduapi = 'https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined'
    const baidu_token_url = 'https://aip.baidubce.com/oauth/2.0/token'
    const cos1 = 'https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/'

    const id = config.process.id
    const apikey = config.resolution
    const skey = config.process.SKey

    const color_di = '#FFEFF4'//全局背景色
    const log1 = "koharu-talk"
    const logger: Logger = new Logger(log1)
    const fmp = new FMPS(ctx)
    const root = rootF("mmt_img")


    var token = ''

    //审核配置
    async function tokens() {
        const grant = 'grant_type=client_credentials'
        const tokenurl = `${baidu_token_url}?${grant}&client_id=${apikey}&client_secret=${skey}`
        try {
            const out1 = await ctx.http.get(tokenurl)
            console.log(out1.access_token)
            token = out1.access_token
            return token
        } catch (error) {
            logger.info(error)
            return false
        }

    }

    if (apikey == null || skey == null || id == null) {
        logger.info('⛔ 审核配置填写不完整，已停用')
    } else {
        if (await tokens() == false) {
            logger.info('⛔ 审核配置填写可能有误，已停用')
        }
    }

    async function process_baidu(text: string): Promise<string> {
        const params = {
            text: text
        };
        const accessToken = token
        const urls = `${baiduapi}?access_token=${accessToken}`;
        const configs = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        const post = await ctx.http.post(urls, params, configs)
            .catch(error => {
                logger.info('请求失败:', error);
            });
        if (post.conclusion == '不合规') {
            logger.info('内容不合规')
            logger.info(post)
        }
        return post.conclusion
    }

    async function init_download() {
        logger.info('⬇️ 开始下载插件必须资源，请稍等哦（*＾-＾*）')
        try {
            const stu_data = await fmp.json_parse(`${root}/sms_studata_toaro_stu.json`)
            const stulen = stu_data.length
            for (let i = 0; i < stulen; i++) {
                await fmp.file_download(`${cos1}stu_icon_db_png/${stu_data[i].Id_db}.png`, await root, stu_data[i].Id_db + '.png')
                const num = Math.round((i / stulen) * 100)
                if (num == 25 || num == 50 || num == 75 || num == 95) {
                    logger.info('头像下载进度' + num + '%')
                }
            }
            logger.info('✔️khr-talk资源文件下载完毕')
        } catch (e) {
            logger.error('出现错误' + e)
            return
        }
    }

    async function create_background(hi: number) {
        const wi = 2600 * A
        const canvas = await ctx.canvas.createCanvas(wi, hi)
        const back = canvas.getContext('2d')
        back.fillStyle = color_di
        back.fillRect(0, 0, wi, hi)
        return canvas
    }

    async function create_favor_img(name: string) {
        const wid = 2200 * A
        const hei = 510 * A
        const font_size = 130 * A
        const favorimg = await ctx.canvas.loadImage(`${root}/favor_img.png`)
        const favor = await ctx.canvas.createCanvas(wid, hei)
        const cre = favor.getContext('2d')
        cre.drawImage(favorimg, 0, 0, wid, hei)
        cre.textAlign = 'center'
        cre.font = `bold ${font_size}px ${fonts}`;
        cre.fillStyle = color_di
        cre.fillText(`前往${name}的羁绊剧情`, wid / 2, 412 * A)
        return favor
    }

    //头像创建函数
    async function create_Avatar_creation(url: string, stu_name: string) {
        const avatar_hi = 500 * A
        const avatar_wi = 2600 * A
        const fontsize = 160 * A
        //使用loadImage()加载图像
        const img_data = await ctx.canvas.loadImage(url)
        //先创建个常量，使用createCanvan确定画布大小
        const canvas = await ctx.canvas.createCanvas(avatar_wi, avatar_hi)
        //再创建个常量，使用getContext('2d')，转成2d？
        const ctx_a = canvas.getContext('2d')
        //然后可以在这个常量的基础上使用api
        ctx_a.fillStyle = color_di;
        ctx_a.fillRect(0, 0, avatar_wi, avatar_hi);
        ctx_a.save();
        // 创建一个圆形的路径
        ctx_a.beginPath();
        ctx_a.arc(250 * A, 250 * A, 240 * A, 0, Math.PI * 2);
        // 创建剪切区域
        ctx_a.clip();
        // 在圆形区域内绘制图片
        ctx_a.drawImage(img_data, 0, 0, 500 * A, 560 * A)
        ctx_a.restore();
        ctx_a.fillStyle = '#000000'
        ctx_a.font = `bold ${fontsize}px ${fonts}`
        ctx_a.fillText(stu_name, 540 * A, 200 * A)
        return canvas
    }



    //对话框创建函数
    var N: number = 0
    var wid_dialog: number = 0
    async function create_dialog_box(text: string, color: string, random: number) {
        N = 0
        wid_dialog = 0
        // 字体大小
        const fontSize = 150 * A;
        // 行高
        const lineHeight = 200 * A;
        // 每行最大字符数
        const maxLineLength = 30;
        // 基底高度
        let baseHeight = 80 * A;
        // 基底宽度
        let baseWidth = 300 * A;
        // 弧度
        let rad = 60 * A;
        // 切割文本为多行
        //内置文本切割函数
        function splitText(text, maxLineWidth) {
            let lines = [];
            let currentLine = '';
            let currentLineWidth = 0;
            for (let char of text) {
                // 判断字符是全角还是半角
                let charWidth = /[\u0391-\uFFE5]/.test(char) ? 2 : 1;
                if (currentLineWidth + charWidth > maxLineWidth) {
                    N++
                    lines.push(currentLine);
                    currentLine = char;
                    currentLineWidth = charWidth;
                } else {
                    currentLine += char;
                    currentLineWidth += charWidth;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            return lines;
        }
        let lines = splitText(text, maxLineLength);
        // 根据行数动态调整高度
        baseHeight += lines.length * lineHeight;
        // 创建一个临时的canvas来获取最长行的宽度
        let tempCanvas = await ctx.canvas.createCanvas(1, 1);
        let tempContext = tempCanvas.getContext('2d');
        tempContext.font = `${fontSize}px sans-serif`;
        // 获取最长行的宽度
        let longestLineWidth = lines.reduce((maxWidth, line) => {
            let lineWidth = tempContext.measureText(line).width;
            return lineWidth > maxWidth ? lineWidth : maxWidth;
        }, 0);
        // 使用最长行的宽度作为基础宽度
        baseWidth = (longestLineWidth + rad * 2);  // 加上左右两边的弧度
        wid_dialog = baseWidth
        // 创建实际的canvas
        const canvas = await ctx.canvas.createCanvas(baseWidth, baseHeight);
        const context = canvas.getContext('2d');
        // 绘制圆角矩形
        context.beginPath();
        context.moveTo(rad, 0);
        context.arcTo(baseWidth, 0, baseWidth, baseHeight, rad);
        context.arcTo(baseWidth, baseHeight, 0, baseHeight, rad);
        context.arcTo(0, baseHeight, 0, 0, rad);
        context.arcTo(0, 0, baseWidth, 0, rad);
        context.closePath();
        // 填充颜色
        context.fillStyle = color;
        context.fill();
        // 设置文本属性
        context.font = `bold ${fontSize}px ${fonts}`;
        context.fillStyle = '#FFFFFF';
        // 绘制文本
        for (let i = 0; i < lines.length; i++) {
            context.fillText(lines[i], rad - (20 * A), rad + (i * lineHeight) + (120 * A))
        }
        const buffer = await canvas.toBuffer('image/png');
        const filename = text.substring(0, 10);
        await fs.writeFile(root + '/' + random + '_' + filename + '.png', buffer);
    }



    // 圆角图片生成函数
    var img_1_height: number = 0;
    async function create_user_Image(imagePath: string, imageName: string): Promise<void> {
        img_1_height = 0
        // 加载本地图片
        const image = await ctx.canvas.loadImage(imagePath);
        // 使用类型断言
        const img = image as unknown as { width: number, height: number };

        // 固定画布宽度
        const canvasWidth = 1500 * A;
        // 根据固定宽度计算高度，以保持图片宽高比
        const scale = canvasWidth / img.width;
        const canvasHeight = img.height * scale;
        img_1_height = canvasHeight;

        // 创建画布
        const canvas = await ctx.canvas.createCanvas(canvasWidth, canvasHeight);
        const ctxs = canvas.getContext('2d');

        // 绘制圆角矩形路径
        const cornerRadius = 100 * A;
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

        // 剪切圆角矩形区域
        ctxs.clip();

        // 在圆角矩形内绘制图片
        ctxs.drawImage(image, 0, 0, canvasWidth, canvasHeight);

        // 将画布内容保存为 PNG 格式，并覆盖原始图片
        const buffer = await canvas.toBuffer('image/png');
        const pathname = imageName.substring(0, 10);
        await fs.writeFile(root + '/' + pathname + '.png', buffer);

    }













}