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
import AccountSecurity from './screens/AccountSecurity.jsx'
import EditProfile from './screens/EditProfile.jsx'
import AboutSheet from './screens/AboutSheet.jsx'
import { api, getToken, clearAuth } from './apiClient.js'
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
  // 「关于我们」向上弹出层（覆盖在当前页之上，不替换页面）
  const [about, setAbout] = useState(false)
  // 全局主题：light（白天）/ dark（暗夜）
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

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
    setAbout(false)
  }

  // 「我的」页菜单入口：about 走弹出层，其余走二级页
  const openFromProfile = (key) => {
    if (key === 'about') setAbout(true)
    else setPage(key)
  }

  const closePage = () => setPage(null)

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
    if (page === 'security') return <AccountSecurity onBack={closePage} />
    if (page === 'editProfile') return <EditProfile onBack={closePage} />
    return null
  }

  if (!loggedIn) {
    return (
      <div className="page" data-theme={theme}>
        <div className="device">
          <StatusBar />
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
        </div>
      </div>
    )
  }

  const ActiveScreen = TABBED[activeTab]
  return (
    <div className="page" data-theme={theme}>
      <div className="device">
        <StatusBar />
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
            <ProductDetail product={product} onBack={() => setProduct(null)} />
          ) : article ? (
            <ArticleDetail article={article} onBack={() => setArticle(null)} />
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
            />
          )}
        </div>
        {about && <AboutSheet onClose={() => setAbout(false)} onOpenLegal={setLegal} />}
        {/* 帖子 / 文章详情是沉浸式阅读页，不需要底部导航栏（返回走左上角按钮） */}
        {!article && (
          <TabBar
            active={activeTab}
            onChange={(k) => {
              setActiveTab(k)
              setEntry(null)
              setProduct(null)
              setArticle(null)
              setPage(null)
            }}
          />
        )}
        <div className="home-indicator" />
      </div>
    </div>
  )
}
