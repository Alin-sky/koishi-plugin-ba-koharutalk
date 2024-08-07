# koishi-plugin-ba-koharu-talk

[![npm](https://img.shields.io/npm/v/koishi-plugin-ba-koharu-talk?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-ba-koharu-talk)


# koishi-plugin-ba-koharutalk


### koharu-talk-v0.3-rc

## 🌈使用方法：

##### talk [对话对象] [正文1 正文2 正文3...] [选项]

###### ◻️正文之间使用空格来分隔

### 参数介绍：

#### 对话对象：
- 需输入学生名
- 当输入 me= 时，会使用指令调用者的头像
- 当@群成员时，会使用该群成员的头像和昵称（beta）
#### 正文：
- 对话内容，使用空格来分隔，每个正文会生成对话气泡
- 当正文内容为 s=[文本] 时，会生成老师的消息气泡
- 当正文内容为 a=[文本] 时，会生成旁白的气泡
- 当正文内容为 =img 时，会在这个=img的位置占位一张图片
选项
- -f 当带有“-f”选项时，会在对话尾部生成进入羁绊剧情的气泡
- -n [自定义昵称] 当带有“-n”选项时，会将-n后面的文字作为自定义昵称。注意：-n后面需要带上空格

#### 各种功能使用示例：

- 1.常规方法
  - talk 小春 呜呜 老师好 我来补习了

- 2.生成老师的对话
  - talk 爱丽丝 邦邦咔邦！ 老师早上好 s=早上好，爱丽丝

- 3.生成旁白
  - talk 白子 a=白子兴奋地来到了夏莱办公室 老师。现在要不要一起去骑行？

- 4.自定义昵称
  - talk 小春 呜呜呜呜 怎么还是不及格... -n 小笨春

- 5.使用指令触发者的头像和昵称
  - talk =me 啊哈哈

- 6.进入羁绊剧情
  - talk 若藻 呼呼呼呼 老师 你逃不掉的❤ -f

- 7.输入图片
  - talk 柚子 =img 老师，这么快就要用我送您的劵吗 s=打大蛇能全暴击吗
  - “=img”的位置会预留一个图片，后继需要根据引导发送图片


- 8.切换对话对象
  - talk 小绿 能陪我去买点东西吗 老师❤ s=好...好的 stu=小桃 老师怎么还不来打游戏 小绿怎么也不在 苦呀西~！  
  - “stu=[角色]” 会切换默认对话的角色
      反馈：2609631906@qq.com


## ❤️支持

#### [爱发电，感谢所有赞助咪😽](https://afdian.net/a/alin-sky)

---

## 📃更新日志

### 0.3.0-rc.x
- 修复已知bug
- 增加了“stu=”切换对话学生功能

### 0.3.0-beta.x
- 修复若干bug
- 增加了一部分卫星角色
- 增加了说明图
- 优化审核系统

### 0.3.0-aplha.x
- 更换了资源服务器，优化、修改了渲染的方法
- 适配了官方bot
- 修改了发图方法
- 增加了旁白气泡
- 修复了从老师对话切回来头像缺失的问题

### 0.2.0-aplha.x
- 基于koishi-canvas全面重构

### 0.1.0
- 基于canvas的跑不了
