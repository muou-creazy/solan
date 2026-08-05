/**
 * 顶栏样式切换：classic / brand / utility / overlap，偏好写入 localStorage
 */
(function () {
  /** localStorage 存储键 */
  var STORAGE_KEY = 'solan-header-style'
  /** 默认顶栏样式（保留当前双行布局） */
  var DEFAULT_STYLE = 'classic'
  /** 支持的顶栏样式列表（A classic / B brand / C utility / D overlap） */
  var SUPPORTED = ['classic', 'brand', 'utility', 'overlap']

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
   * 更新切换按钮的选中态（aria-pressed）
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
   * 切换并持久化顶栏样式
   * @param {string} style 样式代码
   */
  function setStyle(style) {
    var code = SUPPORTED.indexOf(style) !== -1 ? style : DEFAULT_STYLE
    saveStyle(code)
    applyStyle(code)
  }

  /**
   * 绑定左下角样式切换控件点击事件
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
  }

  /**
   * 初始化：应用已存样式并绑定切换 UI
   */
  function init() {
    applyStyle(getStoredStyle())
    bindSwitcher()
  }

  window.SolanHeaderStyle = {
    setStyle: setStyle,
    applyStyle: applyStyle,
    getStoredStyle: getStoredStyle,
    init: init
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
