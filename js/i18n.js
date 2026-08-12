/**
 * 站点多语言切换：读取翻译表、应用文案、持久化语言偏好
 */
(function () {
  /** localStorage 存储键 */
  var STORAGE_KEY = 'solan-lang'
  /** 默认语言（与页面当前英文文案一致） */
  var DEFAULT_LANG = 'en'
  /** 支持的语言列表（不含中文） */
  var SUPPORTED = ['en', 'es', 'ko', 'ja', 'fr', 'de']
  /** 按钮上显示的短标签 */
  var LANG_LABELS = {
    en: 'EN',
    es: 'ES',
    ko: '한국어',
    ja: '日本語',
    fr: 'FR',
    de: 'DE'
  }
  /** html lang 属性映射 */
  var HTML_LANG = {
    en: 'en',
    es: 'es',
    ko: 'ko',
    ja: 'ja',
    fr: 'fr',
    de: 'de'
  }
  /** 按需加载的额外翻译脚本路径 */
  var EXTRA_SCRIPT = './js/translations-extra.js'
  /** 额外翻译脚本加载 Promise（仅加载一次） */
  var extraLoadPromise = null

  /**
   * 读取当前应使用的语言代码
   * @returns {string}
   */
  function getStoredLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY)
      if (saved && SUPPORTED.indexOf(saved) !== -1) {
        return saved
      }
    } catch (e) {
      /* localStorage 不可用时忽略 */
    }
    return DEFAULT_LANG
  }

  /**
   * 将语言偏好写入 localStorage
   * @param {string} lang 语言代码
   */
  function saveLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch (e) {
      /* 忽略写入失败 */
    }
  }

  /**
   * 从翻译表取指定 key 的文案，缺失时回退到英文
   * @param {string} lang 语言代码
   * @param {string} key 文案 key
   * @returns {string}
   */
  function t(lang, key) {
    var table = window.SolanTranslations || {}
    var dict = table[lang] || table[DEFAULT_LANG] || {}
    if (dict[key] != null) {
      return dict[key]
    }
    var fallback = table[DEFAULT_LANG] || {}
    return fallback[key] != null ? fallback[key] : ''
  }

  /**
   * 判断指定语言是否需要加载 translations-extra.js
   * @param {string} lang 语言代码
   * @returns {boolean}
   */
  function needsExtraTranslations(lang) {
    return lang !== DEFAULT_LANG
  }

  /**
   * 检查额外语言包是否已合并到 SolanTranslations
   * @returns {boolean}
   */
  function isExtraLoaded() {
    var table = window.SolanTranslations || {}
    return !!table.es
  }

  /**
   * 动态加载 translations-extra.js（全局仅加载一次）
   * @returns {Promise<void>}
   */
  function loadExtraTranslations() {
    if (isExtraLoaded()) {
      return Promise.resolve()
    }
    if (extraLoadPromise) {
      return extraLoadPromise
    }
    extraLoadPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = EXTRA_SCRIPT
      script.async = true
      script.onload = function () {
        resolve()
      }
      script.onerror = function () {
        extraLoadPromise = null
        reject(new Error('Failed to load ' + EXTRA_SCRIPT))
      }
      document.head.appendChild(script)
    })
    return extraLoadPromise
  }

  /**
   * 确保当前语言所需的翻译表已就绪
   * @param {string} lang 语言代码
   * @returns {Promise<void>}
   */
  function ensureTranslations(lang) {
    if (!needsExtraTranslations(lang)) {
      return Promise.resolve()
    }
    return loadExtraTranslations()
  }

  /**
   * 将指定语言应用到页面所有带 data-i18n* 的节点
   * @param {string} lang 语言代码
   */
  function applyLanguage(lang) {
    var code = SUPPORTED.indexOf(lang) !== -1 ? lang : DEFAULT_LANG

    document.documentElement.setAttribute('lang', HTML_LANG[code] || code)

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n')
      if (!key) {
        return
      }
      var value = t(code, key)
      if (!value) {
        return
      }
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = value
      } else {
        el.textContent = value
      }
    })

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt')
      var value = key ? t(code, key) : ''
      if (value) {
        el.setAttribute('alt', value)
      }
    })

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria')
      var value = key ? t(code, key) : ''
      if (value) {
        el.setAttribute('aria-label', value)
      }
    })

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder')
      var value = key ? t(code, key) : ''
      if (value) {
        el.setAttribute('placeholder', value)
      }
    })

    document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-content')
      var value = key ? t(code, key) : ''
      if (value) {
        el.setAttribute('content', value)
      }
    })

    updateSwitcherUI(code)
  }

  /**
   * 更新语言按钮文案与下拉选中态
   * @param {string} lang 当前语言
   */
  function updateSwitcherUI(lang) {
    var current = document.getElementById('lang-switcher-current')
    if (current) {
      current.textContent = LANG_LABELS[lang] || lang.toUpperCase()
    }

    var menu = document.getElementById('lang-switcher-menu')
    if (!menu) {
      return
    }
    menu.querySelectorAll('[data-lang]').forEach(function (item) {
      var isActive = item.getAttribute('data-lang') === lang
      item.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })
  }

  /**
   * 打开或关闭语言下拉
   * @param {boolean} open 是否打开
   */
  function setMenuOpen(open) {
    var root = document.getElementById('lang-switcher')
    var btn = document.getElementById('lang-switcher-btn')
    var menu = document.getElementById('lang-switcher-menu')
    if (!root || !btn || !menu) {
      return
    }
    root.classList.toggle('is-open', open)
    btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    menu.hidden = !open
  }

  /**
   * 切换到指定语言并关闭下拉（非英文时先按需加载额外翻译）
   * @param {string} lang 语言代码
   */
  function setLanguage(lang) {
    var code = SUPPORTED.indexOf(lang) !== -1 ? lang : DEFAULT_LANG
    saveLang(code)
    ensureTranslations(code).then(function () {
      applyLanguage(code)
      setMenuOpen(false)
    }).catch(function () {
      applyLanguage(DEFAULT_LANG)
      setMenuOpen(false)
    })
  }

  /**
   * 绑定语言选择器交互事件
   */
  function bindSwitcher() {
    var root = document.getElementById('lang-switcher')
    var btn = document.getElementById('lang-switcher-btn')
    var menu = document.getElementById('lang-switcher-menu')
    if (!root || !btn || !menu) {
      return
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      setMenuOpen(menu.hidden)
    })

    menu.querySelectorAll('[data-lang]').forEach(function (item) {
      item.addEventListener('click', function () {
        setLanguage(item.getAttribute('data-lang'))
      })
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setLanguage(item.getAttribute('data-lang'))
        }
      })
    })

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) {
        setMenuOpen(false)
      }
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    })
  }

  /**
   * 初始化：英文跳过 DOM 替换（HTML 已是英文），其他语言按需加载后应用
   */
  function init() {
    if (!window.SolanTranslations) {
      return
    }
    bindSwitcher()
    var lang = getStoredLang()
    if (lang === DEFAULT_LANG) {
      updateSwitcherUI(DEFAULT_LANG)
      return
    }
    ensureTranslations(lang).then(function () {
      applyLanguage(lang)
    }).catch(function () {
      updateSwitcherUI(DEFAULT_LANG)
    })
  }

  window.SolanI18n = {
    setLanguage: setLanguage,
    applyLanguage: applyLanguage,
    getStoredLang: getStoredLang,
    init: init
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
