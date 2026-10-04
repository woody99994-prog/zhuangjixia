// 全部文案与数据严格取自设计稿（装机匣 · 安卓 APP）

export const brandGradient = 'linear-gradient(135deg, #5CB0FF 0%, #1A70FC 100%)'

// 02 首页 — 四大快捷入口（配色由 CSS 的 tone 类控制，便于日/夜模式切换）
export const quickEntries = [
  { label: '精选配置', icon: 'chip', tone: 'blue' },
  { label: '装机学院', icon: 'book', tone: 'green' },
  { label: '配件对比', icon: 'swap', tone: 'amber' },
  { label: '功耗计算', icon: 'bolt', tone: 'purple' },
]

// 02 首页 — 为你推荐
export const recommended = [
  {
    title: '2K 电竞全能主机',
    tags: ['RTX 4070 SUPER', 'i5-14600KF'],
    price: '¥8,299',
    thumb: 'linear-gradient(135deg, #0D245C 0%, #2184F2 100%)',
  },
  {
    title: '纯白海景房 ITX',
    tags: ['RTX 5060 Ti', 'R5 9600X'],
    price: '¥6,199',
    thumb: 'linear-gradient(135deg, #EDF2F7 0%, #8C9EB8 100%)',
  },
  {
    title: '生产力多核工作站',
    tags: ['RTX 4070 Ti', 'i9-14900KF'],
    price: '¥12,899',
    thumb: 'linear-gradient(135deg, #241752 0%, #754EDB 100%)',
  },
]

// 02 首页 — 顶部轮播图（3 张，支持横滑 / 自动轮播）
export const banners = [
  {
    chip: '每日精选',
    title: 'RTX 5070 电竞整机上台',
    sub: '2K 高帧开黑 · 通宵不掉帧',
    gradient: 'linear-gradient(135deg, #0D245C 0%, #1476AD 55%, #2199FF 100%)',
  },
  {
    chip: '限时优惠',
    title: 'ITX 海景房整机直降 ¥800',
    sub: '小巧静音 · 桌面颜值担当',
    gradient: 'linear-gradient(135deg, #241752 0%, #5B3FB0 60%, #8B5CF6 100%)',
  },
  {
    chip: '新品首发',
    title: '生产力多核工作站开售',
    sub: '渲染剪辑不卡顿 · 效率拉满',
    gradient: 'linear-gradient(135deg, #0A3D2E 0%, #0E7A55 60%, #22C55E 100%)',
  },
]

// 03 AI 装机助手 — 方案明细
export const aiPlan = {
  title: 'AI 方案 · 2K 电竞主机',
  score: '性价比 96',
  rows: [
    { k: 'CPU', v: 'Intel Core i5-14600KF', p: '¥1,899' },
    { k: 'GPU', v: 'RTX 4070 SUPER 12G', p: '¥4,999' },
    { k: '主板', v: '微星 B760M 迫击炮 II', p: '¥1,099' },
  ],
}

// 04 广场 — 社区帖子（最新 / 热门 / 精选 三个列表页，共享同一套卡片样式）
export const postsLatest = [
  {
    name: '装机佬小王',
    time: '2 小时前',
    title: '2K 电竞海景房，颜值性能双在线',
    thumbText: '',
    tags: ['白色主题', 'ITX 机箱', '2K 165Hz'],
    meta: '326 赞 · 58 评论 · 12 收藏',
  },
  {
    name: '硬件猎人',
    time: '5 小时前',
    title: '万元整机电竞主机作业，跑分直接拉满',
    thumbText: '装机实拍图',
    tags: ['旗舰主机', 'ATX 大板', '4K 144Hz'],
    meta: '512 赞 · 93 评论 · 27 收藏',
  },
]

export const postsHot = [
  {
    name: '显卡研究所',
    time: '1 天前',
    title: 'RTX 5070 实测：2K 通杀，温度还低',
    thumbText: '跑分截图',
    tags: ['RTX 5070', '跑分', '2K 游戏'],
    meta: '2.4k 赞 · 318 评论 · 156 收藏',
  },
  {
    name: '装机日记',
    time: '1 天前',
    title: '万元预算 AMD 全家桶，香到离谱',
    thumbText: '整机展示',
    tags: ['AMD', '性价比', 'RGB 灯效'],
    meta: '1.2k 赞 · 210 评论 · 88 收藏',
  },
  {
    name: '老白的机箱',
    time: '2 天前',
    title: '纯白海景房走线教程，新手秒懂',
    thumbText: '',
    tags: ['走线教学', '小白向', '海景房'],
    meta: '932 赞 · 145 评论 · 64 收藏',
  },
]

export const postsEssence = [
  {
    name: '装机佬小王',
    time: '3 天前',
    title: '从零装机保姆级教程（建议收藏）',
    thumbText: '教程长图',
    tags: ['装机教程', '收藏', '从零开始'],
    meta: '3.6k 赞 · 402 评论 · 1.1k 收藏',
  },
  {
    name: '硬件猎人',
    time: '1 周前',
    title: '十年装机老炮的配件避坑清单',
    thumbText: '',
    tags: ['避坑', '经验分享', '清单'],
    meta: '2.8k 赞 · 256 评论 · 980 收藏',
  },
  {
    name: '装机日记',
    time: '1 周前',
    title: '高端主机散热方案横向评测',
    thumbText: '评测数据',
    tags: ['散热', '横向评测', '数据'],
    meta: '1.9k 赞 · 188 评论 · 720 收藏',
  },
]

// 05 我的配置 — 已保存配置
export const myConfigs = [
  {
    title: '2K 电竞全能主机',
    spec: 'i5-14600KF · RTX 4070 SUPER · 32G',
    price: '¥8,299',
    tag: '游戏主机',
  },
  {
    title: '纯白海景房 ITX',
    spec: 'i7-14700K · RTX 4060 · 16G',
    price: '¥6,199',
    tag: '小型化',
  },
  {
    title: '生产力多核工作站',
    spec: 'R9-7950X · RTX 4080 · 64G',
    price: '¥12,899',
    tag: '生产力',
  },
]

// 06 我的 — 个人卡 / 数据 / 功能菜单
export const profileHero = {
  name: 'Knight_玩家',
  verified: '认证玩家',
  meta: '玩家ID_9527 · 装机 2 年 · 已收藏 36 套方案',
}

export const profileStats = [
  { value: '128', label: '关注' },
  { value: '2.3k', label: '粉丝' },
  { value: '18.6k', label: '获赞' },
]

// 两组功能列表：tone 决定图标底色（由 CSS 控制，支持暗色模式）
// 顺序按用户要求调整：消息中心上移到「我的收藏」之上；末尾新增「关于我们」
export const profileGroups = [
  [
    { label: '消息中心', icon: 'bell', tone: 'blue', key: 'messages' },
    { label: '我的收藏', icon: 'star', tone: 'orange', key: 'favorites' },
    { label: '我的发布', icon: 'pencil', tone: 'indigo', key: 'posts' },
    { label: '浏览足迹', icon: 'history', tone: 'green', key: 'history' },
    { label: '我的积分', icon: 'coin', tone: 'amber', key: 'points' },
  ],
  [
    // 收货地址、账号与安全都收进「应用设置」，这里只留一个入口
    { label: '应用设置', icon: 'settings', tone: 'purple', key: 'settings' },
    { label: '关于我们', icon: 'info', tone: 'gray', key: 'about' },
  ],
]

// 配置表的 11 个固定槽位（新建 / 编辑配置共用）
// category 对应后端 hardwarePart.category，用于下拉拉取可选硬件
// cn 为中文名（展示用，icon 为槽位小图标 key，对应 Icons.jsx 的 SLOT_ICON_MAP）
export const CONFIG_SLOTS = [
  { key: 'cpu', label: 'CPU', cn: '处理器', category: 'cpu' },
  { key: 'mainboard', label: '主板', cn: '主板', category: 'mainboard' },
  { key: 'gpu', label: '显卡', cn: '显卡', category: 'gpu' },
  { key: 'ram', label: '内存', cn: '内存', category: 'ram' },
  { key: 'storage', label: '硬盘', cn: '硬盘', category: 'storage' },
  { key: 'psu', label: '电源', cn: '电源', category: 'psu' },
  { key: 'cooler', label: '散热', cn: '散热', category: 'cooler' },
  { key: 'case', label: '机箱', cn: '机箱', category: 'case' },
  { key: 'monitor', label: '显示器', cn: '显示器', category: 'monitor' },
  { key: 'peripheral', label: '外设', cn: '外设', category: 'peripheral' },
  { key: 'accessory', label: '配件', cn: '配件', category: 'accessory' },
]

// App 版本号（「关于我们」弹层展示）
export const APP_VERSION = '1.0.0'

// 「编辑资料」省份下拉（省级行政区）
export const PROVINCES = [
  '北京市',
  '天津市',
  '上海市',
  '重庆市',
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',
  '广西壮族自治区',
  '内蒙古自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
  '中国香港',
  '中国澳门',
  '中国台湾',
]
export const APP_BUILD = '2026.09.21'

// 「我的」页 / 他人主页 个人卡背景（与后端 UserProfile.heroBg 的索引一一对应）
// 0..4 为纯色渐变，5..9 为风景照片；background 简写对两者都适用，故可混用同一数组
export const HERO_BGS = [
  'linear-gradient(160deg, #0A0D2A 0%, #171B57 46%, #2C1C66 100%)',
  'linear-gradient(160deg, #04202E 0%, #0A4C63 52%, #0E7490 100%)',
  'linear-gradient(160deg, #2A0A2E 0%, #57123F 52%, #8B1D5B 100%)',
  'linear-gradient(160deg, #1C1206 0%, #4A2C0B 52%, #8A5A12 100%)',
  'linear-gradient(160deg, #0C1A0A 0%, #1D4A14 52%, #2E7D32 100%)',
  // 照片层之上叠一层压暗渐变（background 多层时写在前面即位于顶层），保证白字可读
  "linear-gradient(180deg, rgba(6,12,30,0.28) 0%, rgba(6,12,30,0.62) 100%), url('https://picsum.photos/id/1018/1200/600') center/cover no-repeat",
  "linear-gradient(180deg, rgba(6,12,30,0.28) 0%, rgba(6,12,30,0.62) 100%), url('https://picsum.photos/id/1015/1200/600') center/cover no-repeat",
  "linear-gradient(180deg, rgba(6,12,30,0.28) 0%, rgba(6,12,30,0.62) 100%), url('https://picsum.photos/id/1039/1200/600') center/cover no-repeat",
  "linear-gradient(180deg, rgba(6,12,30,0.28) 0%, rgba(6,12,30,0.62) 100%), url('https://picsum.photos/id/1043/1200/600') center/cover no-repeat",
  "linear-gradient(180deg, rgba(6,12,30,0.28) 0%, rgba(6,12,30,0.62) 100%), url('https://picsum.photos/id/1016/1200/600') center/cover no-repeat",
]

/* ============================================================
   07 首页四快捷入口 → 独立子页（统一风格、底部带导航）
   每个 kind: chip(精选配置) / book(装机学院) / swap(配件对比) / bolt(功耗计算)
   ============================================================ */

// 07-1 精选配置 — 整机商品网格（含详情页所需的 desc / score / highlights / specs）
export const entryConfigs = [
  {
    title: '2K 电竞全能主机',
    tags: ['RTX 4070 SUPER', 'i5-14600KF'],
    price: '¥8,299',
    thumb: 'linear-gradient(135deg,#0D245C 0%,#2184F2 100%)',
    desc: '2K 高刷游戏通吃 · 预算友好的全能之选',
    score: '性价比 96',
    highlights: ['2K 165Hz', '整机三年保', '免费点亮'],
    specs: [
      { k: 'CPU', v: 'Intel Core i5-14600KF', p: '¥1,899' },
      { k: '显卡', v: 'RTX 4070 SUPER 12G', p: '¥4,999' },
      { k: '主板', v: '微星 B760M 迫击炮 II', p: '¥1,099' },
      { k: '内存', v: '32G DDR5 6000', p: '¥599' },
      { k: '硬盘', v: '1TB PCIe4.0 NVMe', p: '¥399' },
      { k: '电源', v: '长城 650W 金牌', p: '¥299' },
      { k: '机箱', v: '爱国者 海景房', p: '¥299' },
    ],
  },
  {
    title: '纯白海景房 ITX',
    tags: ['RTX 5060 Ti', 'R5 9600X'],
    price: '¥6,199',
    thumb: 'linear-gradient(135deg,#EDF2F7 0%,#8C9EB8 100%)',
    desc: '纯白主题桌面颜值担当 · 小巧不占空间',
    score: '颜控首选',
    highlights: ['纯白主题', 'ITX 小巧', 'ARGB 灯效'],
    specs: [
      { k: 'CPU', v: 'AMD R5 9600X', p: '¥1,599' },
      { k: '显卡', v: 'RTX 5060 Ti 16G', p: '¥3,299' },
      { k: '主板', v: '华硕 B650E-I mini', p: '¥1,699' },
      { k: '内存', v: '32G DDR5 白色', p: '¥649' },
      { k: '硬盘', v: '2TB NVMe', p: '¥699' },
      { k: '电源', v: '全汉 750W SFX', p: '¥599' },
      { k: '机箱', v: '乔思伯 D31 白', p: '¥459' },
    ],
  },
  {
    title: '生产力多核工作站',
    tags: ['RTX 4070 Ti', 'i9-14900KF'],
    price: '¥12,899',
    thumb: 'linear-gradient(135deg,#241752 0%,#754EDB 100%)',
    desc: '渲染剪辑不卡顿 · 效率直接拉满',
    score: '性能旗舰',
    highlights: ['多核渲染', '64G 大内存', '静音散热'],
    specs: [
      { k: 'CPU', v: 'i9-14900KF', p: '¥3,999' },
      { k: '显卡', v: 'RTX 4070 Ti 16G', p: '¥6,299' },
      { k: '主板', v: '微星 Z790 暗黑', p: '¥2,499' },
      { k: '内存', v: '64G DDR5', p: '¥1,199' },
      { k: '硬盘', v: '2TB NVMe', p: '¥699' },
      { k: '电源', v: '振华 1000W', p: '¥899' },
      { k: '机箱', v: '联力 全塔', p: '¥699' },
    ],
  },
  {
    title: '千元入门办公机',
    tags: ['核显', 'i3-14100'],
    price: '¥2,499',
    thumb: 'linear-gradient(135deg,#0A3D2E 0%,#22C55E 100%)',
    desc: '日常办公影音 · 极致性价比的入门之选',
    score: '入门首选',
    highlights: ['核显办公', '低功耗', '静音'],
    specs: [
      { k: 'CPU', v: 'i3-14100', p: '¥749' },
      { k: '显卡', v: '核显 UHD 730', p: '¥0' },
      { k: '主板', v: '华擎 H610M', p: '¥499' },
      { k: '内存', v: '16G DDR4', p: '¥249' },
      { k: '硬盘', v: '512GB NVMe', p: '¥229' },
      { k: '电源', v: '航嘉 300W', p: '¥159' },
      { k: '机箱', v: '先马 办公', p: '¥129' },
    ],
  },
  {
    title: 'ITX 迷你游戏盒',
    tags: ['RTX 4060', 'R5 7500F'],
    price: '¥5,399',
    thumb: 'linear-gradient(135deg,#5B3FB0 0%,#8B5CF6 100%)',
    desc: '小钢炮游戏机 · 桌面即战力',
    score: '小钢炮',
    highlights: ['ITX 迷你', 'RTX 4060', '即插即用'],
    specs: [
      { k: 'CPU', v: 'R5 7500F', p: '¥999' },
      { k: '显卡', v: 'RTX 4060 8G', p: '¥2,399' },
      { k: '主板', v: '技嘉 B650I', p: '¥1,499' },
      { k: '内存', v: '16G DDR5', p: '¥349' },
      { k: '硬盘', v: '1TB NVMe', p: '¥399' },
      { k: '电源', v: '全汉 550W SFX', p: '¥499' },
      { k: '机箱', v: '闪鳞 S400', p: '¥399' },
    ],
  },
  {
    title: '静音渲染主机',
    tags: ['RTX 4080', 'R9-7950X'],
    price: '¥15,699',
    thumb: 'linear-gradient(135deg,#1476AD 0%,#2199FF 100%)',
    desc: '低噪满载 · 专业渲染与建模之选',
    score: '静音旗舰',
    highlights: ['360 水冷', '静音机箱', '多核'],
    specs: [
      { k: 'CPU', v: 'R9-7950X', p: '¥3,799' },
      { k: '显卡', v: 'RTX 4080 16G', p: '¥8,499' },
      { k: '主板', v: '华硕 X670E', p: '¥3,299' },
      { k: '内存', v: '64G DDR5', p: '¥1,199' },
      { k: '硬盘', v: '2TB NVMe', p: '¥699' },
      { k: '电源', v: '海韵 1000W', p: '¥999' },
      { k: '机箱', v: '德商静音箱', p: '¥799' },
    ],
  },
]

// 07-2 装机学院 — 教程课程列表（含可展开正文 body）
export const entryCourses = [
  { title: '从零开始装一台电脑', level: '入门', time: '12 分钟', tag: '装机流程', tone: 'blue', body: '从选件清单到点亮开机，手把手带你完成第一台主机的组装，小白也能一次成功。' },
  { title: '机箱走线美学教学', level: '入门', time: '9 分钟', tag: '海景房', tone: 'green', body: '教你背线、理线与隐藏供电，打造干净通透的海景房视觉效果，颜值与散热兼得。' },
  { title: 'BIOS 设置与首次点亮', level: '进阶', time: '15 分钟', tag: '调试', tone: 'amber', body: '讲解 BIOS 基础设置、XMP 开启与首次点亮排错，避免黑屏踩坑。' },
  { title: '内存超频实战', level: '进阶', time: '18 分钟', tag: '性能', tone: 'purple', body: '用 XMP/EXPO 与手动时序把内存性能拉满，并附上稳定测试的关键要点。' },
  { title: '水冷安装避坑指南', level: '精通', time: '22 分钟', tag: '散热', tone: 'blue', body: '一体式水冷的安装位、扣具与排泡技巧，新手最容易忽略的细节都在这里。' },
  { title: '整机稳定性压力测试', level: '进阶', time: '14 分钟', tag: '质检', tone: 'green', body: '用 AIDA64、FurMark 等工具做满载拷机，确认散热与供电稳如老狗。' },
]

// 07-3 配件对比 — 分类对比数据（row = 指标，best = 该行更优的配件名）
export const compareData = {
  gpu: {
    label: '显卡',
    rows: ['显存', '功耗', '游戏跑分', '参考价'],
    items: {
      'RTX 4070 SUPER': ['12G', '220W', '92', '¥4,999'],
      'RTX 4070 Ti': ['12G', '285W', '98', '¥6,299'],
      'RX 7800 XT': ['16G', '263W', '90', '¥4,299'],
    },
    best: { 显存: 'RX 7800 XT', 功耗: 'RTX 4070 SUPER', 游戏跑分: 'RTX 4070 Ti', 参考价: 'RX 7800 XT' },
  },
  cpu: {
    label: 'CPU',
    rows: ['核心线程', '功耗', '综合跑分', '参考价'],
    items: {
      'i5-14600KF': ['14 核 20 线程', '181W', '88', '¥1,899'],
      'i9-14900KF': ['24 核 32 线程', '253W', '99', '¥3,999'],
      'R7-7800X3D': ['8 核 16 线程', '120W', '94', '¥2,699'],
    },
    best: { 核心线程: 'i9-14900KF', 功耗: 'R7-7800X3D', 综合跑分: 'i9-14900KF', 参考价: 'i5-14600KF' },
  },
  mb: {
    label: '主板',
    rows: ['板型', '供电', '扩展', '参考价'],
    items: {
      'B760M 迫击炮': ['M-ATX', '12 相', '中', '¥1,099'],
      'Z790 暗黑': ['ATX', '20 相', '高', '¥2,499'],
      'X670E 太极': ['ATX', '24 相', '高', '¥3,299'],
    },
    best: { 板型: 'Z790 暗黑', 供电: 'X670E 太极', 扩展: 'Z790 暗黑', 参考价: 'B760M 迫击炮' },
  },
}

// 07-4 功耗计算 — 各部件可选型号与典型功耗(W)
export const psuParts = [
  { key: 'CPU', options: [{ name: 'i5-14600KF', w: 181 }, { name: 'i9-14900KF', w: 253 }, { name: 'R7-7800X3D', w: 120 }] },
  { key: '显卡', options: [{ name: 'RTX 4070 SUPER', w: 220 }, { name: 'RTX 4080', w: 320 }, { name: '核显 UHD', w: 35 }] },
  { key: '主板', options: [{ name: 'B760M', w: 45 }, { name: 'Z790', w: 60 }, { name: 'X670E', w: 55 }] },
  { key: '内存', options: [{ name: '16G DDR5', w: 12 }, { name: '32G DDR5', w: 18 }, { name: '64G DDR5', w: 28 }] },
  { key: '硬盘', options: [{ name: '1TB NVMe', w: 8 }, { name: '2TB NVMe', w: 10 }] },
  { key: '散热', options: [{ name: '单塔风冷', w: 6 }, { name: '240 水冷', w: 10 }, { name: '360 水冷', w: 15 }] },
  { key: '外设/余量', options: [{ name: '基础外设', w: 30 }, { name: 'RGB 满载', w: 60 }] },
]

// 四页元信息（标题 / 描述 / 配色 tone）
export const quickEntryMeta = {
  chip: { title: '精选配置', desc: '编辑精选 · 高性价比整机方案', tone: 'blue', icon: 'chip' },
  book: { title: '装机学院', desc: '从零到精通 · 装机教程合集', tone: 'green', icon: 'book' },
  swap: { title: '配件对比', desc: '两款配件并排比 · 参数一目了然', tone: 'amber', icon: 'swap' },
  bolt: { title: '功耗计算', desc: '估算整机功耗 · 推荐电源瓦数', tone: 'purple', icon: 'bolt' },
}

/* ============================================================
   08 协议文档 — 登录页底部《用户协议》/《隐私政策》独立页（共用一套排版模板）
   关键处用 ** 标记加粗；section 可含 p（段落）或 list（条目）
   ============================================================ */
export const legalDocs = {
  user: {
    key: 'user',
    title: '用户协议',
    updated: '最后更新：2026 年 9 月 1 日',
    intro:
      '欢迎使用装机匣（以下简称“本应用”）。在使用本应用前，请您务必仔细阅读并充分理解本协议的全部内容。',
    sections: [
      {
        h: '一、服务条款',
        p: '本应用为 PC 玩家提供整机配置推荐、装机教程与社区交流服务。您确认已年满 **18 周岁**，或已获得监护人同意。',
      },
      {
        h: '二、账号注册',
        p: '您需使用 **真实手机号** 完成注册，并保证所填信息真实、准确、完整。请妥善保管您的账号与密码，因保管不善造成的损失由您自行承担。',
      },
      {
        h: '三、使用规范',
        list: [
          '禁止发布 **违法、色情、暴力** 等不良内容',
          '不得利用平台从事 **商业欺诈** 或刷量行为',
          '尊重他人知识产权，转载须获得授权',
        ],
      },
      {
        h: '四、知识产权',
        p: '平台内的配置方案、教程图文、视频等内容，其著作权归 **装机匣及相应原作者** 所有，未经许可不得转载或商用。',
      },
      {
        h: '五、责任声明',
        p: '配置方案仅为参考建议，**实际组装、使用过程中的风险由用户自行承担**。因硬件兼容性、操作失误导致的损失，平台不承担责任。',
      },
      {
        h: '六、协议变更',
        p: '我们保留 **随时修订** 本协议的权利，修订内容将于平台公示后生效。如您继续使用本应用，视为接受修订后的协议。',
      },
    ],
  },
  privacy: {
    key: 'privacy',
    title: '隐私政策',
    updated: '最后更新：2026 年 9 月 1 日',
    intro: '装机匣高度重视您的个人信息保护。本政策说明我们如何收集、使用、存储与共享您的个人信息。',
    sections: [
      {
        h: '一、我们收集的信息',
        list: [
          '**手机号**：用于账号注册与登录',
          '**设备信息**：用于服务优化与风控',
          '**浏览与发布记录**：用于个性化推荐',
        ],
      },
      {
        h: '二、信息的使用',
        list: ['提供登录、配置推荐等核心服务', '进行 **个性化内容推荐**', '保障账号安全与风控'],
      },
      {
        h: '三、信息的存储',
        p: '我们采用 **加密存储** 与传输措施保护您的个人信息，保存期限不超过 **实现服务目的所必需** 的时间。',
      },
      {
        h: '四、信息的共享',
        p: '我们 **不会向第三方出售** 您的个人信息。仅在依法配合监管、或经您明确授权时，方会对外提供。',
      },
      {
        h: '五、您的权利',
        p: '您有权 **查询、更正、删除** 自己的个人信息，并可随时申请注销账号。注销后我们将删除或匿名化处理您的数据。',
      },
      {
        h: '六、联系我们',
        p: '如对本政策有任何疑问，可发送至 **privacy@zhuangji.com**，我们将在 15 个工作日内回复。',
      },
    ],
  },
}
