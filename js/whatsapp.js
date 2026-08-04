/**
 * 社交聊天唤起：WhatsApp / Facebook Messenger / LinkedIn
 * 优先打开本地 App，失败则跳转 Web 聊天页
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
   * 获取引导层中英双语文案
   * @param {string} channel 渠道名
   * @returns {{ title: string, tipZh: string, tipEn: string, copy: string, open: string, close: string, copied: string, prompt: string }}
   */
  function getGuideCopy(channel) {
    var channelLabel = channel === 'facebook'
      ? 'Messenger'
      : (channel === 'linkedin' ? 'LinkedIn' : 'WhatsApp')

    var tipZh = isWeChat()
      ? '当前在微信内打开，无法直接唤起 ' + channelLabel + '。请点击右上角 ···，选择“在浏览器中打开”，再点击联系按钮。'
      : '当前在 App 内置浏览器中打开，可能无法直接唤起 ' + channelLabel + '。请用系统浏览器（Safari / Chrome）打开本站后再试。'

    var tipEn = isWeChat()
      ? 'Opened in WeChat. ' + channelLabel + ' cannot be launched directly. Tap ··· at the top right, choose “Open in Browser”, then try the contact button again.'
      : 'Opened in an in-app browser. ' + channelLabel + ' may be blocked. Please open this site in Safari / Chrome, then try again.'

    return {
      title: '无法直接打开 ' + channelLabel + ' / Unable to open ' + channelLabel,
      tipZh: tipZh,
      tipEn: tipEn,
      copy: '复制聊天链接 / Copy chat link',
      open: '仍要尝试打开 / Try opening anyway',
      close: '关闭 / Close',
      copied: '已复制 / Copied',
      prompt: '请手动复制链接 / Please copy the link manually:'
    }
  }

  /**
   * 展示内置浏览器引导层：请用系统浏览器打开（中英双语）
   * @param {string} url 可复制的目标链接
   * @param {string} channel 渠道名
   */
  function showInAppGuide(url, channel) {
    var existing = document.getElementById('solan-inapp-guide')
    if (existing) {
      existing.parentNode.removeChild(existing)
    }

    var copy = getGuideCopy(channel)

    var mask = document.createElement('div')
    mask.id = 'solan-inapp-guide'
    mask.className = 'solan-inapp-guide'
    mask.innerHTML = [
      '<div class="solan-inapp-guide__panel" role="dialog" aria-modal="true" aria-labelledby="solan-inapp-guide-title">',
      '  <p class="solan-inapp-guide__title" id="solan-inapp-guide-title">' + copy.title + '</p>',
      '  <p class="solan-inapp-guide__desc">' + copy.tipZh + '</p>',
      '  <p class="solan-inapp-guide__desc solan-inapp-guide__desc--en">' + copy.tipEn + '</p>',
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
        if (!(isAndroid() && tryAndroidIntent(url, channel === 'whatsapp' ? 'com.whatsapp' : ''))) {
          window.location.href = url
        }
      }
    })

    document.body.appendChild(mask)
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

    // 微信 / 抖音 / FB 等内置浏览器：自定义协议和 window.open 常被拦截
    if (isInAppBrowser()) {
      showInAppGuide(urls.universalUrl || urls.webUrl, targetChannel)
      // Android 微信额外尝试 Intent 跳出（不保证成功）
      if (isAndroid() && targetChannel === 'whatsapp') {
        tryAndroidIntent(urls.universalUrl, 'com.whatsapp')
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
   * 拦截社交聊天链接点击
   */
  function bindChatLinks() {
    document.addEventListener('click', function (e) {
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
    bindChatLinks: bindChatLinks,
    buildUrls: buildUrls,
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
