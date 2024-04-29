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
import { constrainedMemory } from 'process';
import http from 'http';


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
  draw_modle: boolean
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

  draw_modle: Schema.boolean().default(true).description('选择canvas渲染（开启：canvas | 关闭：puppeteer）'),

  returns: Schema.string().default('输入内容可能有问题(◎﹏◎)').description('不合规的回复内容'),
  process: Schema.object({
    id: Schema.string().description('APP ID'),
    APIKey: Schema.string().description('API Key'),
    SKey: Schema.string().description('Secret Key')
  }).description('百度审核(缺省则不启用)'),
})

export const json_file_name = 'sms_studata_main.json'


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
  const drawm = config.draw_modle ? "" : 'file://'

  const color_di = '#FFEFF4'//全局背景色
  const log1 = "koharu-talk"
  const logger: Logger = new Logger(log1)
  const fmp = new FMPS(ctx)
  const root = await rootF("mmt_img")




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
    const accessToken = token
    const urls = `${baiduapi}?access_token=${accessToken}`;
    const configs = {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    };
    // 使用 URLSearchParams 格式化数据
    const data = new URLSearchParams();
    data.append('text', text);
    const post = await ctx.http.post(urls, data, configs);
    console.log(await post)
    if (post.conclusion == '不合规') {
      logger.info('内容不合规')
      logger.info(post)
    }
    return post.conclusion
  }


  async function init_download() {
    logger.info('⬇️ 开始下载插件必须资源，请稍等哦（*＾-＾*）')
    await fmp.file_download('https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/json%2Fsms_studata_main.json', root, 'sms_studata_main.json')
    const jsondata = await fmp.json_parse(`${root}/${json_file_name}`)
    try {

      const stulen = jsondata.length
      for (let i = 0; i < stulen; i++) {
        await fmp.file_download(`${cos1}stu_icon_db_png/${jsondata[i].Id_db}.png`, await root, jsondata[i].Id_db + '.png')
        const num = Math.round((i / stulen) * 100)
        if (num == 25 || num == 50 || num == 75 || num == 95) {
          logger.info('头像下载进度' + num + '%')
        }
      }
      logger.info('✔️ khr-talk资源文件下载完毕')
    } catch (e) {
      logger.error('出现错误' + e)
      return
    }
  }
  //init_download()


  //背景函数
  async function create_background(hi: number) {
    const wi = 2600 * A
    const canvas = await ctx.canvas.createCanvas(wi, hi)
    const back = canvas.getContext('2d')
    back.fillStyle = color_di
    back.fillRect(0, 0, wi, hi)
    return canvas.toBuffer("image/png")
  }
  //头像创建函数
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
    const avatar_wi = 1000 * A
    const fontsize = 160 * A
    const img_data = await ctx.canvas.loadImage(url)
    let wids = config.draw_modle ? 'width' : 'naturalWidth'
    let heis = config.draw_modle ? 'height' : 'naturalHeight'
    let bighw
    img_data[heis] < img_data[wids] ? bighw = img_data[heis] : bighw = img_data[wids]
    const f = 500 / bighw
    let new_h = img_data[heis] * f
    let new_w = img_data[wids] * f
    const canvas = await ctx.canvas.createCanvas(avatar_wi, avatar_hi)
    const ctx_a = canvas.getContext('2d')
    ctx_a.fillStyle = color_di;
    ctx_a.fillRect(0, 0, avatar_wi, avatar_hi);
    ctx_a.save();
    ctx_a.beginPath();
    ctx_a.arc(250 * A, 250 * A, 240 * A, 0, Math.PI * 2);
    ctx_a.clip();
    ctx_a.drawImage(img_data, 0, 0, new_w * A, new_h * A)
    ctx_a.restore();
    ctx_a.fillStyle = '#000000'
    ctx_a.font = `bold ${fontsize}px ${fonts}`
    ctx_a.fillText(stu_name, 540 * A, 200 * A)
    return canvas.toBuffer("image/png")
  }



  //对话框创建函数
  var N: number = 0
  var wid_dialog: number = 0
  async function create_dialog_box(text: string, color: string) {
    N = 0
    wid_dialog = 0
    // 字体大小
    const fontSize = 105 * A;
    // 行高
    const lineHeight = 150 * A;
    // 每行最大字符数
    const maxLineLength = 34;
    // 基底高度
    let baseHeight = 80 * A;
    // 基底宽度
    let baseWidth = 300 * A;
    // 弧度
    let rad = 60 * A;
    let wid_text = 0
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
          /[\u0391-\uFFE5]/.test(char) ? wid_text += fontSize : wid_text += (fontSize / 2);
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    }

    let lines = splitText(text, maxLineLength);
    baseHeight += lines.length * lineHeight;
    wid_text > 1800 * A ? wid_text = 1800 * A : ''
    baseWidth = (wid_text + rad * 2);  // 加上左右两边的弧度
    wid_dialog = baseWidth
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
    context.fillStyle = color;
    context.fill();
    context.font = `bold ${fontSize}px ${fonts}`;
    context.fillStyle = '#FFFFFF';
    // 绘制文本
    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i], rad - (10 * A), rad + (i * lineHeight) + (90 * A))
    }

    return canvas.toDataURL("image/png")
  }



  // 圆角图片生成函数

  async function create_user_Image(imagePath: string) {
    const image = await ctx.canvas.loadImage(imagePath);
    const canvasWidth = 700 * A;
    let wids = config.draw_modle ? 'width' : 'naturalWidth'
    let heis = config.draw_modle ? 'height' : 'naturalHeight'
    let bighw
    image[heis] < image[wids] ? bighw = image[heis] : bighw = image[wids]

    const scale = canvasWidth / bighw;
    const canvasHeight = image[heis] * scale
    const new_wi = image[wids] * scale

    // 创建画布
    const canvas = await ctx.canvas.createCanvas(new_wi, canvasHeight);
    const ctxs = canvas.getContext('2d');

    // 绘制圆角矩形路径
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

    return canvas.toDataURL("image/png")

  }



  function type_ful(input) {
    if (input[0].type == "text") {
      return input[0].attrs.content
    } else if (input[0].type == "img") {
      return input[0].attrs.src
    }
  }


  ctx.command('talk <arg1> [...rest]', '生成momotalk对话')
    // .usage('第一个参数是头像，可@群u，或传入学生名\n[...rest]后继参数传入图片或者文字\n使用空格分隔参数')
    //.example('talk 小春 呜呜呜 老师')
    .option('nikc name', '-n [beta]')
    .option('Picture position', '-p [beta]')
    .action(async ({ session, options }, arg1, ...rest) => {
      console.log(arg1)
      console.log(rest)
      //const messages = session.bot.adapter
      //console.log(messages)
      const json_data = await fmp.json_parse(`${root}/${json_file_name}`)

      console.log(options)
      let stuname = []
      let avaimg_url = ''
      if (!arg1) {
        return `
待写使用说明
        `
      } else {

        if (h.parse(arg1)[0].type == "text") {
          stuname = await MatchStudentName(arg1)
          console.log(stuname)
          if (stuname.length == 0) {

          } else {
            if (Object.keys(options).length != 0) {
              let stuid = json_data.find(i => i.Id == stuname[0])?.Id_db;
              stuname[0] = options['nikc name']
              avaimg_url = `${drawm}${root}/${stuid}.png`
            } else {
              let stuid = json_data.find(i => i.Id == stuname[0])?.Id_db;
              stuname[0] = json_data.find(i => i.Id == stuname[0])?.Name_zh_ft;
              avaimg_url = `${drawm}${root}/${stuid}.png`
            }
          }
        } else {
          if (Object.keys(options).length == 0) {
            stuname[0] = ''
          } else {
            stuname[0] = options['nikc name']
          }
          avaimg_url = h.parse(arg1)[0].attrs.src
        }
        console.log(avaimg_url)
      }

      async function draw_ultra() {
        const hi = 2000
        const canvas = await ctx.canvas.createCanvas(2600 * A, hi);
        const c = canvas.getContext('2d');
        const avadraw = await ctx.canvas.loadImage(await create_Avatar_creation(avaimg_url, stuname[0]))
        const backimg = await ctx.canvas.loadImage(await create_background(hi))
        c.drawImage(backimg, 0, 0)
        c.drawImage(avadraw, 50, 50)
        let y1 = 180
        for (let i = 0; i < rest.length; i++) {
          if (h.parse(rest[i])[0].type == "img") {
            const image_bubb = await ctx.canvas.loadImage(await create_user_Image((type_ful(h.parse(rest[i])))))
            c.drawImage(image_bubb, 630 * A, y1)
            let heis = config.draw_modle ? 'height' : 'naturalHeight'
            y1 += (image_bubb[heis] + (20 * A))

          } else if (0) {

          } else {
            const talk_bubb = await ctx.canvas.loadImage(await create_dialog_box((type_ful(h.parse(rest[i]))), '#4c5b70'))
            c.drawImage(talk_bubb, 630 * A, y1)
            let heis = config.draw_modle ? 'height' : 'naturalHeight'
            y1 += (talk_bubb[heis] + (20 * A))
          }

        }
        const img = await canvas.toDataURL("image/png")
        return img
      }
      const img = await draw_ultra()
      return h.image(img)

    })


  ctx.command('talk/talkimg<message:image>')
    .alias('image')
    .action(async ({ session }, message) => {

    })








}