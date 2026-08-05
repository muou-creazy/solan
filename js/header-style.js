/**
 * 顶栏样式与固定状态切换：偏好写入 localStorage
 */
(function () {
  /** 顶栏样式 localStorage 键 */
  var STORAGE_KEY = 'solan-header-style'
  /** 顶栏是否固定 localStorage 键 */
  var STICKY_STORAGE_KEY = 'solan-header-sticky'
  /** 默认顶栏样式（保留当前双行布局） */
  var DEFAULT_STYLE = 'classic'
  /** 默认固定在顶部 */
  var DEFAULT_STICKY = 'on'
  /** 支持的顶栏样式列表（A classic / B brand / C utility / D overlap） */
  var SUPPORTED = ['classic', 'brand', 'utility', 'overlap']
  /** 支持的固定状态 */
  var STICKY_SUPPORTED = ['on', 'off']

  /**
   * 读取已保存的顶栏样式，非法值回退默认
   * @returns {string}
   */
  function getStoredStyle() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY)
      if (saved && SUPPORTED.indexOf(saved) !== -1) {
        return saved
      }
    } catch (e) {
      /* localStorage 不可用时忽略 */
    }
    return DEFAULT_STYLE
  }

  /**
   * 读取已保存的固定状态，非法值回退默认
   * @returns {string}
   */
  function getStoredSticky() {
    try {
      var saved = localStorage.getItem(STICKY_STORAGE_KEY)
      if (saved && STICKY_SUPPORTED.indexOf(saved) !== -1) {
        return saved
      }
    } catch (e) {
      /* localStorage 不可用时忽略 */
    }
    return DEFAULT_STICKY
  }

  /**
   * 将顶栏样式偏好写入 localStorage
   * @param {string} style 样式代码
   */
  function saveStyle(style) {
    try {
      localStorage.setItem(STORAGE_KEY, style)
    } catch (e) {
      /* 忽略写入失败 */
    }
  }

  /**
   * 将固定状态偏好写入 localStorage
   * @param {string} sticky on|off
   */
  function saveSticky(sticky) {
    try {
      localStorage.setItem(STICKY_STORAGE_KEY, sticky)
    } catch (e) {
      /* 忽略写入失败 */
    }
  }

  /**
   * 更新样式切换按钮的选中态
   * @param {string} style 当前样式
   */
  function updateSwitcherUI(style) {
    var root = document.getElementById('header-style-switcher')
    if (!root) {
      return
    }
    root.querySelectorAll('[data-header-style-option]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-header-style-option') === style
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
      btn.classList.toggle('is-active', isActive)
    })
  }

  /**
   * 更新固定状态按钮选中态
   * @param {string} sticky on|off
   */
  function updateStickyUI(sticky) {
    var root = document.getElementById('header-sticky-switcher')
    if (!root) {
      return
    }
    root.querySelectorAll('[data-header-sticky-option]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-header-sticky-option') === sticky
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
      btn.classList.toggle('is-active', isActive)
    })
  }

  /**
   * 将指定样式应用到 html 与顶栏节点
   * @param {string} style 样式代码
   */
  function applyStyle(style) {
    var code = SUPPORTED.indexOf(style) !== -1 ? style : DEFAULT_STYLE
    document.documentElement.setAttribute('data-header-style', code)
    var header = document.getElementById('navbar')
    if (header) {
      header.setAttribute('data-header-style', code)
    }
    updateSwitcherUI(code)
  }

  /**
   * 应用顶栏是否固定在顶部
   * @param {string} sticky on|off
   */
  function applySticky(sticky) {
    var code = STICKY_SUPPORTED.indexOf(sticky) !== -1 ? sticky : DEFAULT_STICKY
    document.documentElement.setAttribute('data-header-sticky', code)
    var header = document.getElementById('navbar')
    if (header) {
      header.setAttribute('data-header-sticky', code)
      if (code === 'off') {
        header.classList.remove('scrolled')
      }
    }
    updateStickyUI(code)
  }

  /**
   * 切换并持久化顶栏样式
   * @param {string} style 样式代码
   */
  function setStyle(style) {
    var code = SUPPORTED.indexOf(style) !== -1 ? style : DEFAULT_STYLE
    saveStyle(code)
    applyStyle(code)
  }

  /**
   * 切换并持久化固定状态
   * @param {string} sticky on|off
   */
  function setSticky(sticky) {
    var code = STICKY_SUPPORTED.indexOf(sticky) !== -1 ? sticky : DEFAULT_STICKY
    saveSticky(code)
    applySticky(code)
  }

  /**
   * 绑定样式与固定状态切换点击事件
   */
  function bindSwitcher() {
    var root = document.getElementById('header-style-switcher')
    if (!root) {
      return
    }
    root.querySelectorAll('[data-header-style-option]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setStyle(btn.getAttribute('data-header-style-option'))
      })
    })
    root.querySelectorAll('[data-header-sticky-option]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setSticky(btn.getAttribute('data-header-sticky-option'))
      })
    })
  }

  /**
   * 初始化：应用已存样式/固定状态并绑定切换 UI
   */
  function init() {
    applyStyle(getStoredStyle())
    applySticky(getStoredSticky())
    bindSwitcher()
  }

  window.SolanHeaderStyle = {
    setStyle: setStyle,
    applyStyle: applyStyle,
    getStoredStyle: getStoredStyle,
    setSticky: setSticky,
    applySticky: applySticky,
    getStoredSticky: getStoredSticky,
    init: init
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
