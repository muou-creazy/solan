/**
 * 顶栏样式、固定状态、Logo 大小与面板拖动：偏好写入 localStorage（样式仅 B brand / C utility）
 */
(function () {
  /** 顶栏样式 localStorage 键 */
  var STORAGE_KEY = 'solan-header-style'
  /** 顶栏是否固定 localStorage 键 */
  var STICKY_STORAGE_KEY = 'solan-header-sticky'
  /** Logo 大小 localStorage 键 */
  var LOGO_SIZE_STORAGE_KEY = 'solan-logo-size'
  /** 面板位置 localStorage 键 */
  var PANEL_POS_STORAGE_KEY = 'solan-header-panel-pos'
  /** B 方案视觉预设 localStorage 键 */
  var PRESET_STORAGE_KEY = 'solan-brand-preset'
  /** 默认顶栏样式 */
  var DEFAULT_STYLE = 'brand'
  /** 默认固定在顶部 */
  var DEFAULT_STICKY = 'on'
  /** 默认 Logo 宽度（px） */
  var DEFAULT_LOGO_SIZE = 100
  /** Logo 宽度下限 */
  var LOGO_SIZE_MIN = 48
  /** Logo 宽度上限 */
  var LOGO_SIZE_MAX = 200
  /** 默认 B 方案预设 */
  var DEFAULT_PRESET = 'p0'
  /** 支持的顶栏样式列表（B brand / C utility） */
  var SUPPORTED = ['brand', 'utility']
  /** 支持的固定状态 */
  var STICKY_SUPPORTED = ['on', 'off']
  /** 支持的 B 方案预设（P0 现状 / P1 细线 / P2 Slogan / P3 收紧） */
  var PRESET_SUPPORTED = ['p0', 'p1', 'p2', 'p3']

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
   * 读取已保存的 B 方案预设
   * @returns {string}
   */
  function getStoredPreset() {
    try {
      var saved = localStorage.getItem(PRESET_STORAGE_KEY)
      var legacyMap = { p1: 'p0', p2: 'p1', p3: 'p2', p4: 'p3' }
      if (saved && legacyMap[saved]) {
        saved = legacyMap[saved]
      }
      if (saved && PRESET_SUPPORTED.indexOf(saved) !== -1) {
        return saved
      }
    } catch (e) {
      /* localStorage 不可用时忽略 */
    }
    return DEFAULT_PRESET
  }

  /**
   * 读取已保存的 Logo 大小
   * @returns {number}
   */
  function getStoredLogoSize() {
    try {
      var saved = parseInt(localStorage.getItem(LOGO_SIZE_STORAGE_KEY), 10)
      if (!isNaN(saved)) {
        return clampLogoSize(saved)
      }
    } catch (e) {
      /* localStorage 不可用时忽略 */
    }
    return DEFAULT_LOGO_SIZE
  }

  /**
   * 读取已保存的面板位置
   * @returns {{ left: number, top: number }|null}
   */
  function getStoredPanelPos() {
    try {
      var raw = localStorage.getItem(PANEL_POS_STORAGE_KEY)
      if (!raw) {
        return null
      }
      var data = JSON.parse(raw)
      if (data && typeof data.left === 'number' && typeof data.top === 'number') {
        return data
      }
    } catch (e) {
      /* 忽略解析失败 */
    }
    return null
  }

  /**
   * 将 Logo 大小限制在合法区间
   * @param {number} size 像素宽度
   * @returns {number}
   */
  function clampLogoSize(size) {
    var n = Math.round(Number(size) || DEFAULT_LOGO_SIZE)
    if (n < LOGO_SIZE_MIN) {
      return LOGO_SIZE_MIN
    }
    if (n > LOGO_SIZE_MAX) {
      return LOGO_SIZE_MAX
    }
    return n
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
   * 将 B 方案预设写入 localStorage
   * @param {string} preset 预设代码
   */
  function savePreset(preset) {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, preset)
    } catch (e) {
      /* 忽略写入失败 */
    }
  }

  /**
   * 将 Logo 大小写入 localStorage
   * @param {number} size 像素宽度
   */
  function saveLogoSize(size) {
    try {
      localStorage.setItem(LOGO_SIZE_STORAGE_KEY, String(clampLogoSize(size)))
    } catch (e) {
      /* 忽略写入失败 */
    }
  }

  /**
   * 将面板位置写入 localStorage
   * @param {{ left: number, top: number }} pos 位置
   */
  function savePanelPos(pos) {
    try {
      localStorage.setItem(PANEL_POS_STORAGE_KEY, JSON.stringify(pos))
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
   * 更新 B 方案预设按钮选中态
   * @param {string} preset 预设代码
   */
  function updatePresetUI(preset) {
    var root = document.getElementById('header-brand-preset-switcher')
    if (!root) {
      return
    }
    root.querySelectorAll('[data-brand-preset-option]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-brand-preset-option') === preset
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
      btn.classList.toggle('is-active', isActive)
    })
  }

  /**
   * 更新 Logo 滑块 UI
   * @param {number} size 像素宽度
   */
  function updateLogoSizeUI(size) {
    var input = document.getElementById('header-logo-size')
    var valueEl = document.getElementById('header-logo-size-value')
    if (input) {
      input.value = String(size)
      input.setAttribute('aria-valuenow', String(size))
    }
    if (valueEl) {
      valueEl.textContent = String(size)
    }
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
   * 应用 B 方案视觉预设到 html 与顶栏
   * @param {string} preset 预设代码
   */
  function applyPreset(preset) {
    var code = PRESET_SUPPORTED.indexOf(preset) !== -1 ? preset : DEFAULT_PRESET
    document.documentElement.setAttribute('data-brand-preset', code)
    var header = document.getElementById('navbar')
    if (header) {
      header.setAttribute('data-brand-preset', code)
    }
    updatePresetUI(code)
  }

  /**
   * 应用 Logo 宽度到 CSS 变量
   * @param {number} size 像素宽度
   */
  function applyLogoSize(size) {
    var px = clampLogoSize(size)
    document.documentElement.style.setProperty('--logo-size', px + 'px')
    updateLogoSizeUI(px)
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
   * 切换并持久化 B 方案预设
   * @param {string} preset 预设代码
   */
  function setPreset(preset) {
    var code = PRESET_SUPPORTED.indexOf(preset) !== -1 ? preset : DEFAULT_PRESET
    savePreset(code)
    applyPreset(code)
  }

  /**
   * 设置并持久化 Logo 大小
   * @param {number} size 像素宽度
   */
  function setLogoSize(size) {
    var px = clampLogoSize(size)
    saveLogoSize(px)
    applyLogoSize(px)
  }

  /**
   * 将面板限制在视口内
   * @param {HTMLElement} panel 面板节点
   * @param {number} left 左边距
   * @param {number} top 上边距
   * @returns {{ left: number, top: number }}
   */
  function clampPanelPos(panel, left, top) {
    var margin = 8
    var maxLeft = Math.max(margin, window.innerWidth - panel.offsetWidth - margin)
    var maxTop = Math.max(margin, window.innerHeight - panel.offsetHeight - margin)
    return {
      left: Math.min(Math.max(margin, left), maxLeft),
      top: Math.min(Math.max(margin, top), maxTop)
    }
  }

  /**
   * 应用面板位置（改为 left/top，取消 bottom 锚定）
   * @param {HTMLElement} panel 面板节点
   * @param {{ left: number, top: number }} pos 位置
   */
  function applyPanelPos(panel, pos) {
    var safe = clampPanelPos(panel, pos.left, pos.top)
    panel.style.left = safe.left + 'px'
    panel.style.top = safe.top + 'px'
    panel.style.right = 'auto'
    panel.style.bottom = 'auto'
    panel.classList.add('is-dragged')
  }

  /**
   * 绑定面板拖动（仅拖动手柄触发，避免误触滑块/按钮）
   */
  function bindPanelDrag() {
    var panel = document.getElementById('header-style-switcher')
    var handle = document.getElementById('header-style-drag')
    if (!panel || !handle) {
      return
    }

    var dragging = false
    var startX = 0
    var startY = 0
    var originLeft = 0
    var originTop = 0
    var activePointerId = null

    /**
     * 开始拖动
     * @param {PointerEvent} e 指针事件
     */
    function onPointerDown(e) {
      if (e.button != null && e.button !== 0) {
        return
      }
      dragging = true
      activePointerId = e.pointerId
      var rect = panel.getBoundingClientRect()
      originLeft = rect.left
      originTop = rect.top
      startX = e.clientX
      startY = e.clientY
      panel.classList.add('is-dragging')
      try {
        handle.setPointerCapture(e.pointerId)
      } catch (err) {
        /* 部分环境不支持 capture */
      }
      e.preventDefault()
    }

    /**
     * 拖动中更新位置
     * @param {PointerEvent} e 指针事件
     */
    function onPointerMove(e) {
      if (!dragging || (activePointerId != null && e.pointerId !== activePointerId)) {
        return
      }
      var next = clampPanelPos(
        panel,
        originLeft + (e.clientX - startX),
        originTop + (e.clientY - startY)
      )
      applyPanelPos(panel, next)
    }

    /**
     * 结束拖动并持久化
     * @param {PointerEvent} e 指针事件
     */
    function onPointerUp(e) {
      if (!dragging || (activePointerId != null && e.pointerId !== activePointerId)) {
        return
      }
      dragging = false
      activePointerId = null
      panel.classList.remove('is-dragging')
      var rect = panel.getBoundingClientRect()
      var pos = clampPanelPos(panel, rect.left, rect.top)
      applyPanelPos(panel, pos)
      savePanelPos(pos)
    }

    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)

    window.addEventListener('resize', function () {
      if (!panel.classList.contains('is-dragged')) {
        return
      }
      var rect = panel.getBoundingClientRect()
      applyPanelPos(panel, { left: rect.left, top: rect.top })
    })
  }

  /**
   * 绑定样式、固定状态与 Logo 大小控件
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
    root.querySelectorAll('[data-brand-preset-option]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setPreset(btn.getAttribute('data-brand-preset-option'))
      })
    })

    var logoInput = document.getElementById('header-logo-size')
    if (logoInput) {
      logoInput.addEventListener('input', function () {
        applyLogoSize(logoInput.value)
      })
      logoInput.addEventListener('change', function () {
        setLogoSize(logoInput.value)
      })
    }
  }

  /**
   * 初始化：应用已存偏好并绑定交互
   */
  function init() {
    applyStyle(getStoredStyle())
    applySticky(getStoredSticky())
    applyPreset(getStoredPreset())
    applyLogoSize(getStoredLogoSize())
    bindSwitcher()
    bindPanelDrag()

    var panel = document.getElementById('header-style-switcher')
    var savedPos = getStoredPanelPos()
    if (panel && savedPos) {
      applyPanelPos(panel, savedPos)
    }
  }

  window.SolanHeaderStyle = {
    setStyle: setStyle,
    applyStyle: applyStyle,
    getStoredStyle: getStoredStyle,
    setSticky: setSticky,
    applySticky: applySticky,
    getStoredSticky: getStoredSticky,
    setPreset: setPreset,
    applyPreset: applyPreset,
    getStoredPreset: getStoredPreset,
    setLogoSize: setLogoSize,
    applyLogoSize: applyLogoSize,
    getStoredLogoSize: getStoredLogoSize,
    init: init
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
