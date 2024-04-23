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












}