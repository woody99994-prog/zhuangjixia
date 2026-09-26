/* eslint-disable react/prop-types */
import { IconChevron } from '../components/Icons.jsx'

// 把 **加粗** 语法渲染为 <strong>
function renderRich(text) {
  return String(text)
    .split('**')
    .map((seg, i) =>
      i % 2 === 1 ? <strong key={i}>{seg}</strong> : <span key={i}>{seg}</span>,
    )
}

// 极简 markdown 渲染：## 标题 / - 列表 / 段落（# 视为文档标题已由顶栏展示，跳过）
function renderMarkdown(md) {
  if (!md) return null
  const lines = md.split('\n')
  const out = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#\s+/.test(line)) {
      i++
      continue
    }
    if (/^##\s+/.test(line)) {
      out.push(
        <h2 className="legal-sec-h" key={key++}>
          {renderRich(line.replace(/^##\s+/, ''))}
        </h2>,
      )
      i++
    } else if (/^[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      out.push(
        <ul className="legal-sec-list" key={key++}>
          {items.map((it, j) => (
            <li key={j}>{renderRich(it)}</li>
          ))}
        </ul>,
      )
    } else if (line.trim() === '') {
      i++
    } else {
      const para = []
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^#/.test(lines[i]) &&
        !/^[-*]\s+/.test(lines[i])
      ) {
        para.push(lines[i])
        i++
      }
      out.push(
        <p className="legal-sec-p" key={key++}>
          {renderRich(para.join(' '))}
        </p>,
      )
    }
  }
  return out
}

// 通用排版模板：返回头部 + 更新日期 + markdown 正文
export default function LegalDoc({ doc, loading, onBack, foot = '' }) {
  return (
    <div className="legal">
      <div className="legal-top">
        <button className="legal-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.4} />
        </button>
        <span className="legal-top-title">{doc ? doc.title : '协议'}</span>
      </div>

      {loading && !doc ? (
        <p className="legal-intro">加载中…</p>
      ) : doc ? (
        <>
          <p className="legal-updated">
            {doc.updatedAt
              ? '最后更新：' + new Date(doc.updatedAt).toLocaleDateString('zh-CN')
              : ''}
          </p>
          {doc.contentMd ? (
            <div className="legal-body">{renderMarkdown(doc.contentMd)}</div>
          ) : (
            <p className="legal-intro">暂无内容</p>
          )}
        </>
      ) : (
        <p className="legal-intro">加载失败，请返回重试</p>
      )}

      {foot ? (
        <p className="legal-foot">{foot}</p>
      ) : (
        <p className="legal-foot">如您同意以上内容，请继续使用本服务。</p>
      )}
    </div>
  )
}
