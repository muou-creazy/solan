/**
 * 社交唤起：WhatsApp / Messenger 聊天，以及 Facebook / LinkedIn / Instagram 主页
 * 优先打开本地 App，超时未切换则跳转网页
 * 微信等 App 内置浏览器会拦截外链，需引导到系统浏览器
 */
(function (global) {
  /** 默认账户（当前按业务手机号配置，后续可改为主页用户名 / Profile ID） */
  var DEFAULT_ACCOUNT = '8615027442014'
  /** 默认预填文案 */
  var DEFAULT_TEXT = 'Hello Solan, I would like to inquire about your products.'
  /** App 唤起等待时长（毫秒），超时则视为未安装 */
  var APP_TIMEOUT_MS = 1500

  /**
   * 判断是否为移动端
   * @returns {boolean}
   */
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
  }

  /**
   * 判断是否为 Android
   * @returns {boolean}
   */
  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '')
  }

  /**
   * 判断是否在微信内置浏览器
   * @returns {boolean}
   */
  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent || '')
  }

  /**
   * 判断是否在常见 App 内置浏览器（会拦截自定义协议 / window.open）
   * @returns {boolean}
   */
  function isInAppBrowser() {
    var ua = navigator.userAgent || ''
    return /MicroMessenger|QQ\/|Weibo|DingTalk|FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|Twitter|BytedanceWebview|Aweme|miniProgram/i.test(ua)
  }

  /**
   * 按渠道拼接 App / Web 聊天链接
   * @param {string} channel 渠道：whatsapp | facebook | linkedin
   * @param {string} account 账户标识
   * @param {string} text 预填消息
   * @returns {{ appUrl: string, webUrl: string, universalUrl: string }}
   */
  function buildUrls(channel, account, text) {
    var id = String(account || DEFAULT_ACCOUNT).replace(/\s/g, '')
    var msg = text || DEFAULT_TEXT
    var encodedText = encodeURIComponent(msg)

    if (channel === 'facebook') {
      var fbWeb = 'https://m.me/' + encodeURIComponent(id) + '?text=' + encodedText
      return {
        appUrl: 'fb-messenger://user/' + encodeURIComponent(id),
        webUrl: fbWeb,
        universalUrl: fbWeb
      }
    }

    if (channel === 'linkedin') {
      var liWeb = 'https://www.linkedin.com/messaging/compose/?recipient=' + encodeURIComponent(id) + '&body=' + encodedText
      return {
        appUrl: 'linkedin://messaging/compose?recipient=' + encodeURIComponent(id) + '&body=' + encodedText,
        webUrl: liWeb,
        universalUrl: liWeb
      }
    }

    // WhatsApp：universal 用 api.whatsapp.com，内置浏览器里比 whatsapp:// 更稳
    var phone = id.replace(/\D/g, '')
    var query = 'phone=' + encodeURIComponent(phone) + '&text=' + encodedText
    var apiUrl = 'https://api.whatsapp.com/send?' + query
    var webHost = isMobile() ? apiUrl : ('https://web.whatsapp.com/send?' + query)
    return {
      appUrl: 'whatsapp://send?' + query,
      webUrl: webHost,
      universalUrl: apiUrl
    }
  }

  /**
   * 从链接节点读取渠道、账户与预填文案
   * @param {HTMLAnchorElement} link 链接节点
   * @returns {{ channel: string, account: string, text: string }}
   */
  function readLinkParams(link) {
    var channel = (link.getAttribute('data-channel') || 'whatsapp').toLowerCase()
    var account = link.getAttribute('data-account')
      || link.getAttribute('data-phone')
      || DEFAULT_ACCOUNT
    return {
      channel: channel,
      account: account,
      text: link.getAttribute('data-text') || DEFAULT_TEXT
    }
  }

  /**
   * 尝试唤起对应 App（尽量不离开当前页）
   * @param {string} appUrl App 协议链接
   */
  function tryOpenApp(appUrl) {
    if (isMobile()) {
      window.location.href = appUrl
      return
    }

    var anchor = document.createElement('a')
    anchor.href = appUrl
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  /**
   * Android 通过 Intent 尝试跳出内置浏览器打开目标
   * @param {string} httpsUrl https 目标地址
   * @param {string} [pkg] 可选目标包名（如 com.whatsapp）
   * @returns {boolean} 是否已发起 Intent
   */
  function tryAndroidIntent(httpsUrl, pkg) {
    if (!isAndroid()) {
      return false
    }
    var stripped = httpsUrl.replace(/^https?:\/\//, '')
    var intentUrl = 'intent://' + stripped + '#Intent;scheme=https;action=android.intent.action.VIEW;'
    if (pkg) {
      intentUrl += 'package=' + pkg + ';'
    }
    intentUrl += 'S.browser_fallback_url=' + encodeURIComponent(httpsUrl) + ';end'
    window.location.href = intentUrl
    return true
  }

  /**
   * 读取当前站点语言（依赖 SolanI18n，缺省英文）
   * @returns {string}
   */
  function getUiLang() {
    if (global.SolanI18n && typeof global.SolanI18n.getStoredLang === 'function') {
      return global.SolanI18n.getStoredLang() || 'en'
    }
    return 'en'
  }

  /**
   * 从翻译表取文案，缺失时回退英文再回退中文
   * @param {string} lang 语言代码
   * @param {string} key 文案 key
   * @returns {string}
   */
  function t(lang, key) {
    var table = global.SolanTranslations || {}
    var dict = table[lang] || {}
    if (dict[key] != null && dict[key] !== '') {
      return dict[key]
    }
    if (table.en && table.en[key] != null) {
      return table.en[key]
    }
    if (table.zh && table.zh[key] != null) {
      return table.zh[key]
    }
    return ''
  }

  /**
   * 将 {channel} 占位符替换为渠道名
   * @param {string} text 模板文案
   * @param {string} channelLabel 渠道显示名
   * @returns {string}
   */
  function withChannel(text, channelLabel) {
    return String(text || '').split('{channel}').join(channelLabel)
  }

  /**
   * 中文与当前语言并排；若相同则只显示一条
   * @param {string} zhText 中文
   * @param {string} langText 当前语言文案
   * @returns {string}
   */
  function pairZhAndLang(zhText, langText) {
    if (!langText || langText === zhText) {
      return zhText || langText || ''
    }
    if (!zhText) {
      return langText
    }
    return zhText + ' / ' + langText
  }

  /**
   * 解析渠道显示名（聊天默认 Messenger；主页用 Facebook）
   * @param {string} channel 渠道名
   * @param {string} [labelOverride] 可选覆盖名
   * @returns {string}
   */
  function resolveChannelLabel(channel, labelOverride) {
    if (labelOverride) {
      return labelOverride
    }
    if (channel === 'facebook') {
      return 'Messenger'
    }
    if (channel === 'linkedin') {
      return 'LinkedIn'
    }
    if (channel === 'instagram') {
      return 'Instagram'
    }
    return 'WhatsApp'
  }

  /**
   * 获取引导层文案：始终含中文，并附加当前所选语言
   * @param {string} channel 渠道名
   * @param {string} [labelOverride] 渠道显示名覆盖
   * @returns {{ title: string, tipZh: string, tipLang: string, showTipLang: boolean, copy: string, open: string, close: string, copied: string, prompt: string }}
   */
  function getGuideCopy(channel, labelOverride) {
    var channelLabel = resolveChannelLabel(channel, labelOverride)
    var tipKey = isWeChat() ? 'chatGuide.tipWeChat' : 'chatGuide.tipInApp'
    var uiLang = getUiLang()

    var tipZh = withChannel(t('zh', tipKey), channelLabel)
    var tipLang = withChannel(t(uiLang, tipKey), channelLabel)
    var titleZh = withChannel(t('zh', 'chatGuide.title'), channelLabel)
    var titleLang = withChannel(t(uiLang, 'chatGuide.title'), channelLabel)

    return {
      title: pairZhAndLang(titleZh, titleLang),
      tipZh: tipZh,
      tipLang: tipLang,
      showTipLang: !!(tipLang && tipLang !== tipZh),
      copy: pairZhAndLang(t('zh', 'chatGuide.copy'), t(uiLang, 'chatGuide.copy')),
      open: pairZhAndLang(t('zh', 'chatGuide.open'), t(uiLang, 'chatGuide.open')),
      close: pairZhAndLang(t('zh', 'chatGuide.close'), t(uiLang, 'chatGuide.close')),
      copied: pairZhAndLang(t('zh', 'chatGuide.copied'), t(uiLang, 'chatGuide.copied')),
      prompt: pairZhAndLang(t('zh', 'chatGuide.prompt'), t(uiLang, 'chatGuide.prompt'))
    }
  }

  /**
   * 展示内置浏览器引导层：中文 + 当前所选语言
   * @param {string} url 可复制的目标链接
   * @param {string} channel 渠道名
   * @param {string} [labelOverride] 渠道显示名覆盖
   * @param {string} [pkg] Android 包名（Intent 用）
   */
  function showInAppGuide(url, channel, labelOverride, pkg) {
    var existing = document.getElementById('solan-inapp-guide')
    if (existing) {
      existing.parentNode.removeChild(existing)
    }

    var copy = getGuideCopy(channel, labelOverride)
    var tipLangHtml = copy.showTipLang
      ? '  <p class="solan-inapp-guide__desc solan-inapp-guide__desc--lang">' + copy.tipLang + '</p>'
      : ''

    var mask = document.createElement('div')
    mask.id = 'solan-inapp-guide'
    mask.className = 'solan-inapp-guide'
    mask.innerHTML = [
      '<div class="solan-inapp-guide__panel" role="dialog" aria-modal="true" aria-labelledby="solan-inapp-guide-title">',
      '  <p class="solan-inapp-guide__title" id="solan-inapp-guide-title">' + copy.title + '</p>',
      '  <p class="solan-inapp-guide__desc">' + copy.tipZh + '</p>',
      tipLangHtml,
      '  <div class="solan-inapp-guide__actions">',
      // '    <button type="button" class="solan-inapp-guide__btn solan-inapp-guide__btn--primary" data-action="copy">' + copy.copy + '</button>',
      // '    <button type="button" class="solan-inapp-guide__btn" data-action="open">' + copy.open + '</button>',
      '    <button type="button" class="solan-inapp-guide__btn solan-inapp-guide__btn--ghost" data-action="close">' + copy.close + '</button>',
      '  </div>',
      '</div>'
    ].join('')

    /**
     * 关闭引导层
     */
    function closeGuide() {
      if (mask.parentNode) {
        mask.parentNode.removeChild(mask)
      }
    }

    mask.addEventListener('click', function (e) {
      var actionEl = e.target.closest ? e.target.closest('[data-action]') : null
      if (!actionEl) {
        if (e.target === mask) {
          closeGuide()
        }
        return
      }
      var action = actionEl.getAttribute('data-action')
      if (action === 'close') {
        closeGuide()
        return
      }
      if (action === 'copy') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            actionEl.textContent = copy.copied
          }).catch(function () {
            window.prompt(copy.prompt, url)
          })
        } else {
          window.prompt(copy.prompt, url)
        }
        return
      }
      if (action === 'open') {
        closeGuide()
        // 内置浏览器中优先走 https 通用链接；Android 再尝试 Intent
        var intentPkg = pkg || (channel === 'whatsapp' ? 'com.whatsapp' : '')
        if (!(isAndroid() && tryAndroidIntent(url, intentPkg))) {
          window.location.href = url
        }
      }
    })

    document.body.appendChild(mask)
  }

  /**
   * 先尝试 App，超时仍在页内则打开网页
   * @param {{ appUrl: string, webUrl: string, universalUrl?: string, pkg?: string }} urls 链接集合
   * @param {string} channel 渠道名
   * @param {string} [labelOverride] 引导层显示名
   */
  function openAppThenWeb(urls, channel, labelOverride) {
    var webTarget = urls.universalUrl || urls.webUrl

    // 微信 / 抖音 / FB 等内置浏览器：自定义协议和 window.open 常被拦截
    if (isInAppBrowser()) {
      showInAppGuide(webTarget, channel, labelOverride, urls.pkg || '')
      if (isAndroid() && urls.pkg) {
        tryAndroidIntent(webTarget, urls.pkg)
      } else if (isAndroid() && channel === 'whatsapp') {
        tryAndroidIntent(webTarget, 'com.whatsapp')
      }
      return
    }

    var openedByApp = false
    var settled = false

    /**
     * 清理监听与定时器
     */
    function cleanup() {
      if (settled) {
        return
      }
      settled = true
      window.clearTimeout(timer)
      window.removeEventListener('blur', markAppOpened)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }

    /**
     * 页面失焦 / 隐藏时，认为 App 已唤起成功
     */
    function markAppOpened() {
      openedByApp = true
      cleanup()
    }

    /**
     * 可见性变化：切到后台视为 App 已打开
     */
    function onVisibilityChange() {
      if (document.hidden) {
        markAppOpened()
      }
    }

    window.addEventListener('blur', markAppOpened)
    document.addEventListener('visibilitychange', onVisibilityChange)

    tryOpenApp(urls.appUrl)

    var timer = window.setTimeout(function () {
      cleanup()
      if (!openedByApp) {
        window.open(urls.webUrl, '_blank', 'noopener,noreferrer')
      }
    }, APP_TIMEOUT_MS)
  }

  /**
   * 按渠道拼接主页 App / Web 链接
   * @param {string} channel facebook | linkedin | instagram
   * @param {string} profile 用户名 / 主页名
   * @param {string} [webUrl] 网页兜底地址
   * @returns {{ appUrl: string, webUrl: string, universalUrl: string, pkg: string }}
   */
  function buildProfileUrls(channel, profile, webUrl) {
    var id = String(profile || '').replace(/^@/, '').replace(/\s/g, '')
    var web = webUrl || ''

    if (channel === 'instagram') {
      var igWeb = web || ('https://www.instagram.com/' + encodeURIComponent(id) + '/')
      return {
        appUrl: 'instagram://user?username=' + encodeURIComponent(id),
        webUrl: igWeb,
        universalUrl: igWeb,
        pkg: 'com.instagram.android'
      }
    }

    if (channel === 'linkedin') {
      var liWeb = web || ('https://www.linkedin.com/in/' + encodeURIComponent(id) + '/')
      return {
        appUrl: 'linkedin://in/' + encodeURIComponent(id),
        webUrl: liWeb,
        universalUrl: liWeb,
        pkg: 'com.linkedin.android'
      }
    }

    var fbWeb = web || ('https://www.facebook.com/' + encodeURIComponent(id) + '/')
    return {
      appUrl: 'fb://facewebmodal/f?href=' + encodeURIComponent(fbWeb),
      webUrl: fbWeb,
      universalUrl: fbWeb,
      pkg: 'com.facebook.katana'
    }
  }

  /**
   * 打开社交主页：先尝试 App，超时未切换则打开网页
   * @param {string} channel 渠道名
   * @param {string} profile 用户名 / 主页名
   * @param {string} [webUrl] 网页兜底地址
   */
  function openProfile(channel, profile, webUrl) {
    var targetChannel = (channel || 'facebook').toLowerCase()
    var urls = buildProfileUrls(targetChannel, profile, webUrl)
    var label = targetChannel === 'facebook'
      ? 'Facebook'
      : (targetChannel === 'linkedin' ? 'LinkedIn' : 'Instagram')
    openAppThenWeb(urls, targetChannel, label)
  }

  /**
   * 打开指定渠道聊天：先尝试 App，超时未切换则打开 Web 版
   * @param {string} channel 渠道名
   * @param {string} [account] 账户标识
   * @param {string} [text] 预填消息
   */
  function openChat(channel, account, text) {
    var targetChannel = (channel || 'whatsapp').toLowerCase()
    var targetAccount = account || DEFAULT_ACCOUNT
    var targetText = text || DEFAULT_TEXT
    var urls = buildUrls(targetChannel, targetAccount, targetText)
    openAppThenWeb(urls, targetChannel)
  }

  /**
   * 判断节点是否为社交聊天链接
   * @param {Element|null} el 事件目标
   * @returns {HTMLAnchorElement|null}
   */
  function findChatLink(el) {
    if (!el || !el.closest) {
      return null
    }
    return el.closest('a.js-social-chat, a.js-whatsapp-chat')
  }

  /**
   * 判断节点是否为社交主页链接
   * @param {Element|null} el 事件目标
   * @returns {HTMLAnchorElement|null}
   */
  function findProfileLink(el) {
    if (!el || !el.closest) {
      return null
    }
    return el.closest('a.js-social-profile')
  }

  /**
   * 从主页链接节点读取渠道与标识
   * @param {HTMLAnchorElement} link 链接节点
   * @returns {{ channel: string, profile: string, webUrl: string }}
   */
  function readProfileParams(link) {
    return {
      channel: (link.getAttribute('data-channel') || 'facebook').toLowerCase(),
      profile: link.getAttribute('data-profile') || '',
      webUrl: link.getAttribute('href') || ''
    }
  }

  /**
   * 拦截社交聊天 / 主页链接点击
   */
  function bindChatLinks() {
    document.addEventListener('click', function (e) {
      var profileLink = findProfileLink(e.target)
      if (profileLink) {
        e.preventDefault()
        var profileParams = readProfileParams(profileLink)
        openProfile(profileParams.channel, profileParams.profile, profileParams.webUrl)
        return
      }

      var link = findChatLink(e.target)
      if (!link) {
        return
      }
      e.preventDefault()
      var params = readLinkParams(link)
      openChat(params.channel, params.account, params.text)
    })
  }

  global.SolanSocialChat = {
    openChat: openChat,
    openProfile: openProfile,
    bindChatLinks: bindChatLinks,
    buildUrls: buildUrls,
    buildProfileUrls: buildProfileUrls,
    isInAppBrowser: isInAppBrowser,
    isWeChat: isWeChat,
    DEFAULT_ACCOUNT: DEFAULT_ACCOUNT
  }

  // 兼容旧调用名
  global.SolanWhatsApp = {
    openChat: function (phone, text) {
      openChat('whatsapp', phone, text)
    },
    bindChatLinks: bindChatLinks,
    init: bindChatLinks,
    buildUrls: function (phone, text) {
      return buildUrls('whatsapp', phone, text)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindChatLinks)
  } else {
    bindChatLinks()
  }
})(window)
