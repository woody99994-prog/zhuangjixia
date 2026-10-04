import { useState, useEffect } from 'react'
import StatusBar from './components/StatusBar.jsx'
import TabBar from './components/TabBar.jsx'
import Login from './screens/Login.jsx'
import Home from './screens/Home.jsx'
import AIBuild from './screens/AIBuild.jsx'
import Square from './screens/Square.jsx'
import MyConfigs from './screens/MyConfigs.jsx'
import Profile from './screens/Profile.jsx'
import QuickEntry from './screens/QuickEntry.jsx'
import ProductDetail from './screens/ProductDetail.jsx'
import LegalDoc from './screens/LegalDoc.jsx'
import ArticleDetail from './screens/ArticleDetail.jsx'
import Search from './screens/Search.jsx'
import Messages from './screens/Messages.jsx'
import Favorites from './screens/Favorites.jsx'
import MyPosts from './screens/MyPosts.jsx'
import BrowseHistory from './screens/BrowseHistory.jsx'
import MyPoints from './screens/MyPoints.jsx'
import RedeemMall from './screens/RedeemMall.jsx'
import RedeemDetail from './screens/RedeemDetail.jsx'
import RedeemCheckout from './screens/RedeemCheckout.jsx'
import MyRedeemOrders from './screens/MyRedeemOrders.jsx'
import MyAddresses from './screens/MyAddresses.jsx'
import UserProfile from './screens/UserProfile.jsx'
import AccountSecurity from './screens/AccountSecurity.jsx'
import Settings from './screens/Settings.jsx'
import EditProfile from './screens/EditProfile.jsx'
import AboutSheet from './screens/AboutSheet.jsx'
import { App as CapApp } from '@capacitor/app'
import { api, getToken, clearAuth, IS_NATIVE } from './apiClient.js'
import { useFavorites } from './useFavorites.js'
import './styles.css'

// 5 个带底部胶囊导航的 Tab 屏
const TABBED = {
  home: Home,
  square: Square,
  ai: AIBuild,
  config: MyConfigs,
  profile: Profile,
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!getToken())
  const [activeTab, setActiveTab] = useState('home')
  // 首页四快捷入口的独立子页：chip / book / swap / bolt / null
  const [entry, setEntry] = useState(null)
  // 精选配置 → 整机详情（点击商品卡进入，返回保留在 chip 子页）
  const [product, setProduct] = useState(null)
  // 登录页底部《用户协议》/《隐私政策》独立页：'user' | 'privacy' | null
  const [legal, setLegal] = useState(null)
  const [legalDoc, setLegalDoc] = useState(null)
  const [legalLoading, setLegalLoading] = useState(false)
  // 全局搜索屏：{ keyword, type } | null
  const [search, setSearch] = useState(null)
  // 文章 / 帖子详情：{ kind, id, ... } | null
  const [article, setArticle] = useState(null)
  // 「我的」页二级页：messages | favorites | posts | history | security | null
  const [page, setPage] = useState(null)
  // 二级页参数：如积分兑换详情/下单需要带 { itemId }，避免只用字符串表达不了层级
  const [pageArg, setPageArg] = useState(null)
  const openPage = (key, arg) => {
    setPage(key)
    setPageArg(arg === undefined ? null : arg)
  }
  // 「关于我们」向上弹出层（覆盖在当前页之上，不替换页面）
  const [about, setAbout] = useState(false)
  // 查看其他用户主页：{ id } | null
  const [userProfile, setUserProfile] = useState(null)
  const openUser = (id) => setUserProfile({ id: String(id) })
  // 全局主题：light（白天）/ dark（暗夜）
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  // 是否运行在 Capacitor 原生壳（安卓 APK）内
  const isNative = IS_NATIVE
  // 首页连按返回键退出时的轻提示
  const [showExitHint, setShowExitHint] = useState(false)

  // 收藏状态共享（首页方案卡 / 广场帖子卡 共用）
  const { isFav, toggleFav } = useFavorites()

  // 安卓实体返回键 / 系统返回手势：按覆盖态优先级统一收拢页面栈，
  // 回到首页 Tab 后连按两次才退出 App（避免误触直接退 App）
  useEffect(() => {
    if (!isNative) return
    let exitTimer = null
    let handle = null
    const onBack = () => {
      // 优先级：legal > product > userProfile > article > search > entry > page > Tab
      if (legal) return setLegal(null)
      if (product) return setProduct(null)
      if (userProfile) return setUserProfile(null)
      if (article) return setArticle(null)
      if (search) return setSearch(null)
      if (entry) return setEntry(null)
      if (page) return closePage()
      if (about) return setAbout(false)
      // 已在首页 Tab：首次提示，2s 内再按一次退出
      if (exitTimer) {
        clearTimeout(exitTimer)
        exitTimer = null
        CapApp.exitApp()
      } else {
        setShowExitHint(true)
        exitTimer = setTimeout(() => {
          exitTimer = null
          setShowExitHint(false)
        }, 2000)
      }
    }
    const sub = CapApp.addListener('backButton', onBack)
    if (sub && typeof sub.then === 'function') {
      sub.then((h) => {
        handle = h
      })
    }
    return () => {
      if (exitTimer) clearTimeout(exitTimer)
      if (handle) handle.remove()
    }
  }, [isNative, legal, product, userProfile, article, search, entry, page, about])

  // 协议文档：随 legal 切换拉取真实内容（key 映射 user→user_agreement / privacy→privacy_policy）
  useEffect(() => {
    if (!legal) {
      setLegalDoc(null)
      return
    }
    let alive = true
    setLegalLoading(true)
    const key = legal === 'user' ? 'user_agreement' : 'privacy_policy'
    api
      .get('legal/' + key, { auth: false })
      .then((d) => alive && setLegalDoc(d))
      .catch(() => alive && setLegalDoc(null))
      .finally(() => alive && setLegalLoading(false))
    return () => {
      alive = false
    }
  }, [legal])

  const handleLogout = () => {
    clearAuth()
    setLoggedIn(false)
    setActiveTab('home')
    setEntry(null)
    setProduct(null)
    setArticle(null)
    setPage(null)
    setPageArg(null)
    setAbout(false)
  }

  // 「我的」页菜单入口：about 走弹出层，其余走二级页
  const openFromProfile = (key) => {
    if (key === 'about') setAbout(true)
    else openPage(key)
  }

  const closePage = () => setPage(null)
  // 二级页返回：pageArg.from 指名来源页时回到来源页，否则回「我的」
  const backFrom = (from) =>
    pageArg && pageArg.from === from ? () => openPage(from) : closePage

  const renderPage = () => {
    if (page === 'messages') return <Messages onBack={closePage} />
    if (page === 'favorites')
      return <Favorites onBack={closePage} onOpenArticle={setArticle} />
    if (page === 'posts')
      return (
        <MyPosts
          onBack={closePage}
          onOpenArticle={setArticle}
          onCompose={() => {
            setPage(null)
            setActiveTab('square')
          }}
        />
      )
    if (page === 'history')
      return <BrowseHistory onBack={closePage} onOpenArticle={setArticle} />
    if (page === 'points') return <MyPoints onBack={closePage} onOpenPage={openPage} />
    // 积分兑换：商城 → 电商风详情 → 下单 → 订单；返回时逐层回退
    if (page === 'redeemMall')
      return <RedeemMall onBack={closePage} onOpenPage={openPage} />
    if (page === 'redeemDetail')
      return (
        <RedeemDetail
          itemId={pageArg && pageArg.itemId}
          onBack={() => openPage('redeemMall')}
          onOpenPage={openPage}
        />
      )
    if (page === 'redeemCheckout')
      return (
        <RedeemCheckout
          itemId={pageArg && pageArg.itemId}
          onBack={() => openPage('redeemDetail', { itemId: pageArg && pageArg.itemId })}
          onOpenPage={openPage}
        />
      )
    if (page === 'redeemOrders')
      return <MyRedeemOrders onBack={closePage} onOpenPage={openPage} />
    // 应用设置：收货地址 / 账号与安全 两个入口的容器
    if (page === 'settings')
      return <Settings onBack={closePage} onOpen={(k) => openPage(k, { from: 'settings' })} />
    // 收货地址：独立模块（下单页会直接内联读取地址列表，无需跳页选择）
    // 从「应用设置」进来的，返回时回到设置页；从下单等其他路径进来的照旧回「我的」
    if (page === 'addresses') return <MyAddresses onBack={backFrom('settings')} />
    if (page === 'security') return <AccountSecurity onBack={backFrom('settings')} />
    if (page === 'editProfile') return <EditProfile onBack={closePage} />
    return null
  }

  if (!loggedIn) {
    return (
      <div className={"page" + (isNative ? " is-native" : "")} data-theme={theme}>
        <div className="device">
          <StatusBar theme={theme} />
          <div className="screen">
            {legal ? (
              <LegalDoc doc={legalDoc} loading={legalLoading} onBack={() => setLegal(null)} />
            ) : (
              <Login
                onLogin={() => setLoggedIn(true)}
                onOpenLegal={(k) => setLegal(k)}
              />
            )}
          </div>
          <div className="home-indicator" />
          {showExitHint && <div className="exit-hint">再按一次返回键退出装机匣</div>}
        </div>
      </div>
    )
  }

  const ActiveScreen = TABBED[activeTab]
  return (
    <div className={"page" + (isNative ? " is-native" : "")} data-theme={theme}>
      <div className="device">
        <StatusBar theme={theme} />
        <div className="screen">
          {legal ? (
            /* 已登录时协议只可能从「关于我们」进入：不带「去登录」那句提示 */
            <LegalDoc
              doc={legalDoc}
              loading={legalLoading}
              onBack={() => setLegal(null)}
              foot={null}
            />
          ) : product ? (
            <ProductDetail
              product={product}
              onBack={() => setProduct(null)}
              onOpenCompare={() => {
                setProduct(null)
                setEntry('swap')
              }}
            />
          ) : userProfile ? (
            /* 用户主页优先于帖子详情：从「帖子详情 → 点头像」进来时，
               主页返回会自然回落到帖子详情（article 仍在栈里），不用重开一次 */
            <UserProfile
              userId={userProfile.id}
              onBack={() => setUserProfile(null)}
              onOpenArticle={setArticle}
            />
          ) : article ? (
            <ArticleDetail article={article} onBack={() => setArticle(null)} onOpenUser={openUser} />
          ) : search ? (
            <Search
              initialKeyword={search.keyword}
              initialType={search.type}
              onBack={() => setSearch(null)}
              onOpenArticle={setArticle}
            />
          ) : entry ? (
            <QuickEntry
              kind={entry}
              onBack={() => setEntry(null)}
              onOpenProduct={setProduct}
            />
          ) : page ? (
            renderPage()
          ) : (
            <ActiveScreen
              theme={theme}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
              onOpenEntry={setEntry}
              onOpenSearch={setSearch}
              onOpenArticle={setArticle}
              onOpen={openFromProfile}
              onOpenLegal={setLegal}
              onOpenUser={openUser}
              onOpenProduct={(p) => setProduct(p)}
              isFav={isFav}
              toggleFav={toggleFav}
            />
          )}
        </div>
        {about && <AboutSheet onClose={() => setAbout(false)} onOpenLegal={setLegal} />}
        {/* 帖子 / 文章详情、他人主页都是沉浸式页，不需要底部导航栏（返回走左上角按钮） */}
        {!article && !userProfile && (
          <TabBar
            active={activeTab}
            onChange={(k) => {
              setActiveTab(k)
              setEntry(null)
              setProduct(null)
              setArticle(null)
              setPage(null)
              setUserProfile(null)
            }}
          />
        )}
        <div className="home-indicator" />
        {showExitHint && <div className="exit-hint">再按一次返回键退出装机匣</div>}
      </div>
    </div>
  )
}
