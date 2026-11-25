# 七大发明 · VIBE 知识大赏

MotionHarness Standard 工程，1920 × 1080，30 fps，共 1594 帧，时长 53.133 秒。画面使用程序绘制的金属线稿和双栏知识卡，史料年份对应片中描述的公布、专利、实际应用或发射节点。器件图是示意绘制。

## 在 Studio 中编辑

在工程目录运行 `mh open .`。`src/timeline.js` 存放字卡文案和切点，`src/scene.js` 存放镜头动效，`src/lib/inventions.js` 存放七件发明的路径与生长参数。`mh.json` 指向已混好的 `assets/mix.wav`。

## 混音

成品混音已随工程保存。要重新混音，在工程目录运行 `python mix.py "原曲文件.mp3"`，需要 FFmpeg 和 NumPy。`python mix.py "原曲文件.mp3" --verify` 校验现有 WAV。原曲使用用户提供的文件。

片头扫描和前六件出场使用《七大奇迹》20 秒附近的碎裂闪击，按原工程的 `glitch`、`shatter`、`tick` 三层叠合。主标题和器名重拍只使用视频一同源的钟声轨 `bell-tone.wav`。钟声滤掉起音的细碎高频并保留短余韵，万维网出场通过提高同一钟声的音量形成最重一击。两套参考音效用项目内的独立素材重建。七个物件有各自的拟音：相机机械快门、电话双铃、白炽灯开关和电流、飞机螺旋桨、集装箱金属落扣、GPS 信号扫频、首台 Web 服务器的键击和短应答音。拟音跟随描边或屏幕亮起，和铭牌钟声及两声计时提示分开。[提示音](https://freesound.org/s/704134/) · [风切](https://freesound.org/s/449996/) · [金属撞击](https://freesound.org/s/523788/)

本轮交付先用 MotionHarness 渲染画面，再以 `ffmpeg -i 渲染版.mp4 -i assets/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -aac_coder fast -movflags +faststart 交付版.mp4` 封装已验收的音轨。

每件名牌的年份说明和第二条小字分别在右侧重拍后 8 帧、10 帧出现，跟随两声短计时提示。标题和展品背后的齿轮环按时间慢转，环缘光带延续原有章节配色。

## 主要卡点

| 章节 | 描边起点 | 名称重拍 |
| --- | ---: | ---: |
| 摄影术 | 00:05.433 | 00:07.233 |
| 电话 | 00:09.033 | 00:10.833 |
| 白炽灯 | 00:12.633 | 00:14.433 |
| 动力飞机 | 00:16.233 | 00:18.033 |
| 集装箱 | 00:19.833 | 00:21.633 |
| GPS | 00:23.433 | 00:25.233 |
| 万维网 | 00:41.433 | 00:41.433 |

主标题在 00:02.000，压轴铺垫从 00:27.033 开始，收尾卡在 00:50.433。原曲《霓虹兔 - Chaikovsky》的 01:31.640 映射到成片第 1243 帧（零起编号）对应的 00:41.433，NeXT 机箱轮廓在该帧入场。沿用国宝模板，原曲提速约 1.01%，每拍 0.450 秒。

## 画面史料

- **摄影术，1839。** 达盖尔公开的银版摄影法以感光的镀银铜板记录影像。[大英百科全书](https://www.britannica.com/technology/daguerreotype)
- **电话，1876。** 片中年份来自贝尔的美国专利，传声装置把人声转为电信号再还原。[美国专利 174,465](https://patents.google.com/patent/US174465A/en)
- **白炽灯，1880。** 爱迪生当年获颁的改进专利描述了装在抽真空玻璃泡内的碳丝。[美国国家档案馆](https://www.archives.gov/milestone-documents/thomas-edisons-patent-application-for-the-light-bulb)
- **动力飞机，1903。** 莱特飞行者号当日第一次飞行用时 12 秒，距离 120 英尺，约 36.6 米。[史密森尼航空航天博物馆](https://airandspace.si.edu/collection-objects/1903-wright-flyer/nasm_A19610048000)
- **集装箱，1956。** 理想 X 号执行首趟集装箱运输航次时载有 58 个集装箱，从纽瓦克开往休斯敦。[理想 X 号船史](https://en.wikipedia.org/wiki/SS_Ideal_X)
- **GPS，1978。** 首颗 GPS Block I 试验卫星升空。接收机根据多颗卫星信号的传播时间估算距离，求得位置并校正时钟。[Block I 卫星史](https://en.wikipedia.org/wiki/GPS_Block_I) · [美国联邦航空局原理说明](https://www.faa.gov/about/office_org/headquarters_offices/ato/service_units/techops/navservices/gnss/gps/howitworks)
- **万维网，1990。** 伯纳斯-李 1989 年写下超文本信息管理提案，1990 年底首台 Web 服务器和浏览器已在 CERN 的 NeXT 工作站上运行。[原始提案](https://www.w3.org/History/1989/proposal.html) · [W3C 大事记](https://www.w3.org/History.html) · [CERN 早期网页](https://info.cern.ch/hypertext/WWW/TheProject.html)
