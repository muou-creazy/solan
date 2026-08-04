/**
 * 从 commonts/ 加载各模块 HTML 片段并注入页面占位节点
 * 加载完成后触发 solan:ready，供路由 / i18n / 聊天等脚本初始化
 */
(function () {
  /** 自定义就绪事件名 */
  var READY_EVENT = 'solan:ready'

  /**
   * 模块加载清单：target 为注入容器 id，src 为片段路径
   * home 单独注入；其余业务模块按顺序注入到 page-sections
   */
  var INCLUDES = [
    { target: 'site-header', src: './commonts/header.html' },
    { target: 'page-home', src: './commonts/home.html' },
    { target: 'page-sections', src: './commonts/about.html', append: true },
    { target: 'page-sections', src: './commonts/products.html', append: true },
    { target: 'page-sections', src: './commonts/services.html', append: true },
    { target: 'page-sections', src: './commonts/faq.html', append: true },
    { target: 'page-sections', src: './commonts/contact.html', append: true },
    { target: 'page-sections', src: './commonts/terms.html', append: true },
    { target: 'page-sections', src: './commonts/privacy.html', append: true },
    { target: 'site-footer', src: './commonts/footer.html' },
    { target: 'site-float', src: './commonts/float.html' }
  ]

  /**
   * 拉取单个 HTML 片段
   * @param {string} src 相对路径
   * @returns {Promise<string>}
   */
  function fetchPartial(src) {
    return fetch(src, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) {
        throw new Error('Failed to load ' + src + ' (' + res.status + ')')
      }
      return res.text()
    })
  }

  /**
   * 将 HTML 注入目标节点
   * @param {string} targetId 容器 id
   * @param {string} html 片段内容
   * @param {boolean} [append=false] 是否追加（否则覆盖）
   */
  function injectHtml(targetId, html, append) {
    var el = document.getElementById(targetId)
    if (!el) {
      console.warn('[SolanCommonts] missing target #' + targetId)
      return
    }
    if (append) {
      el.insertAdjacentHTML('beforeend', html)
    } else {
      el.innerHTML = html
    }
  }

  /**
   * 按清单顺序加载全部模块（保证 sections 顺序稳定）
   * @returns {Promise<void>}
   */
  function loadAllCommonts() {
    var chain = Promise.resolve()
    INCLUDES.forEach(function (item) {
      chain = chain.then(function () {
        return fetchPartial(item.src).then(function (html) {
          injectHtml(item.target, html, !!item.append)
        })
      })
    })
    return chain
  }

  /**
   * 通知各业务脚本可以安全初始化
   */
  function dispatchReady() {
    document.dispatchEvent(new CustomEvent(READY_EVENT))
  }

  /**
   * 启动加载流程
   */
  function start() {
    loadAllCommonts()
      .then(function () {
        dispatchReady()
      })
      .catch(function (err) {
        console.error('[SolanCommonts]', err)
        dispatchReady()
      })
  }

  window.SolanCommonts = {
    loadAllCommonts: loadAllCommonts,
    READY_EVENT: READY_EVENT
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
