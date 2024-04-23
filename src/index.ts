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
  const color_di = '#FFEFF4'//全局背景色
  const log1 = "koharu-talk"
  const logger: Logger = new Logger(log1)
  const url_db = "https://schale.gg/images/student/collection/"
  const alinclude_url = "http://124.221.99.85:8088"
  const favor_img = 'http://124.221.198.113:9123/download/data/stu_icon_db/10000.jpg'
  const duds_url = "http://124.221.198.113:9123/download/back.png"
  const baiduapi = 'https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined'
  const baidu_token_url = 'https://aip.baidubce.com/oauth/2.0/token'
  const db_data = 'https://schale.gg/data/zh/students.min.json'
  const id = config.process.id
  const apikey = config.resolution
  const skey = config.process.SKey
  const user_out_mess = config.returns
  var token = ''

  const random = new Random(() => Math.random())//乱整个随机数防止重名
  var snms = true
  logger.info('当前分辨率倍率🖥️ ：' + A)

  const root_json = await rootF("bap-json")
  const root = await rootF("khr-data")
  const cos1 = 'https://1145141919810-1317895529.cos.ap-chengdu.myqcloud.com/'


  const fmp = new FMPS(ctx)
  async function init_download() {
    logger.info('⬇️ 开始下载插件必须资源，请稍等哦（*＾-＾*）')
    try {
      const stu_data = await fmp.json_parse(`${root_json}/sms_studata_toaro_stu.json`)
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



  //背景创建函数
  async function create_background(hi: number) {
    const wi = 2600 * A
    const canvas = await ctx.canvas.createCanvas(wi, hi)
    const back = canvas.getContext('2d')
    back.fillStyle = color_di
    back.fillRect(0, 0, wi, hi)
    const buffer_back = await canvas.toBuffer('image/png')
    await fs.writeFile(`${root}/back_${hi}.png`, buffer_back)
  }

  // 定义ImageSource接口
  interface ImageSource {
    src: string;
    x: number;
    y: number;
  }
  async function stitchImages(images: ImageSource[], backimg_hi: number, id: number) {
    let backimg = `${root}/back_${backimg_hi}.png`
    // 确定画布的高度
    //const lastImage = images[images.length - 1];
    const canvasHeight = backimg_hi
    const canvasWidth = 3100 * A; // 画布宽度
    // 创建画布
    const canvas = await ctx.canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');
    // 绘制背景图像
    const backgroundImage = await ctx.canvas.loadImage(backimg);
    context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    // 遍历并绘制每个图像
    for (const image of images) {
      const img = await ctx.canvas.loadImage(image.src); // 加载图像
      context.drawImage(img, image.x, image.y); // 绘制图像
    }
    // 保存画布为 PNG 文件
    const buffer = await canvas.toBuffer('image/png');
    await fs.writeFile(`${root}/miximg_${id}.png`, buffer);
  }

  //羁绊剧情创建函数
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
    const buffer = await favor.toBuffer('image/png')
    await fs.writeFile(`${root}/favor_${name}.png`, buffer)
  }

  //文件夹缓存删除函数
  async function deleteFilesInDirectory(dirPath: string) {
    let out = ''
    try {
      const files = await readdir(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          await unlink(filePath);
        }
      }
      out = '文件已删除'
    } catch (error) {
      out = '删除文件时出错,请查看日志'
      logger.info(error)
    }
    return out
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
    //转成buffer对象即可储存
    const buffer_ava = await canvas.toBuffer('image/png')
    await fs.writeFile(`${root}/${stu_name}.png`, buffer_ava)
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


  //图片下载函数
  async function download_image_pro
    (urls: string, savePath: string, imgname: string):
    Promise<void> {
    async function download_image(url: string): Promise<Buffer> {
      const imageData = await ctx.http.get(url, { responseType: 'arraybuffer' });
      if (!imageData) {
        throw new Error('No image data');
      }
      return Buffer.from(imageData);
    }
    try {
      const imageBuffer = await download_image(urls);
      const filePath = path.join(savePath, imgname);
      fs.writeFile(filePath, imageBuffer);
    } catch (error) {
      logger.info(error)
    }
  }
  console

  //对话判断函数
  async function dete_chat(text: string) {

    interface outpath {
      sensei?: boolean
      name: string
      path: string
    }
    let out: outpath
    const random = new Random(() => Math.random())

    let ran = random.int(0, 1000)

    if (/image file/.test(text)) {
      try {
        const fileMatch = text.match(/file="([^"]+)"/)[1].substring(0, 10);
        const urlMatch = text.match(/url="([^"]+)"/)[1];
        await create_user_Image(urlMatch, fileMatch)
        out = {
          name: fileMatch,
          path: `${root}/${fileMatch.substring(0, 10)}.png`
        }
        return out
      } catch (error) {
        logger.info(error)
        return false
      };
    } else if (/s=/.test(text)) {
      text = text.replace(/[\/\\]/g, '');
      text = text.match(/s=(.*)/)[1]
      console.log(text)
      create_dialog_box(text, '#4a8aca', ran)
      out = {
        sensei: true,
        name: text.substring(0, 10),
        path: `${root}/${ran}_${text.substring(0, 10)}.png`
      }
      return out

    } else if (text == '=羁绊') {
      return 1
    } else {
      text = text.replace(/[\/\\]/g, '');
      create_dialog_box(text, '#4c5b70', ran)
      out = {
        name: text.substring(0, 10),
        path: `${root}/${ran}_${text.substring(0, 10)}.png`
      }
      return out
    }
  }

  //获取db的学生总数
  async function db_number_get() {
    const i = await ctx.http.get(db_data)
    const out = Object.keys(i).length
    return out
  }
  const snums = await db_number_get()

  function SANAE_MATCH_SYSTEMS(name: string) {
    interface StudentName {
      "Id": string;
      "Id_db": number;
      "FirstName_jp": string; // 日文姓氏
      "FirstName_zh": string; // 中文姓氏
      "Name_jp": string;      // 日服名字
      "Name_en": string;      // 美服名字
      "Name_zh_tw": string;   // 国际服名字
      "Name_kr": string;      // 韩服名字
      "Name_zh_cn": string;   // 国服名字
      "Name_zh_ft": string;   // 常用民译名字
      "NickName": string[]    // 外号或一些特殊称呼或梗
    }
    let num = 0
    const NameData: StudentName[] = require("./sanae_match_system/MatchLib.json") as StudentName[];
    let studentMessage = MatchStudentName(name);
    const result = parseInt(studentMessage[0])
    console.log(result)
    if (studentMessage.length == 0) {
      // 检测字符串长度是否过长
      if (name.length >= 6) {
        return 0
      } else {
        return 0
      }
    } else if (studentMessage.length == 1) {
      console.log(result)
      if (result > 11000) {
        num = 20000 + snums
      } else {
        num = 10000
      }
      console.log(num)
      console.log(
        [
          NameData[result - num].Id_db,
          NameData[result - num].Name_zh_ft
        ]
      )
      return [
        NameData[result - num].Id_db,
        NameData[result - num].Name_zh_ft
      ]
    } else {
      console.log(num)
      console.log(
        [
          NameData[result - num]
        ]
      )
      snms = false
      return [
        NameData[result - num],
        NameData[result - num].Name_zh_ft
      ]
    }
  }

  ctx.command('talk <arg1> [...rest]', '生成momotalk对话')
    .usage('第一个参数是头像，可@群u，或传入学生名\n[...rest]后继参数传入图片或者文字\n使用空格分隔参数')
    .example('talk 小春 呜呜呜 老师')
    .action(async ({ session }, arg1, ...rest) => {
      await download_image_pro(favor_img, root, 'favor_img.png').catch((error) => {
        logger.info(error)
      })
      let platf = true
      let ava_url: string
      var nickname: any = ''
      let onebot_ava = 'http://q.qlogo.cn/headimg_dl?dst_uin='//&spec=640
      let images_path: ImageSource[] = []//芝士最终传入的数组
      let X = 650 * A
      let Y = 360 * A
      N = 0
      img_1_height = 0
      wid_dialog = 0
      //0.2.0先排掉狗使qq平台
      if (session.event.platform == 'qq') {
        platf = false
      }
      //at判断，学生名判断
      if (/<at id="\d*?"\/>/.test(arg1) && platf) {
        let id: string = (/<at id="([^"]+)"/.exec(arg1)[1]);
        ava_url = `${onebot_ava}${id}&spec=640`
        const username = await session.bot.getGuildMember(session.guildId, id)
        logger.info(username)
        if (username.name == '') {
          nickname = username.user.name
        } else {
          nickname = username.name
        }

      } else {
        if (arg1 == null) {
          return `
koharu-talk v0.2
使用示例：talk 小春 呜呜呜 老师'
第一个参数输入学生名称或@群成员
后继的参数可输入图片和文字
使用空格分隔参数
🟢参数“=羁绊”将生成"前往羁绊剧情"气泡
🟢参数“s=<内容>”会将内容生成sensei的对话气泡
其余每个参数会生成一个对话气泡
使用空格分割参数
          `
        }
        const match = SANAE_MATCH_SYSTEMS(arg1)
        console.log(match)
        if (match == 0) {
          return '呜呜...匹配系统找不到对应学生了，请重新输入'
        } else if (!snms) {
          session.send('已自动匹配学生：' + match[1])
          ava_url = duds_url + '/data/avatar_data/' + match[0] + '.png'
          nickname = match[1]
        } else {
          ava_url = duds_url + '/data/avatar_data/' + match[0] + '.png'
          nickname = match[1]
        }
      }
      await create_Avatar_creation(ava_url, nickname)
      images_path.push({ src: root + '/' + nickname + '.png', x: 100 * A, y: 100 * A })
      for (let i = 0; i < rest.length; i++) {
        try {
          const deta = await dete_chat(rest[i])
          if (deta == 1) {
            await create_favor_img(nickname)
            images_path.push({ src: `${root}/favor_${nickname}.png`, x: X, y: Y + 150 * A })
            Y += 635 * A
          } else if (deta && typeof deta == 'object') {
            if (deta.sensei) {
              images_path.push({ src: deta.path, x: (3100 * A) - (100 * A) - wid_dialog, y: Y })
            } else {
              images_path.push({ src: deta.path, x: X, y: Y })
            }
          }
        } catch (error) {
          logger.info(error)
        }
        img_1_height == 0 ? Y += 300 * A + (50 * N) : Y += Math.round(img_1_height) + 20 * A
        img_1_height = 0
        wid_dialog = 0
      }
      console.log(images_path)
      await create_background(Y + 50)
      let id = Number((session.userId).substring(0, 5))
      const img = await stitchImages(images_path, Y + 50, id).catch(error => { logger.info(error) })
      await session.send(h.image(pathToFileURL
        (resolve(__dirname, '../../../data/ba-khr-talk/' + 'miximg_' + id + '.png')).href))
    })

  ctx.command('talk.delet', '删除本插件的本地图片')
    .action(async () => {
      const turn = await deleteFilesInDirectory(root)
      return turn
    })



}


//to do
//表情匹配
//换人
//旁白
//从主角切换回来后的头像缺失