/**
 * 询盘表单（无后端）：通过 mailto 打开访客邮箱客户端，预填内容发到指定邮箱
 * 说明：浏览器无法静默发信，需访客在邮件客户端中确认发送
 */
(function (global) {
  /** 接收询盘的目标邮箱 */
  var TO_EMAIL = 'shelly@solanactive.com'

  /**
   * 读取当前站点语言
   * @returns {string}
   */
  function getUiLang() {
    if (global.SolanI18n && typeof global.SolanI18n.getStoredLang === 'function') {
      return global.SolanI18n.getStoredLang() || 'en'
    }
    return 'en'
  }

  /**
   * 从翻译表取文案
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
   * 中文与当前语言并排显示
   * @param {string} key 文案 key
   * @returns {string}
   */
  function pairAlert(key) {
    var zhText = t('zh', key)
    var langText = t(getUiLang(), key)
    if (!langText || langText === zhText) {
      return zhText || langText || key
    }
    if (!zhText) {
      return langText
    }
    return zhText + '\n\n' + langText
  }

  /**
   * 从表单收集询盘字段
   * @param {HTMLFormElement} form 表单节点
   * @returns {object|null} 校验失败时返回 null
   */
  function collectInquiry(form) {
    var name = (form.name.value || '').trim()
    var email = (form.email.value || '').trim()
    var demand = (form.demand.value || '').trim()
    var message = (form.message.value || '').trim()

    if (!email) {
      alert(pairAlert('inquiry.emailRequired'))
      form.email.focus()
      return null
    }

    return {
      name: name,
      email: email,
      demand: demand,
      message: message
    }
  }

  /**
   * 将询盘内容拼成邮件正文
   * @param {object} inquiry 询盘数据
   * @returns {string}
   */
  function buildMailBody(inquiry) {
    return [
      'Name / Company: ' + (inquiry.name || '-'),
      'Email: ' + inquiry.email,
      'Product demand / Quantity: ' + (inquiry.demand || '-'),
      '',
      'Custom requirements / Target market:',
      inquiry.message || '-',
      '',
      '---',
      'Sent from Solan website inquiry form'
    ].join('\n')
  }

  /**
   * 打开系统邮件客户端，预填收件人、主题与正文
   * @param {object} inquiry 询盘数据
   */
  function openMailClient(inquiry) {
    var subject = encodeURIComponent(
      'Website Inquiry' + (inquiry.name ? ' - ' + inquiry.name : '')
    )
    var body = encodeURIComponent(buildMailBody(inquiry))
    var mailto =
      'mailto:' +
      encodeURIComponent(TO_EMAIL) +
      '?subject=' +
      subject +
      '&body=' +
      body

    window.location.href = mailto
  }

  /**
   * 提交询盘：校验后唤起邮件客户端
   * @param {HTMLFormElement} form 表单节点
   * @returns {boolean} 是否已唤起邮件
   */
  function submitInquiry(form) {
    var inquiry = collectInquiry(form)
    if (!inquiry) {
      return false
    }
    openMailClient(inquiry)
    return true
  }

  /**
   * 绑定询盘表单提交事件
   * @param {string} formId 表单元素 id
   */
  function bindInquiryForm(formId) {
    var form = document.getElementById(formId)
    if (!form) {
      return
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      if (submitInquiry(form)) {
        // 不立刻 reset，避免部分浏览器取消 mailto；提示用户在邮件里点发送
        alert(pairAlert('inquiry.mailOpened'))
      }
    })
  }

  global.SolanInquiry = {
    TO_EMAIL: TO_EMAIL,
    submitInquiry: submitInquiry,
    bindInquiryForm: bindInquiryForm
  }
})(window)
