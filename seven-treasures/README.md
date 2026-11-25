# 七大国宝

MotionHarness Standard 工程，1920×1080，30 fps，约 53.13 秒。打开工作区中的 `guobao-mh`，或运行 `mh open guobao-mh --browser` 进入 Studio。

## 剪辑和音画同步

开场沿用原有扫描与落字方式。主体按参考帧点依次切换引文、器名、印章与英文小字。前六件的名称均在进入镜头 1.8 秒后落下。

| 开始描边 | 名称重拍 | 文物 |
| --- | --- | --- |
| 00:05.433 | 00:07.233 | 何尊 |
| 00:09.033 | 00:10.833 | 越王勾践剑 |
| 00:12.633 | 00:14.433 | 鎏金舞马衔杯纹银壶 |
| 00:16.233 | 00:18.033 | 清明上河图 |
| 00:19.833 | 00:21.633 | 太阳神鸟金饰 |
| 00:23.433 | 00:25.233 | 曾侯乙尊盘 |
| 00:41.433 | 00:41.433 | 大盂鼎 |

主标题在 00:02.000 落字，开头延长 0.2 秒。大盂鼎从 00:27.033 铺垫，00:41.433 亮相，对齐原曲 01:31.640。为匹配参考片每 1.8 秒的四拍节奏，原曲播放速度提高约 1.01%。

`src/timeline.js` 保存文案、场景颜色和卡点。`src/lib/artifacts.js` 保存依据文物形制绘制的示意轮廓。`assets/mix.wav` 是配乐和音效的成品混音。改节奏时同步更新 `assets/sync.json`，然后用 `python mix.py "原曲文件.mp3"` 更新混音。

## 音效来源

- 主标题和片尾使用 `复刻-重击-颗粒版-带尾.wav`。七件文物的器名重击使用 `assets/sfx/khufu-impact.wav`，取自 `seven-wonders/七大奇迹-纯音效版.mp4` 的 39.820–40.540 秒。原工程撞点为 40.000 秒，独立主撞击层见 `seven-wonders/assets/sfx/impact.wav`。大盂鼎在同一音效上提高增益并叠入短低频。
- 压轴短语使用单独制作的动画落字音。

- 清脆提示音，Freesound CC0。[Beep Sound](https://freesound.org/s/704134/)
- 短风切，Freesound CC0。[Whoosh Short Mid](https://freesound.org/s/449996/)
- 金属撞击，Freesound CC0。[Metal Impact](https://freesound.org/s/523788/)
- 低频重击由 XSXB-Band 用大鼓、定音鼓、808 和低音提琴采样渲染。转场鼓击配方见 `assets/sfx/drum-score.json`。

## 文物资料

- 何尊。 [宝鸡青铜器博物院](https://www.bjqtm.com/gzzx/gnyw/%E4%BD%95%E5%B0%8A%EF%BC%9A%E7%A9%BF%E8%B6%8A%E5%8D%83%E5%B9%B4%E7%9A%84%E4%B8%AD%E5%9B%BD%E4%B9%8B%E6%BA%90)
- 越王勾践剑。 [湖北省博物馆](https://www.hbww.org.cn/zgzb/p/4694.html)
- 鎏金舞马衔杯纹银壶。 [陕西历史博物馆](https://www.sxhm.com/collections/detail/469.html)
- 清明上河图。 [故宫博物院](https://www.dpm.org.cn/collection/paint/228226.html)
- 太阳神鸟金饰。 [成都金沙遗址博物馆](https://www.jinshasitemuseum.com/seardetail/681)
- 曾侯乙尊盘。 [湖北省博物馆](https://www.hbww.org.cn/zgzb/p/6911.html)
- 大盂鼎。 [中国国家博物馆](https://www.chnmuseum.cn/zp/zpml/csp/202008/t20200826_247375.shtml)
