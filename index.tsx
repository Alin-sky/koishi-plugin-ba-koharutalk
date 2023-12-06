import { Context, Schema, Logger, Random } from 'koishi'
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import { MatchStudentName } from './sanae_match_system/match'
import { readFile, writeFile } from 'fs/promises';


import { } from 'koishi-plugin-canvas'
import { } from '@koishijs/canvas'

export const inject = { required: ['canvas'] }
export const using = ['canvas']

export const name = 'ba-koharu-talk'

export const usage = ' 已知问题：\n' +
  '渲染指令来回切换老师和学生会出问题，是数字和索引问题，需要抽空重构或修复\n' +
  '写文指令好像有几个bug\n' +
  '图片太长会报错\n' +
  '先用罢呜呜'


/*

 doing：
 1.表情匹配系统
 2.旁白创建系统
 3.对话修改系统
 4.长图创建系统

project：

2.@群u使用群u头像


这个项目托太久了，先发了alpha了
看调用数据和反馈，没人玩就不搞了（
 */


export interface Config {
  reminders: number
  font: string
}

export const Config: Schema<Config> = Schema.object({
  reminders: Schema.number().role('slider')
    .min(1).max(30).step(1).default(10).description('自动保存次数'),
  font: Schema.string().default('YouYuan').description('字体设置（beta）'),
})



export function apply(ctx: Context, config: Config) {

  const fonts = config.font

  // 创建文件夹的函数

  const color_di = '#FFEFF4'
  const log1 = "koharu-talk"
  const logger: Logger = new Logger(log1)
  const { createCanvas } = require('canvas');
  const url_db = "https://schale.gg/images/student/collection/"
  const url_alinclude = "http://124.221.99.85:8088"
  const random = new Random(() => Math.random())//乱整个随机数防止重名


  function createDir(dirPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  //背景

  function back_creat(t_hi: number, outputPath: string) {
    (ctx) => {
      const canvas = ctx.createCanvas(1100, t_hi);
      //const ctx = canvas.getContext('2d');
      ctx.fillStyle = color_di;
      ctx.fillRect(0, 0, 1100, t_hi);

      // 创建一个可写流并将canvas的内容以PNG格式写入
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on('finish', () =>
        console.log('The PNG file was created.'));
    }
  }


  // 合成所有图片的函数
  //byGPT4
  interface ImageSource {
    src: string;
    x: number;
    y: number;
    height?: number;
  }

  function calcula_hw(originalWidth: number,
    originalHeight: number, newHeight: number): number {
    return Math.floor(originalWidth * (newHeight / originalHeight));
  }



  async function mergeImages(backgroundImageSrc: string,
    images: ImageSource[]): Promise<void> {
    async (ctx) => {
      try {
        // 使用 readFile 读取背景图像的内容到缓冲区
        const bgImageData = await readFile(backgroundImageSrc);
        // 加载背景图像
        const backgroundImage = await ctx.canvas.loadImage(bgImageData);
        // 创建画布
        const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
        //const ctx = canvas.getContext('2d')!;
        // 绘制背景图像
        ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height);

        // 加载所有图像
        // 加载所有图像
        for (let i = 0; i < images.length; i++) {
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            try {
              // 使用 readFile 读取图像的内容到缓冲区
              const imgData = await readFile(images[i].src);
              const img = await ctx.canvas.loadImage(imgData);
              const newHeight = images[i].height || img.height;
              const newWidth = calcula_hw(img.width, img.height, newHeight);
              // 在画布上绘制元素图像
              ctx.drawImage(img, 0, 0, img.width,
                img.height, images[i].x, images[i].y, newWidth, newHeight);
              // 如果尝试成功，跳出循环
              break;
            } catch (error) {
              attempts++; // 如果尝试失败，增加尝试次数
              if (attempts === maxAttempts) {
                // 如果已达到最大尝试次数，记录错误信息
                logger.info(`Error loading image at ${images[i].src} after ${maxAttempts} attempts:`, error);
              }
            }
          }
        }

        // 将画布转换为缓冲区
        const buffer = canvas.toBuffer();

        // 保存到本地
        await writeFile('output.jpg', buffer);
      } catch (error) {
        console.error('Error in mergeImages:', error);
      }
    }

  }


  //屎山
  //屎山
  //屎山
  //出生即屎山




  /**
   * 创建一个圆角矩形画框，内部是一张图片
   * @param imagePath 本地图片的路径
   */
  var img_1_height: number
  async function create_user_Image(imagePath: string): Promise<void> {
    async (ctx) => {
      const img = await ctx.canvas.render(512, 763, async (ctx) => {
        // 加载本地图片
        const image = await ctx.canvas.loadImage(imagePath);

        // 设置画布的宽度为900像素，或者更大以保持图片的宽高比
        const canvasWidth = 500;
        const scale = canvasWidth / image.width;
        const canvasHeight = image.height * scale;
        img_1_height = canvasHeight

        // 创建画布
        const canvas = createCanvas(canvasWidth, canvasHeight);
        //const ctx = canvas.getContext('2d');

        // 设置圆角矩形的边界和圆角大小
        const cornerRadius = 50;
        ctx.beginPath();
        ctx.moveTo(cornerRadius, 0);
        ctx.lineTo(canvasWidth - cornerRadius, 0);
        ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, cornerRadius);
        ctx.lineTo(canvasWidth, canvasHeight - cornerRadius);
        ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - cornerRadius, canvasHeight);
        ctx.lineTo(cornerRadius, canvasHeight);
        ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - cornerRadius);
        ctx.lineTo(0, cornerRadius);
        ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
        ctx.closePath();

        // 剪切圆角矩形区域
        ctx.clip();

        // 在圆角矩形内绘制并放大图片以填满900像素宽度
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        // 将画布内容保存为 PNG 格式，并覆盖原始图片
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);
      })
    }


  }


  // 创建一个头像生成函数
  //byGPT4
  async function createAvatar(ctx, url: string, nickname: string) {
    async function loadImageFromUrl(url: string) {
      console.log(url)
      const imageData = await ctx.http.get(url, { responseType: 'arraybuffer' });
      if (!imageData) {
        throw new Error('No image data');
      }
      const image = await ctx.canvas.loadImage(Buffer.from(imageData));
      return image;
    }
  
    const image = await loadImageFromUrl(url);
  


      // 计算画布的宽度和高度
      const canvasWidth = image.width + 800; // 额外的200像素用于显示昵称
      const canvasHeight = image.height;

      // 创建画布
      const canvas = ctx.canvas.createCanvas(canvasWidth, canvasHeight);
      const context = ctx.canvas.getContext('2d');

      // 设置背景颜色并填充整个画布
      context.fillStyle = color_di;
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      // 保存当前上下文状态
      context.save();

      // 创建圆形剪裁区域
      context.beginPath();
      context.arc(image.width / 2, image.height / 2,
        image.width / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();

      // 在画布上画出头像
      context.drawImage(image, 0, 0, image.width, image.height);

      // 恢复上下文状态
      context.restore();

      // 设置昵称的字体和颜色
      context.font = `bold 70px ${fonts}`; // 设置字体大小
      context.fillStyle = 'black'; // 设置字体颜色


      // 在头像右侧写出昵称
      const nicknameX = image.width + 30; // 昵称的x坐标（在头像右侧10像素的位置）
      const nicknameY = image.height / 3; // 昵称的y坐标（在头像垂直中心的位置）
      context.fillText(nickname, nicknameX, nicknameY);
      return canvas.toBuffer('image/jpeg');
    

  }

  //图片下载函数

  



  //图片保存函数
  async function saveImage(buffer: string | NodeJS.ArrayBufferView, path: fs.PathOrFileDescriptor) {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }




  async function loadImageFromUrl_1(url: string): Promise<Buffer> {
    const imageData = await ctx.http.get(url, { responseType: 'arraybuffer' });
    if (!imageData) {
      throw new Error('No image data');
    }
    // 直接返回 Buffer，不再调用 loadImage
    return Buffer.from(imageData);
  }

  // 定义 saveImage 函数
  async function saveImage_pro(imageElement: string, savePath: string): Promise<void> {
    const urlMatch = imageElement.match(/url="([^"]+)"/);
    const fileMatch = imageElement.match(/file="([^"]+)"/);

    if (!urlMatch || !fileMatch) {
      throw new Error('Invalid image element string');
    }

    const url = urlMatch[1];
    let fileName = fileMatch[1];

    // 清理文件名中的非法字符
    fileName = fileName.replace(/[<>:"\/\\|?*]+/g, '') + '.png';

    // 确保保存路径存在
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    try {
      const imageBuffer = await loadImageFromUrl_1(url);
      const filePath = path.join(savePath, fileName);
      fs.writeFileSync(filePath, imageBuffer);

    } catch (error) {

    }
  }

  // 示例用法
  // saveImage('<image ... />', '/path/to/save').then(() => console.log('Done'));



  var M = 0
  var wid: number

  //对话框创建函数
  //byGPT4
  function extendContext(context: CanvasRenderingContext2D) {
    context.constructor.prototype.roundRect = function (x: any, y: any, w: number, h: number, r: number) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    }
  }

  function getTextWidth(text: string,
    context: CanvasRenderingContext2D): number {
    return context.measureText(text).width;
  }

  async function renderTextToImage(
    text: string, color: string, randoms: number) {
    (ctx) => {
      M = 0//换行次数
      const fontSize = 70;//字体大小
      const lineHeight = fontSize * 1.3;//行距
      const maxLineWidth = 950;//最大宽度
      const padding = 25;//边框距离
      const margin = 0;

      const words = text.split('');
      const lines = [];
      let line = '';
      let lineWidth = 0;

      const tempCanvas = ctx.createCanvas(1, 1);
      const tempContext = tempCanvas.getContext('2d');
      tempContext.font = `bold ${fontSize}px ${fonts}`;

      for (const word of words) {
        const wordWidth = getTextWidth(word, tempContext);

        if (lineWidth + wordWidth > maxLineWidth && line !== '') {
          lines.push({ text: line, width: lineWidth });
          line = word;
          lineWidth = wordWidth;
          M++
        } else {
          line += word;
          lineWidth += wordWidth;
        }
      }
      lines.push({ text: line, width: lineWidth });

      const rectHeight = lines.length * lineHeight + 2 * padding;
      const rectWidth = Math.max(...lines.map(l => l.width)) + 2 * padding;

      const canvasWidth = rectWidth + 2 * margin;
      wid = canvasWidth
      const canvasHeight = rectHeight + 2 * margin;
      const canvas = ctx.createCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext('2d');
      extendContext(context);
      context.fillStyle = color_di;
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.font = `bold ${fontSize}px ${fonts}`;
      context.fillStyle = color;
      context.roundRect(margin, margin, rectWidth, rectHeight, 40);//最后一个是弧度
      context.fill();

      context.fillStyle = '#F0F0F0';

      let y = margin + padding + fontSize;
      for (const { text } of lines) {
        context.fillText(text, margin + padding, y);
        y += lineHeight;
      }

      const buffer = canvas.toBuffer('image/jpeg');
      fs.writeFileSync(path.join(__dirname +
        '../../../../data/momotalk-data' + '/momotalk' + text.substring(0, 10) + '_' + randoms + '.jpg'),
        buffer);
    }

  }



  //旁白创建函数
  //byGPT4

  function getTexchorus(text: string,
    context: CanvasRenderingContext2D): number {
    return context.measureText(text).width;
  }

  async function chorus_img(text: string, color: string) {
    M = 0; //重置换行次数
    const fontSize = 70; //字体大小
    const lineHeight = fontSize * 1.3; //行距
    const maxLineWidth = 1600; //最大宽度

    const words = text.split('');
    const lines = [];
    let line = '';
    let lineWidth = 0;

    const tempCanvas = createCanvas(1, 1);
    const tempContext = tempCanvas.getContext('2d');
    tempContext.font = `bold ${fontSize}px ${fonts}`;

    for (const word of words) {
      const wordWidth = getTextWidth(word, tempContext);
      if (lineWidth + wordWidth > maxLineWidth && line !== '') {
        lines.push({ text: line, width: lineWidth });
        line = word;
        lineWidth = wordWidth;

      } else {
        line += word;
        lineWidth += wordWidth;
        M++;
      }
    }
    lines.push({ text: line, width: lineWidth });

    const canvasHeight = lines.length * lineHeight;
    const canvasWidth = Math.max(...lines.map(l => l.width));
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');

    context.font = `bold ${fontSize}px ${fonts}`;
    context.fillStyle = color;
    context.textAlign = 'center'; // 设置文本居中

    let y = fontSize;
    for (const { text, width } of lines) {
      context.fillText(text, canvasWidth / 2, y); // 设置文本居中
      y += lineHeight;
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname +
      '../../../../data/momotalk-data' + '/mochorus.png'), buffer);
  }




  function writeJson0(filePath: string, content: any): void {
    let data: any[] = [];
    // 如果文件存在，读取文件内容
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent) {
        data = JSON.parse(fileContent);
      }
    }
    // 将新内容添加到数组中
    data.push(content);
    // 将数组转换为 JSON 格式并写入文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }


  // 创建并写入 JSON 文件的函数
  //byGPT4
  function in_json_stusay(filePath: string,
    content: any, timess: number): void {
    let data: any[] = [];
    // 如果文件存在，读取文件内容
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent) {
        data = JSON.parse(fileContent);
      }
    }
    // 找到 "say_student" 属性，并将新的内容添加到这个属性
    let status = false//🔴
    let timestamp = []//存储时间码

    for (let i = 0; i < data.length; i++) {

      if (data[i].hasOwnProperty('say_student')) {

        timestamp.push(data[i].say_student[0])

        if (timestamp.includes(timess)) {
          data[i].say_student = content.say_student
          status = false//🔴
        } else {
          status = true//🟢
        }

      } else {
        status = true//🟢
      }
    }
    if (status == true) {//在不存在时间码和数组的情况下，新建数组
      data.push(content);
      logger.info(`✅新建了时间戳⏰为：${timess}的对话记录`)
    }
    // 将数组转换为 JSON 格式并写入文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }



  /**
   * 递归地从 JSON 结构中获取指定属性的值。
   * @param filePath JSON 文件的路径。
   * @param obj 要获取的属性名称。
   * @returns 包含所有找到的属性值的数组。
   */
  function getjson(filePath: string, obj: string): any[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    let results: any[] = [];

    // 递归函数，用于深度搜索 JSON 数据
    function search(item: any) {
      if (Array.isArray(item)) {
        // 如果是数组，递归每个元素
        for (const element of item) {
          search(element);
        }
      } else if (item && typeof item === 'object') {
        // 如果是对象，检查是否有匹配的属性
        if (item.hasOwnProperty(obj)) {
          results.push(item[obj]);
        }
        // 递归对象的所有值
        for (const key of Object.keys(item)) {
          search(item[key]);
        }
      }
    }

    // 开始递归搜索
    search(data);
    return results;
  }



  //定义读取用户id的json文件路径的函数
  function jsonfpFun(userid: string) {
    const dirPath = path.join(__dirname, '../../../data/momotalk-data');
    const jsonpath = path.join(dirPath, `koharu-talk_data_${userid}.json`);//JSON文件的路径
    return jsonpath
  }


  function deleteFile(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }



  async function avatar_mix(imageUrl: string, nickname: string) {
    try {
      const avatar = await createAvatar(ctx,imageUrl, nickname);
      await saveImage(avatar,
        path.join(__dirname, '../../../data/momotalk-data/' + nickname + '.jpg'));
    } catch (error) {
      logger.error('Error creating avatar:', error);
    }
  }//头像生成函数调用函数



  //魔改苗✌的学生匹配算法函数
  function SANAE_MATCH_SYSTEM(message: string) {
    if (!message) {
      return "请输入查询角色名"
    } else {
      // 定义各种学生名字的接口
      interface StudentName {
        "Id": string;
        "Id_db": number;//对接schale.gg的id
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
      // 从文件中读取学生名
      const NameData: StudentName[] =
        require("./sanae_match_system/MatchLib.json") as StudentName[];
      // 调用匹配函数
      let studentMessage = MatchStudentName(message);
      // 如果没匹配到，可能是字符串过长，或是根本就不对的信息
      if (studentMessage.length == 0) {
        // 检测字符串长度是否过长
        if (message.length >= 6) {
          return `未匹配到“${message}”相关学生信息，请适当缩短输入或更换描述。`
        } else {
          return `未匹配到“${message}”相关学生信息，请适当增加准确情报或更换描述。`
        }
        // 匹配到了，则判断匹配到了几个
      } else if (studentMessage.length == 1) {
        // 匹配到1个结果直接输出,魔改后只返回id
        return (NameData[parseInt(studentMessage[0]) - 10000].Id_db)
      } else {
        // 匹配到多个结果输出全部（最多5个，由上到下概率降低，已经在匹配函数中做过处理，直接调用即可）
        let studentMatchResults: string[] = [`“${message}”匹配到了多个结果：\n`]
        for (let i = 0; i < studentMessage.length; i++) {
          studentMatchResults.push
            (NameData[parseInt(studentMessage[i]) - 10000].Name_zh_ft)
        }
        return studentMatchResults
      }
    }
  }


  ctx.command('talk')
    .alias('写文')
    .usage('使用指令后会在data文件夹创建json文件，并需要根据引导初始化角色')
    .action(async ({ session }) => {

      async function main() {
        try {
          await createDir(path.join(__dirname, '../../../data/momotalk-data'));
          console.log('Directory created successfully.');
        } catch (err) {
          console.error('An error occurred:', err);
        }
      }
      main();
      const jsonfp = jsonfpFun(session.userId)

      logger.info(`🍑🍑已创建文件：${jsonfp}`)
      writeJson0(jsonfp,
        {
          "author_id": session.userId,
          "guild_id": session.guildId
        },

      );//写入当前作者id

      await session.send("请输入要添加的对话角色数量（1-50）")
      let ii = await session.prompt(20000)
      var stuname: string
      let numb = parseInt(ii)//添加的学生数目

      await writeJson0(jsonfp, { "total_number_stu": numb });//写入总数

      if (numb > 50 || numb < 1) {
        return '学生数目输入有误'
      }

      let json: { no: number; stuname: any; }
      let jsons = []
      let all_stu = []
      let match_out
      let id: string
      let a = []
      for (let i = 0; i < numb; i++) {
        i + 1
        await session.send(`请添加第${i + 1}位角色`)
        stuname = (await session.prompt(20000))
        json =
        {
          no: i + 1,
          stuname: stuname
        }
        jsons.push(json)
        all_stu.push(stuname)
      }
      await session.send(`${numb}位角色创建成功，正在验证输入...`)
      for (let i = 0; i < all_stu.length; i++) {
        match_out = SANAE_MATCH_SYSTEM(all_stu[i])
        if (!Number.isFinite(match_out)) {
          a = []
          for (let ii = 1; ii < match_out.length; ii++) {
            a.push((ii + '. ') + match_out[ii] + '\n')
          }
          await session.send(`第${i + 1}位角色未成功验证，请输入编号以确认角色\n${a}`)
          id = (await session.prompt(20000))
          if (!name) return '等待输入超时,已经自动使用一号角色:' + match_out[1]
          jsons[i].stuname = match_out[Number(id)]
        }
      }
      try {
        writeJson0(jsonfp, jsons);
        session.send('成功写入')
      } catch (error) {
        session.send('爆!\n' + error)
      }

      if (!name) return '等待输入超时'
      //文本记录模块
    }
    )



  let no = 0
  let num: number
  let json: { say_student: any[]; }
  let o = [
    '切换',
    "换人",
    "切换角色",
    "换",
    "换学生",
    "更换",
    "更换角色",
    "更换学生",
  ]
  let save = [
    '保存',
    'save',
    "存储"
  ]
  let sensei = [
    'sensei',
    '老师',
    '先生',
    '玩家'
  ]


  //文本记录模块
  ctx.command('talk.start')
    .alias('开始写文')
    .usage('开始后将会持续监听用户在当前频道的发言\n' +
      '使用‘切换’切换已录入角色\n' +
      '在切换状态下发送‘老师’却换至老师\n' +
      '发送‘保存’保存会话\n' +
      '发送‘停止’保存并停止监听\n' +
      '(alpha-0)')
    .action(async ({ session }) => {
      if (session.platform === 'qq') {
        return '呜呜。暂不支持qq平台'
      }
      //声明布尔开关
      let tog_switch = false //🔴
      let student_talk_status = false//🔴
      let sensei_talk_status = false//🔴
      let all_stun_ame: string | any[]
      let user_id: any[]
      let guild_id: any[]
      //定义自动保存的频率
      num = config.reminders

      // 将当前日期转换为时间戳
      let timeStamp = Date.parse(new Date().toString());
      logger.info(`⏰当前时间戳⏲️：${timeStamp}`)

      const jsonfp = jsonfpFun(session.userId)

      tog_switch = true//可以更改对象🟢



      try {
        all_stun_ame = getjson(jsonfp, "stuname")//读取学生总名称
        user_id = getjson(jsonfp, "author_id")
        guild_id = getjson(jsonfp, "guild_id")
      } catch {
        return '出现错误：没有创建对话记录'
      }
      session.send('开始创作啦，sensei！请输入【对象】')


      let say_id = getjson(jsonfp, "say_student")

      logger.info(`👨‍💻作者id：${user_id}  💬🗨️群组id${guild_id}`)
      // 创建一个对象来存储每个用户的消息
      let messages = {}
      // 创建一个对象来存储每个用户的i值
      let iValues = {}

      let stuname: string
      //状态
      const MESSAGE_Log = ctx.middleware((session, next) => {
        if (session.userId === user_id[0]
          && session.guildId === guild_id[0]
        ) {
          //console.table(messages)        
          // 获取当前用户的发言数组，如果不存在则创建一个新的数组
          if (!messages[session.userId]) {
            messages[session.userId] = []
          }
          // 获取当前用户的i值，如果不存在则设置为0
          if (!iValues[session.userId]) {
            iValues[session.userId] = 0
          }
          // 使用当前用户的发言数组代替全局的messag数组
          let messag = messages[session.userId]
          let i = iValues[session.userId]

          if (save.includes(session.content)) {
            session.send('正在保存')
            json =
            {
              "say_student": [
                timeStamp,
                getjson(jsonfp, "stuname"),
                messag
              ]
            }
            in_json_stusay(jsonfp, json, timeStamp);
            i = 0
          } else if (session.content == '停止') {
            json =
            {
              "say_student": [
                timeStamp,
                getjson(jsonfp, "stuname"),
                messag
              ]
            }
            in_json_stusay(jsonfp, json, timeStamp);
            i = 0
            MESSAGE_Log()
            session.send('已停止并保存')
          } else {
            if (o.includes(session.content)) {
              tog_switch = true//🟢
              student_talk_status = false//🔴
              sensei_talk_status = false//🔴
              session.send('开始更改角色，请输入【对象】')
            }



            if (student_talk_status == true) {//记录学生对话
              no++
              messag.push({
                "say_number": no,
                "say_rolye": stuname,
                "say": (session.content)
              })
              i++
            }
            if (sensei_talk_status == true) {
              no++
              messag.push({
                "say_number": no,
                "say_rolye": "sensei",
                "say": (session.content)
              })
              i++
            }

            if ((all_stun_ame.includes(session.content))
              && tog_switch === true) {
              student_talk_status = true//🟢
              sensei_talk_status = false//🔴
              tog_switch = false//🔴
              session.send('正在记录' + session.content + '的对话')
              stuname = session.content
            }

            if (sensei.includes(session.content)
              && tog_switch === true) {
              sensei_talk_status = true//🟢
              student_talk_status = false//🔴
              tog_switch = false//🔴
              session.send('正在记录' + session.content + '的对话')
            }


            if (i == num) {
              session.send('正在保存')
              json =
              {
                "say_student": [
                  timeStamp,
                  getjson(jsonfp, "stuname"),
                  messag
                ]
              }
              in_json_stusay(jsonfp, json, timeStamp);
              i = 0
            }
          }
          iValues[session.userId] = i
        } else {
          return next()
        }
      })

    })


  ctx.command('talk.delet')
    .alias('删除记录')
    .action(async ({ session }) => {
      const jsonfp = jsonfpFun(session.userId)
      try {
        await deleteFile(jsonfp)
        await session.send('已删除' + jsonfp)
      } catch {
        await session.send('爆！文件可能已删除')
      }
    })






  ctx.command('合成对话', '渲染最终图片')
    .alias('渲染')
    .usage('用法：\n' +
      '渲染 角色 对话内容 对话内容 ...\n' +
      '当对话内容为“老师：”时切换至老师发言\n' +
      "对话内容可以是图片（有bug，之后修）\n" +
      "(alpha-0)")
    .action(async ({ session }, ...args) => {
      if (args[0] == null) {
        let jsfile: string
        let allsay: any[]
        let all_stun_ame: string | any[]
        try {
          jsfile = jsonfpFun(session.userId)
          allsay = getjson(jsfile, "say_student")
          all_stun_ame = getjson(jsfile, "stuname")//读取学生总名称
        } catch {
          return '未找到记录，请查看使用说明'
        }
        let say_stu: string[] = [];
        let says: string[] = []

        allsay.forEach(sayStudent => {
          sayStudent[2].forEach((sayItem: { say_rolye: string; say: string; }) => {
            if ('say_rolye' in sayItem) {
              say_stu.push(sayItem.say_rolye)
            }
            if ('say' in sayItem) {
              says.push(sayItem.say);
            }
          });
        });

        for (let i = 0; i < all_stun_ame.length; i++) {
          const id = SANAE_MATCH_SYSTEM(all_stun_ame[i])
          let src = url_alinclude + '/db_img/' + id + ".jpg"
          avatar_mix(src, all_stun_ame[i])
        }//创建头像

        const dir = path.join(__dirname,
          '../../../data/momotalk-data/');//文件夹路径
        //创建背景
        (says.length) * 325
        back_creat(2600, dir + 'amomo.jpg')

        let ran = []//芝士随机数
        let mi: number  //芝士换行
        let paths = []////把路径的后缀写入数组方便后面调用
        let all = []//全部图片
        let y = 40//芝士图片高度
        let names: string //用于处理同一角色多次发言的变量

        for (let i = 0; i < says.length; i++) {
          mi = 0
          ran.push(random.int(0, 100))
          if (say_stu[i] == "sensei") {
            renderTextToImage(says[i], "#4a8aca", ran[i]);
          } else {
            renderTextToImage(says[i], "#4c5b70", ran[i]);
          }
          mi = (M * 70)
          console.log('mi:' + mi)
          paths.push(says[i].substring(0, 10) + "_" + ran[i])

          if (say_stu[i] == "sensei") {
            if (M > 0) {
              wid = 800
            }
            all.push(
              {
                src: dir + 'momotalk' + paths[i] + '.jpg',
                x: 1070 - wid, y: y + 40, height: 115 + mi
              },
            )
            y += M * 70

          } else if (say_stu[i] == names) {
            all.push(
              {
                src: dir + 'momotalk' + paths[i] + '.jpg',
                x: 220, y: y, height: 115 + mi
              },
            )
            y += mi

          } else {
            y += 25
            all.push(
              {
                src: dir + say_stu[i] + '.jpg',
                x: 40, y: y == 65 ? y = 40 : y, height: 170
              },
              {
                src: dir + 'momotalk' + paths[i] + '.jpg',
                x: 220, y: y += 80, height: 115 + mi
              },
            )
            y += M * 70

          }

          names = say_stu[i]
          y += 128
        }


        //console.log(all)
        for (let i = 0; i < 1; i++) {
          await mergeImages(dir + 'amomo.jpg', all);
        }
        await session.send(<image url={pathToFileURL(resolve
          (__dirname, '../../../' + 'output.jpg'))} />)
      } else {






        /*                            _ooOoo_
         *                           o8888888o
         *                           88" . "88
         *                           (| -_- |)
         *                            O\ = /O
         *                        ____/`---'\____
         *                      .   ' \\| |// `.
         *                       / \\||| : |||// \
         *                     / _||||| -:- |||||- \
         *                       | | \\\ - /// | |
         *                     | \_| ''\---/'' | |
         *                      \ .-\__ `-` ___/-. /
         *                   ___`. .' /--.--\ `. . __
         *                ."" '< `.___\_<|>_/___.' >'"".
         *               | | : `- \`.;`\ _ /`;.`/ - ` : | |
         *                 \ \ `-. \_ __\ /__ _/ .-` / /
         *         ======`-.____`-.___\_____/___.-`____.-'======
         *                            `=---='
         *
        
         */


        //0.1.0-alpha版本




        //快捷渲染的体系
        //做一套不同的交互体系
        //声明屎多的变量
        //这些声明的变量没有准确的描述，等修/重构

        let mi: number//这个是控制对话换行的高度缩放
        let status_number: number = -1
        let allmess = []//这是最后递交给渲染函数的数组
        let hi = 120//初始高度
        let paths = []//这是记录路径的数组
        let rans: number[] = []//这是记录随机数的数组，随机数用来防止重名
        //let images = []
        let status: boolean
        let sensei_status = false

        let x: number = 0//记录出现渲染图图的情况的变量
        let s: number = 0//记录出现渲染老师对话的情况的变量
        let sss: number = 0//记录sensei对话出现的次数，以此来结束循环（beta）
        let fsen: number = 0
        let is = 0//在切换回学生对话需要加头像，这个是辅助path索引的数字

        let senseis = [//定义切换老师发言的数组
          'sensei:',
          '老师:',
          '玩家:',
          'sensei：',
          '老师：',
          "玩家："
        ]


        const id = SANAE_MATCH_SYSTEM(args[0])
        if (senseis.includes(args[0])) {
          return '未指定对话学生，请重新输入'
        }
        if (typeof id != 'number') {
          return '角色输入错误，请重新输入'
        }
        const dir = path.join(__dirname,
          '../../../data/momotalk-data/')//文件夹路径
        let src = url_alinclude + '/db_img/' + id + ".jpg"
        await avatar_mix(src, args[0])
        if (senseis.includes(args[1])) {
          hi = 40
        } else {
          allmess.push(
            {
              src: dir + args[0] + '.jpg',
              x: 40, y: 40, height: 170
            },
          )
        }





        console.log(args)
        console.log(args.length)
        for (let i = 1; i < args.length; i++) {

          rans.push(random.int(0, 500))
          rans.push(random.int(0, 500))








          if ((i + s) == args.length) {
            status_number = 4
          } else if (senseis.includes(args[i])) {
            if (/image file/.test(args[i + 1])) {
              fsen = 1
              status_number = 3
            } else {
              fsen = 1
              status_number = 2
            }
          } else if (/image file/.test(args[i + s])) {
            status_number = 1
          } else {
            status_number = 0
          }





          switch (status_number) {
            case 0: {//学生发言




              if (sensei_status == true) {
                is = 1
                allmess.push(
                  {
                    src: dir + args[0] + '.jpg',
                    x: 40, y: hi, height: 170
                  },
                )
                hi += 80
                sensei_status = false
              } else {
                // is = 0
              }


              console.log('渲染学生对话-----0')
              i += s
              renderTextToImage(args[i], "#4c5b70", rans[i]);//对话生成
              mi = (M * 70)

              console.log('i==0:' + i)

              paths.push(args[i].substring(0, 10) + "_" + rans[i])
              /*
              console.table('args i:' + args[i])
              */
              console.table(paths)
              allmess.push(
                {
                  src: dir + 'momotalk' + paths[i - 1 - is] + '.jpg',
                  x: 220, y: hi, height: 115 + mi
                },
              )
              console.table(allmess)
              hi += M * 70
              hi += 130
              s = 0
              x = 0
            }
              break













            case 1: {//学生发图/表情
              console.log('渲染学生发图-----1')
              i += s





              if (sensei_status == true) {
                is = 1
                allmess.push(
                  {
                    src: dir + args[0] + '.jpg',
                    x: 40, y: hi, height: 170
                  },
                )
                hi += 80
                sensei_status = false
              } else {
                // is = 0
              }



              await saveImage_pro(args[i], (dir)).then(() => console.log('下载成功'))
              let fileMatch = args[i].match(/file="([^"]+)"/);
              let fileName = fileMatch[1];
              // 清理文件名中的非法字符
              fileName = fileName.replace(/[<>:"\/\\|?*]+/g, '') + '.png';
              await create_user_Image(dir + fileName)

              allmess.push(
                {
                  src: dir + fileName,
                  x: 220, y: hi,
                },
              )
              hi += Math.ceil(img_1_height)
              hi += 10
              x++
              //占位，需注意
              paths.push('1')
              //占位，需注意
            }
              break











            case 2: //老师发言
              console.log('渲染老师发言----2')
              renderTextToImage(args[i + fsen], "#4a8aca", rans[i]);//对话生成
              paths.push(args[i + fsen].substring(0, 10) + '_' + rans[i])
              if (M > 0) {
                wid = 800
              }
              mi = (M * 70)
              console.log('i-sensei:' + i)
              allmess.push(
                {
                  src: dir + 'momotalk' + paths[i - 1] + '.jpg',
                  x: 1070 - wid, y: hi, height: 115 + mi
                },
              )

              hi += M * 70
              hi += 130
              s = 1
              sss++
              sensei_status = true
              break









            case 3: //老师发图

              //占位，需注意
              paths.push('1')
              //占位，需注意

              console.log('渲染老师发图----3')
              await saveImage_pro(args[i + fsen], (dir)).then(() => console.log('下载成功'))
              let fileMatch = args[i + fsen].match(/file="([^"]+)"/);
              let fileName = fileMatch[1];
              // 清理文件名中的非法字符
              fileName = fileName.replace(/[<>:"\/\\|?*]+/g, '') + '.png';
              await create_user_Image(dir + fileName)
              hi += 30
              allmess.push(
                {
                  src: dir + fileName,
                  x: 550, y: hi,
                },
              )

              hi += Math.ceil(img_1_height)
              hi -= 20
              s = 1
              x = 1
              sss++
              sensei_status = true
              break








            case 4:
              console.log('break-------4')
              break
          }


        }
        console.table(paths)
        console.table(allmess)
        //背景图创建函数
        //啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊太乱拉啊啊啊啊啊啊啊啊啊啊啊啊啊啊
        back_creat(hi, dir + `amomo_${hi}.jpg`)

        for (let i = 0; i <= 3; i++) {
          await mergeImages(dir + `amomo_${hi}.jpg`, allmess);
          if (i == 3) {
            status = true
          }
        }
        if (status == true) {
          await session.send(<image url={pathToFileURL(resolve
            (__dirname, '../../../' + 'output.jpg'))} />)
        }
      }

    })


}




//搓的最多的一集