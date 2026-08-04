/**
 * 单页模块路由：根据 hash 只显示当前模块，隐藏其余模块
 */
(function () {
  /** 允许切换的模块 id 列表 */
  var PAGE_IDS = ['home', 'about', 'products', 'services', 'faq', 'contact', 'terms', 'privacy']
  /** 默认首页模块 */
  var DEFAULT_PAGE = 'home'

  /**
   * 从地址栏 hash 解析目标模块 id
   * @returns {string}
   */
  function getPageIdFromHash() {
    var hash = (window.location.hash || '').replace(/^#/, '')
    return PAGE_IDS.indexOf(hash) !== -1 ? hash : DEFAULT_PAGE
  }

  /**
   * 切换到指定模块：仅显示该模块，更新导航高亮与地址栏
   * @param {string} pageId 模块 id
   * @param {boolean} [updateHash=true] 是否同步写入 hash
   */
  function showPage(pageId, updateHash) {
    var targetId = PAGE_IDS.indexOf(pageId) !== -1 ? pageId : DEFAULT_PAGE

    document.querySelectorAll('.section-block').forEach(function (section) {
      var isActive = section.id === targetId
      section.classList.toggle('is-active', isActive)
    })

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href') || ''
      link.classList.toggle('is-active', href === '#' + targetId)
    })

    if (updateHash !== false && window.location.hash !== '#' + targetId) {
      window.location.hash = targetId
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  /**
   * 绑定导航与 hash 变化，实现模块切换
   */
  function bindPageRouter() {
    document.querySelectorAll('.nav-links a, .logo-wrapper, .js-page-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = (this.getAttribute('href') || '').replace(/^#/, '')
        if (!targetId || PAGE_IDS.indexOf(targetId) === -1) {
          return
        }
        e.preventDefault()
        showPage(targetId)
      })
    })

    window.addEventListener('hashchange', function () {
      showPage(getPageIdFromHash(), false)
    })

    showPage(getPageIdFromHash(), false)
    if (!window.location.hash) {
      window.location.replace('#' + DEFAULT_PAGE)
    }
  }

  window.SolanPages = {
    showPage: showPage,
    getPageIdFromHash: getPageIdFromHash,
    init: bindPageRouter
  }

  // 等待 commonts 模块注入后再初始化（由 index 在 solan:ready 时调用）
})()
