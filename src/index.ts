import { Context, Schema, Logger, Random, h, } from 'koishi'
import { MatchStudentName } from './sanae_match_system/match_mmt';
import { } from '@koishijs/canvas';
import { } from "@satorijs/adapter-qq";
import { file_search, rootF } from './FMPS/FMPS_F';
import { FMPS } from './FMPS/FMPS';

export const inject = { required: ['canvas'] }
//export const using = ['canvas']
export const name = 'ba-koharu-talk'
export const usage = `
<div style="font-size:30px; font-weight:bold;">
<span style="color: #FFD2ED;">koharu</span>-talk
<div style="border:1px solid #CCC"></div> 

<h6>0.3.0-aplha</h6>
<h6>日志出现报错可尝试重启插件</h6>
<h6>指令没加载出来可尝试重启commands插件</h6>
`
export interface Config {
  font: string
  resolution: 0.25 | 0.5 | 1;
  draw_modle: "canvas" | "puppeteer"
  auto_update: boolean
  returns: string
  input_time: number
  process: {
    id?: string
    APIKey?: string
    SKey?: string
  }
}
export const Config: Schema<Config> = Schema.object({
  auto_update: Schema.boolean().required().description('### 是否每次重启都下载资源'),
  font: Schema.string().default('YouYuan').description('字体设置（beta）'),
  resolution: Schema.union([
    Schema.const(0.25).description('x 0.25'),
    Schema.const(0.5).description('x 0.5'),
    Schema.const(1).description('x 1'),
  ]).role('radio').required().description('分辨率设置'),
  draw_modle: Schema.union([
    Schema.const('canvas').description('canvas'),
    Schema.const('puppeteer').description('puppeteer'),
  ]).description('选择渲染方法').role('radio').required(),
  input_time: Schema.number().default(60000).description('等待输入时间'),
  returns: Schema.string().default('输入内容可能有问题(◎﹏◎)').description('不合规的回复内容'),
  process: Schema.object({
    id: Schema.string().description('APP ID'),
    APIKey: Schema.string().description('API Key').role('secret'),
    SKey: Schema.string().description('Secret Key').role('secret')
  }).description('百度审核(缺省则不启用)'),
})

export const json_file_name = 'sms_studata_main.json'


export async function apply(ctx: Context, config: Config) {
  //字体读取
  const fonts = config.font
  //分辨率倍率
  const A = (config.resolution)

  const baiduapi = "https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined"
  const baidu_token_url = 'https://aip.baidubce.com/oauth/2.0/token'
  const cos1 = 'https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/'
  const qqavaurl = 'https://api.qqsuu.cn/api/dm-qt?qq='

  const id = config.process.id
  const apikey = config.process.APIKey
  const skey = config.process.SKey
  const drawm = config.draw_modle == "canvas" ? "" : 'file://'
  const violate_text = config.returns
  const inp_time = config.input_time
  const color_di = '#FFEFF4'//全局背景色
  const log1 = "koharu-talk"
  const logger: Logger = new Logger(log1)
  const fmp = new FMPS(ctx)
  const random = new Random(() => Math.random())
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
  let process: boolean = false
  if (apikey == null || skey == null || id == null) {
    logger.info('⛔ 审核配置填写不完整，已停用')
    process = false
  } else {
    if (await tokens() == false) {
      logger.info('⛔ 审核配置填写可能有误，已停用')
    } else {
      logger.info('🟢 已启用百度审核')
      process = true
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


  async function initia() {
    logger.info("🟡 正在更新json文件")
    const hashurl = 'https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/hash.json'
    const jsonurl = "https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/json%2F"
    const newhash = await ctx.http.get(hashurl)
    const oldjson = await fmp.json_parse(root + "/hash.json")
    if(!oldjson){
      await fmp.file_download(hashurl, root, 'hash.json')
    }
    function arraysEqual(a, b) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (Object.keys(a[i]).length !== Object.keys(b[i]).length) return false;
        for (let key in a[i]) {
          if (a[i][key] !== b[i][key]) return false;
        }
      }
      return true;
    }
    if (!arraysEqual(newhash, oldjson)) {
      logger.info("☁️🆕🟡云hash更新");
      const stu_data = await fmp.json_parse(`${root}/sms_studata_toaro_stu.json`)
      if (!await file_search(`${root}/${(stu_data[stu_data.length - 1] as { Id_db: any }).Id_db}.png`)) {
        await init_download()
      }

    } else {
      logger.info("☁️   🟢云hash未更新");
      //二次检测
      for (let i = 0; i < newhash.length; i++) {
        const jsons = await fmp.json_parse(`${root}/${oldjson[i].fname}`)
        if (jsons == null) {
          await fmp.file_download((`${jsonurl}${newhash[i].fname}`), root, `${newhash[i].fname}`)
        }
      }

      if (config.auto_update) {
        logger.info("🟡本地资源随机更新");
        await init_download()
      }
      return
    }
    for (let i = 1; i < 4; i++) {
      try {
        await fmp.file_download(hashurl, root, 'hash.json')
        for (let i = 0; i < newhash.length; i++) {
          await fmp.file_download((`${jsonurl}${newhash[i].fname}`), root, `${newhash[i].fname}`)
        }
        break
      } catch (e) {
        if (i < 3) {
          logger.info("🟡json文件下载出错：进行第" + i + "次尝试" + e)
        } else {
          logger.info("🔴" + i + "次尝试后依旧出错" + e)
          break
        }
      }
    }
    logger.info("🟢 json文件更新完毕")
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
          logger.info('下载进度' + num + '%')
        }
      }
      await fmp.file_download(`${cos1}img_file/khrtalk_favor.png`, root, 'khrtalk_favor.png')
      logger.info('✔️ khr-talk资源文件下载完毕')
    } catch (e) {
      logger.error('出现错误' + e)
      return
    }
  }


  await initia()
  //await init_download()

  try {
    ctx.setInterval(async () => await initia(), 3 * 60 * 60 * 1000)
  } catch (e) {
    logger.info(e)
  }




  //背景函数
  async function create_background(hi: number) {
    const wi = 2600 * A
    const canvas = await ctx.canvas.createCanvas(wi, hi)
    const back = canvas.getContext('2d')
    back.fillStyle = color_di
    back.fillRect(0, 0, wi, hi)
    return canvas.toBuffer("image/png")
  }
  //羁绊创建函数
  async function create_favor_img(name: string) {
    const wid = 2762 * A
    const hei = 638 * A
    let font_size = 100 * A
    const favorimg = await ctx.canvas.loadImage(`${drawm}${root}/khrtalk_favor.png`)
    const favor = await ctx.canvas.createCanvas(wid, hei)
    const cre = favor.getContext('2d')
    cre.drawImage(favorimg, 0, 0, wid / 1.5, hei / 1.5)
    cre.textAlign = 'center'
    cre.fillStyle = color_di
    const text = `前往${name}的羁绊剧情`
    console.log(text.length)
    if (text.length > 16) {
      const fsize = (text.length - 16) * 1.2
      cre.font = `bold ${font_size - fsize}px ${fonts}`;
    } else {
      cre.font = `bold ${font_size}px ${fonts}`;
    }

    cre.fillText(text, 920 * A, 345 * A)
    return favor.toDataURL("image/png")
  }

  //头像创建函数
  async function create_Avatar_creation(url: string, stu_name: string) {
    const avatar_hi = 500 * A
    const avatar_wi = 2600 * A
    const fontsize = 140 * A
    const img_data = await ctx.canvas.loadImage(url)
    let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
    let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
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
    ctx_a.fillText(stu_name, 540 * A, 180 * A)
    return canvas.toBuffer("image/png")
  }

  //对话框创建函数
  var N: number = 0
  async function create_dialog_box(text: string, color: string) {
    N = 0
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


  //旁白创建函数
  async function create_aside(text) {
    const fontSize = 85 * A;
    // 行高
    const lineHeight = 100 * A;
    // 每行最大字符数
    const maxLineLength = 55;
    // 基底高度
    let baseHeight = 50 * A;
    // 基底宽度
    let baseWidth = 180 * A;
    // 弧度
    let rad = 40 * A;
    let wid_text = 0
    function splitText(text, maxLineWidth) {
      let lines = [];
      let currentLine = '';
      let currentLineWidth = 0;
      for (let char of text) {
        // 判断字符是全角还是半角
        let charWidth = /[\u0391-\uFFE5]/.test(char) ? 2 : 1;
        if (currentLineWidth + charWidth > maxLineWidth) {
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
    wid_text > 2280 * A ? wid_text = 2280 * A : ''
    baseWidth = (wid_text + rad * 2);  // 加上左右两边的弧度
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
    context.fillStyle = '#D9CBD0';
    context.fill();
    context.font = `bold ${fontSize}px ${fonts}`;
    context.fillStyle = '#1C1A1B';
    // 绘制文本
    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i], rad - (14 * A), rad + (i * lineHeight) + (55 * A))
    }
    return canvas.toDataURL("image/png")
  }

  // 圆角图片生成函数
  async function create_user_Image(imagePath: string) {
    const image = await ctx.canvas.loadImage(imagePath);
    const canvaswidth = 800 * A;
    let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
    let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
    //let bighw
    //image[heis] < image[wids] ? bighw = image[heis] : bighw = image[wids]
    const scale = canvaswidth / image[heis];
    const canvasHeight = image[heis] * scale
    const new_wi = image[wids] * scale
    const canvasWidth = new_wi
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


  function getStringLength(str) {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if ((charCode >= 0x00 && charCode <= 0xFF) || // 半角字符范围
        (charCode >= 0xFF61 && charCode <= 0xFF9F)) { // 半角的日文字符范围
        length += 1;
      } else {
        length += 2; // 全角字符
      }
    }
    return length;
  }
  let arr_add: boolean = true
  function hei_cal(input) {
    let yout = 0
    if (input[0].type == "text") {
      const tlength = getStringLength(input[0].attrs.content)
      let aa = (tlength / 36)
      aa = Math.round(aa)
      aa < 1 ? aa = 1 : aa = aa
      yout = ((230 * A) * aa) + (20 * A)
      if (/s=/.test(input[0].attrs.content) && arr_add) {
        yout += 300 * A
        arr_add = false
      } else if ((input[0].attrs.content) == '=img') {
        yout = (800 * A) + (20 * A)
      } else {
        arr_add = true
      }
      if (input.length > 1) {
        yout += (800 * A) + (20 * A)
      }
    } else if (input[0].type == "img") {
      yout = (800 * A) + (20 * A)
    }
    return yout
  }
  // .usage('第一个参数是头像，可@群u，或传入学生名\n[...rest]后继参数传入图片或者文字\n使用空格分隔参数')
  //.example('talk 小春 呜呜呜 老师')


  ctx.command('talk <arg1> [...rest]', '生成momotalk对话')
    .option('nikc name', '-n [beta]')
    .option("favo", "-f")
    .action(async ({ session, options }, arg1, ...rest) => {
      let help_pla = []
      if (session.event.platform == 'qq') {
        help_pla[0] = ''
        help_pla[1] = '@机器人/'
        help_pla[2] = ''
        help_pla[3] = `  
🟢5.使用指令触发者的头像和自定义昵称
      ${help_pla[1]}talk =me 啊哈哈 -n 夏莱老师`
        help_pla[4] =
          `🟨注意
-目前手机端的qq不能很好的发送图文消息，=img功能需要@机器人并在消息内包含图片`
      } else {
        help_pla[0] = '和昵称'
        help_pla[1] = ''
        help_pla[2] = '▪️当@群成员时，会使用该群成员的头像和昵称（beta）'
        help_pla[3] = `  
🟢5.使用指令触发者的头像和昵称
      ${help_pla[1]}talk =me 啊哈哈`
        help_pla[4] = ''
      }
      //◾◻️▫️▪️◽◾◻️◼️⬜⬛🟩🟨🟧🟢🟡🟠🔵
      const help_text = `
koharu-talk-v0.3-beta
使用方法：
talk [对话对象] [正文1 正文2 正文3...] [选项]
◻️正文之间使用空格来分隔
◻️参数介绍：
◽[对话对象]：
    ▪️需输入学生名
    ▪️当输入 me= 时，会使用指令调用者的头像${help_pla[0]}
    ${help_pla[2]}
◽[正文]：
    ▪️对话内容，使用空格来分隔，每个正文会生成对话气泡
    ▪️当正文内容为 s=[文本] 时，会生成老师的消息气泡
    ▪️当正文内容为 a=[文本] 时，会生成旁白的气泡
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
      ${help_pla[1]}talk 若藻 呼呼呼呼 老师 你逃不掉的❤ -f
🟢7.输入图片
      ${help_pla[1]}talk 柚子 =img 老师，这么快就要用我送您的劵吗 s=打大蛇能全暴击吗
      ▪️“=img”的位置会预留一个图片，后继需要根据引导发送图片
      ${help_pla[4]}
      反馈：2609631906@qq.com
    `

      const json_data = await fmp.json_parse(`${root}/${json_file_name}`)
      interface option {
        nick: any
        favo: boolean
      }
      const optionss: option = {
        nick: options['nikc name'],
        favo: options.favo
      }
      console.log(optionss)
      logger.info(rest)
      //能跑就行，比0.2还乱
      if (process) {
        const proce_out = await process_baidu(arg1)
        if (proce_out == "不合规") {
          return violate_text
        }
      }
      async function cal_arg1(arg1) {
        let stuname = []
        let avaimg_url = ''
        let output = []
        if (!arg1) {
          return help_text
        } else {
          try {
            if (h.parse(arg1)[0].type == "text") {
              if (h.parse(arg1).length > 1) {
                rest = [h.parse(arg1)[0].attrs.content, ...rest]
                if (optionss.nick) {
                  stuname[0] = optionss.nick
                } else {
                  stuname[0] = ''
                }
                avaimg_url = h.parse(arg1)[1].attrs.src
                return [...stuname, avaimg_url]
              }
              if (arg1 == 'me=') {
                if (session.event.platform == 'qq') {
                  const arrurl = `https://q.qlogo.cn/qqapp/${session.bot.config.id}/${session.event.user?.id}/640`
                  const get = await ctx.http.get(arrurl)
                  if (get.byteLength <= 1512) {
                    stuname.push((await random.pick(json_data))['Id'])
                    let stuid = json_data.find(i => i.Id == stuname[0])?.Id_db;
                    stuname[0] = json_data.find(i => i.Id == stuname[0])?.Name_zh_ft;
                    avaimg_url = `${drawm}${root}/${stuid}.png`
                  } else {
                    if (optionss.nick) {
                      stuname[0] = optionss.nick
                    } else {
                      stuname[0] = ''
                    }
                    avaimg_url = arrurl
                    return [...stuname, avaimg_url]
                  }
                } else {
                  try {
                    const ids = (session.event.user.id)
                    const username = session.event.member.nick
                    avaimg_url = qqavaurl + ids
                    stuname[0] = username
                    return [...stuname, avaimg_url]
                  } catch (e) {
                    logger.info(e)
                    stuname.push((await random.pick(json_data))['Id'])
                    let stuid = json_data.find(i => i.Id == stuname[0])?.Id_db;
                    stuname[0] = json_data.find(i => i.Id == stuname[0])?.Name_zh_ft;
                    avaimg_url = `${drawm}${root}/${stuid}.png`
                    return [...stuname, avaimg_url]
                  }
                }
              } else {
                try {
                  stuname = await MatchStudentName(arg1)
                  console.log('sanae_match:' + json_data.find(i => i.Id == stuname[0])?.Name_zh_ft)
                } catch (e) {
                  stuname.push((await random.pick(json_data))['Id'])
                }
                if (stuname.length == 0) {
                  stuname.push((await random.pick(json_data))['Id'])
                } else {
                  if (optionss.nick) {
                    let stuid = json_data.find(i => i.Id == stuname[0])?.Id_db;
                    stuname[0] = optionss.nick
                    stuname[0] == '' ? stuname[0] = json_data.find(i => i.Id_db == stuid)?.Name_zh_ft : ''
                    avaimg_url = `${drawm}${root}/${stuid}.png`
                    return [...stuname, avaimg_url]
                  } else {
                    let stuid = json_data.find(i => i.Id == stuname[0])?.Id_db;
                    stuname[0] = json_data.find(i => i.Id == stuname[0])?.Name_zh_ft;
                    avaimg_url = `${drawm}${root}/${stuid}.png`
                    return [...stuname, avaimg_url]
                  }
                }
              }
            } else if (h.parse(arg1)[0].type == "at") {
              const ids = (h.parse(arg1)[0].attrs.id)
              const username = (await session.bot.getGuildMember(session.guildId, ids)).nick
              avaimg_url = qqavaurl + ids
              if (optionss.nick) {
                stuname[0] = optionss.nick
              } else {
                stuname[0] = username
              }
              return [...stuname, avaimg_url]
            } else {
              if (optionss.nick) {
                stuname[0] = optionss.nick
              } else {
                stuname[0] = ''
              }
              avaimg_url = h.parse(arg1)[0].attrs.src
              return [...stuname, avaimg_url]
            }
          } catch (e) {
            logger.info(e)
            return ['呜呜，无法处理输入的昵称']
          }
        }
      }
      if (process) {
        for (let i = 0; i < rest.length; i++) {
          if (h.parse(rest[i])[0].type == "text") {
            const proce_out = await process_baidu(rest[i])
            if (proce_out == "不合规") {
              return violate_text
            }
          }
        }
      }

      if (!arg1) {
        return help_text
      }
      //检测第一个参数就是旁白或老师对话的情况
      let arr_newy: number = 0
      if (/a=/.test(rest[0])) {
        arr_newy = 260 * A
        for (let i = 0; i < rest.length; i++) {
          if (/a=/.test(rest[i])) {
            const regex = /a=(.*)/;
            const match = rest[i].match(regex)[1]
            if (match == '') {
              const tlength = getStringLength(h.parse(rest[i + 1])[0].attrs.content)
              let aa = (tlength / 36)
              aa = Math.round(aa)
              aa < 1 ? aa = 1 : aa = aa
              arr_newy += ((170 * A) * aa) + (20 * A)
              i++
            } else {
              const tlength = getStringLength(match)
              let aa = (tlength / 36)
              aa = Math.round(aa)
              aa < 1 ? aa = 1 : aa = aa
              arr_newy += ((170 * A) * aa) + (20 * A)
            }
          } else {

          }
        }
      }
      if (/s=/.test(rest[0])) {
        arr_newy = 260 * A
        for (let i = 0; i < rest.length; i++) {
          if (/s=/.test(rest[i])) {
            const regex = /s=(.*)/;
            const match = rest[i].match(regex)[1]
            if (match == '') {
              const tlength = getStringLength(h.parse(rest[i + 1])[0].attrs.content)
              let aa = (tlength / 36)
              aa = Math.round(aa)
              aa < 1 ? aa = 1 : aa = aa
              arr_newy += ((230 * A) * aa) + (20 * A)
              i++
            } else {
              const tlength = getStringLength(match)
              let aa = (tlength / 36)
              aa = Math.round(aa)
              aa < 1 ? aa = 1 : aa = aa
              arr_newy += ((230 * A) * aa) + (20 * A)
            }
          } else { }

        }
      }
      const arg1s = await cal_arg1(arg1)
      async function draw_ultra() {
        let hi = 750 * A
        for (let i = 0; i < rest.length; i++) {
          hi += hei_cal(h.parse(rest[i]))
        }
        optionss.favo ? hi += 400 * A : ''
        arr_newy != 0 ? hi += 400 * A : ''
        const canvas = await ctx.canvas.createCanvas(2600 * A, hi);
        const c = canvas.getContext('2d');
        const avadraw = await ctx.canvas.loadImage(await create_Avatar_creation(arg1s[1], arg1s[0]))
        const backimg = await ctx.canvas.loadImage(await create_background(hi))
        c.drawImage(backimg, 0, 0)
        c.drawImage(avadraw, 100 * A, (100 * A) + arr_newy)
        let y1 = 360 * A
        let arr_add: boolean = false

        interface img_placement {
          num: number
          x_img: number
          y_img: number
        }
        let img_place: img_placement = {
          num: 0,
          x_img: 0,
          y_img: 0
        }
        const img_parr = []
        img_parr.push(img_place.num)

        let arr_add_amend = false
        for (let i = 0; i < rest.length; i++) {
          if (/s=/.test(rest[0])) {
            arr_add = false
            arr_add_amend = true
          } else if (arr_add_amend && /s=/.test(rest[i])) {
            arr_add_amend = true
          } else {
            arr_add_amend = false
          }
          if (arr_add && !/s=/.test(rest[i])) {
            console.log(114514)
            y1 += 30 * A
            c.drawImage(avadraw, 100 * A, y1)
            y1 += 240 * A
            arr_add = false
          }
          if (h.parse(rest[i])[0].type == "img") {
            arr_newy == 0 ? 0 : y1 += (280 * A)
            arr_newy = 0
            const image_bubb = await ctx.canvas.loadImage(await create_user_Image((type_ful(h.parse(rest[i])))))
            c.drawImage(image_bubb, 630 * A, y1)
            let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
            y1 += (image_bubb[heis] + (20 * A))
          } else if (/s=/.test(rest[i])) {
            if (h.parse(rest[i])[0].type == "img") {
              const image_bubb = await ctx.canvas.loadImage(await create_user_Image((type_ful(h.parse(rest[i + 1])))))
              let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
              c.drawImage(image_bubb, (2500 * A) - image_bubb[wids], y1)
              let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
              y1 += (image_bubb[heis] + (20 * A))
              arr_add = true
              i++
            } else {
              const regex = /s=(.*)/;
              const match = rest[i].match(regex)[1]
              if (match == '') {
                //叽里咕噜
                const talk_bubb = await ctx.canvas.loadImage(await create_dialog_box((type_ful(h.parse(rest[i + 1]))), '#4a8aca'))
                let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
                c.drawImage(talk_bubb, (2550 * A) - talk_bubb[wids], y1)
                let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
                y1 += (talk_bubb[heis] + (20 * A))
                arr_add = true
                i++
              } else {
                const talk_bubb = await ctx.canvas.loadImage(await create_dialog_box(match, '#4a8aca'))
                let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
                c.drawImage(talk_bubb, (2550 * A) - talk_bubb[wids], y1)
                let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
                y1 += (talk_bubb[heis] + (20 * A))
                arr_add = true
              }
            }
          } else if (/a=/.test(rest[i])) {
            const regex = /a=(.*)/;
            const match = rest[i].match(regex)[1]
            if (match == '') {
              const talk_bubb = await ctx.canvas.loadImage(await create_aside((type_ful(h.parse(rest[i + 1])))))
              let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
              c.drawImage(talk_bubb, (1300 * A) - (talk_bubb[wids]) / 2, y1)
              let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
              y1 += (talk_bubb[heis] + (20 * A))
              i++
            } else {
              const talk_bubb = await ctx.canvas.loadImage(await create_aside(match))
              let wids = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
              c.drawImage(talk_bubb, (1300 * A) - (talk_bubb[wids]) / 2, y1)
              let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
              y1 += (talk_bubb[heis] + (20 * A))
            }
          } else if (rest[i] == '=img') {
            arr_newy == 0 ? 0 : y1 += (280 * A)
            arr_newy = 0
            let img_p: img_placement = {
              num: img_parr[0] + 1,
              x_img: 630 * A,
              y_img: y1
            }
            img_parr[0] = img_parr[0] + 1
            img_parr.push(img_p)
            y1 += ((800 * A) + (20 * A))
          } else {
            arr_newy == 0 ? 0 : y1 += (280 * A)
            arr_newy = 0
            const talk_bubb = await ctx.canvas.loadImage(await create_dialog_box((type_ful(h.parse(rest[i]))), '#4c5b70'))
            c.drawImage(talk_bubb, 630 * A, y1)
            let heis = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
            y1 += (talk_bubb[heis] + (20 * A))

          }
        }
        if (optionss.favo) {
          const favoimg = await ctx.canvas.loadImage(await create_favor_img(arg1s[0]))
          y1 += 50 * A
          c.drawImage(favoimg, 630 * A, y1)
        }
        //=img占位法
        console.log(img_parr)
        let img_prom = []
        if (img_parr[0] > 0) {
          session.send(`需要输入${img_parr[0]}张图片\n${session.event.platform == 'qq' ? '请@机器人后' : '请'}逐张发送图片`)
          let erri = 0
          for (let i = 0; i < img_parr[0]; i++) {
            const mess = (h.parse(await session.prompt(60000)))
            if (mess[0].type == 'img') {
              img_prom.push(type_ful(mess))
              if ((img_parr[0] - i) == 1) {
                session.send(`输入完毕，图片渲染中~`)
              } else {
                session.send(`还需要输入${img_parr[0] - i - 1}张图片`)
              }
            } else if (mess[0].attrs.content == "退出" || erri >= 2) {
              return '已经终止创作'
            } else {
              session.send(`输入的不是图片，请重新输入\n${session.event.platform == 'qq' ? '@机器人并发送“退出”终止写文' : '发送“退出”终止写文'}`)
              erri++
              i--
            }
          }
          if (img_prom.length != img_parr[0]) return '输入图片超时，请重新写作'
          for (let i = 0; i < img_prom.length; i++) {
            y1 -= 700 * A
          }
          for (let i = 0; i < img_prom.length; i++) {
            const image_bubb = await ctx.canvas.loadImage(await create_user_Image(img_prom[i]))
            c.drawImage(image_bubb, 630 * A, img_parr[i + 1].y_img)
            let heis = config.draw_modle ? 'height' : 'naturalHeight'
            y1 += (image_bubb[heis] + (20 * A))
          }
        }
        const img = await canvas.toDataURL("image/png")
        return img
      }
      const img = await draw_ultra()
      return h.image(img)
    })
}