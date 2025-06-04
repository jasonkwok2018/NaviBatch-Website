/**
 * Cookie同意管理器
 * 符合GDPR、CCPA等隐私法规要求
 */

class CookieConsent {
    constructor() {
        this.cookieName = 'navibatch_cookie_consent';
        this.cookieExpiry = 365; // 天数
        this.consentData = {
            necessary: true,    // 必要Cookie，始终启用
            analytics: false,   // 分析Cookie
            marketing: false,   // 营销Cookie
            functional: false   // 功能Cookie
        };
        
        this.init();
    }

    init() {
        // 检查是否已有同意记录
        const existingConsent = this.getCookieConsent();
        
        if (!existingConsent) {
            // 延迟显示横幅，确保页面加载完成
            setTimeout(() => {
                this.showConsentBanner();
            }, 1000);
        } else {
            // 应用已保存的同意设置
            this.consentData = { ...this.consentData, ...existingConsent };
            this.applyConsentSettings();
        }
        
        this.createConsentBanner();
        this.createSettingsModal();
        this.bindEvents();
    }

    createConsentBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-consent';
        banner.id = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'cookie-consent-title');
        banner.setAttribute('aria-describedby', 'cookie-consent-description');
        
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h4 id="cookie-consent-title">🍪 We use cookies</h4>
                    <p id="cookie-consent-description">
                        We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. 
                        By clicking "Accept All", you consent to our use of cookies. 
                        <a href="privacy.html" target="_blank">Privacy Policy</a>
                    </p>
                </div>
                <div class="cookie-consent-actions">
                    <button class="cookie-btn cookie-btn-settings" id="cookie-settings-btn" aria-label="Customize cookie settings">
                        Settings
                    </button>
                    <button class="cookie-btn cookie-btn-decline" id="cookie-decline-btn" aria-label="Decline non-essential cookies">
                        Decline
                    </button>
                    <button class="cookie-btn cookie-btn-accept" id="cookie-accept-btn" aria-label="Accept all cookies">
                        Accept All
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'cookie-settings-modal';
        modal.id = 'cookie-settings-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'cookie-settings-title');
        modal.setAttribute('aria-modal', 'true');
        
        modal.innerHTML = `
            <div class="cookie-settings-content">
                <div class="cookie-settings-header">
                    <h3 id="cookie-settings-title">Cookie Settings</h3>
                    <button class="cookie-close" id="cookie-settings-close" aria-label="Close cookie settings">
                        ×
                    </button>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Necessary Cookies</h4>
                        <div class="cookie-toggle disabled">
                            <input type="checkbox" checked disabled>
                            <span class="cookie-toggle-slider"></span>
                        </div>
                    </div>
                    <p>These cookies are essential for the website to function properly. They enable basic features like page navigation and access to secure areas.</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Analytics Cookies</h4>
                        <div class="cookie-toggle">
                            <input type="checkbox" id="analytics-toggle">
                            <span class="cookie-toggle-slider"></span>
                        </div>
                    </div>
                    <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Marketing Cookies</h4>
                        <div class="cookie-toggle">
                            <input type="checkbox" id="marketing-toggle">
                            <span class="cookie-toggle-slider"></span>
                        </div>
                    </div>
                    <p>These cookies are used to deliver advertisements more relevant to you and your interests.</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Functional Cookies</h4>
                        <div class="cookie-toggle">
                            <input type="checkbox" id="functional-toggle">
                            <span class="cookie-toggle-slider"></span>
                        </div>
                    </div>
                    <p>These cookies enable enhanced functionality and personalization, such as remembering your preferences.</p>
                </div>
                
                <div class="cookie-settings-actions">
                    <button class="cookie-btn cookie-btn-decline" id="cookie-save-decline">
                        Save & Decline
                    </button>
                    <button class="cookie-btn cookie-btn-accept" id="cookie-save-accept">
                        Save & Accept
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    bindEvents() {
        // 横幅按钮事件
        document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
            this.acceptAllCookies();
        });
        
        document.getElementById('cookie-decline-btn')?.addEventListener('click', () => {
            this.declineAllCookies();
        });
        
        document.getElementById('cookie-settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        // 设置模态框事件
        document.getElementById('cookie-settings-close')?.addEventListener('click', () => {
            this.hideSettingsModal();
        });
        
        document.getElementById('cookie-save-accept')?.addEventListener('click', () => {
            this.saveCustomSettings(true);
        });
        
        document.getElementById('cookie-save-decline')?.addEventListener('click', () => {
            this.saveCustomSettings(false);
        });
        
        // 模态框背景点击关闭
        document.getElementById('cookie-settings-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-settings-modal') {
                this.hideSettingsModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSettingsModal();
            }
        });
    }

    showConsentBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.add('show');
            // 聚焦到横幅以提高无障碍性
            banner.focus();
        }
    }

    hideConsentBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }
    }

    showSettingsModal() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            // 设置当前状态
            document.getElementById('analytics-toggle').checked = this.consentData.analytics;
            document.getElementById('marketing-toggle').checked = this.consentData.marketing;
            document.getElementById('functional-toggle').checked = this.consentData.functional;
            
            modal.classList.add('show');
            // 聚焦到模态框
            modal.querySelector('.cookie-settings-content').focus();
        }
    }

    hideSettingsModal() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    acceptAllCookies() {
        this.consentData = {
            necessary: true,
            analytics: true,
            marketing: true,
            functional: true
        };
        
        this.saveConsent();
        this.hideConsentBanner();
        this.applyConsentSettings();
        this.showConsentMessage('All cookies accepted');
    }

    declineAllCookies() {
        this.consentData = {
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false
        };
        
        this.saveConsent();
        this.hideConsentBanner();
        this.applyConsentSettings();
        this.showConsentMessage('Non-essential cookies declined');
    }

    saveCustomSettings(acceptSelected = false) {
        if (acceptSelected) {
            this.consentData.analytics = document.getElementById('analytics-toggle').checked;
            this.consentData.marketing = document.getElementById('marketing-toggle').checked;
            this.consentData.functional = document.getElementById('functional-toggle').checked;
        } else {
            this.consentData.analytics = false;
            this.consentData.marketing = false;
            this.consentData.functional = false;
        }
        
        this.saveConsent();
        this.hideSettingsModal();
        this.hideConsentBanner();
        this.applyConsentSettings();
        this.showConsentMessage('Cookie preferences saved');
    }

    saveConsent() {
        const consentString = JSON.stringify({
            ...this.consentData,
            timestamp: Date.now(),
            version: '1.0'
        });
        
        this.setCookie(this.cookieName, consentString, this.cookieExpiry);
    }

    getCookieConsent() {
        const consent = this.getCookie(this.cookieName);
        if (consent) {
            try {
                const parsed = JSON.parse(consent);
                // 检查同意是否过期（1年）
                if (parsed.timestamp && (Date.now() - parsed.timestamp) > (365 * 24 * 60 * 60 * 1000)) {
                    this.deleteCookie(this.cookieName);
                    return null;
                }
                return parsed;
            } catch (e) {
                console.warn('Invalid cookie consent data');
                return null;
            }
        }
        return null;
    }

    applyConsentSettings() {
        // 根据同意设置启用/禁用各种服务
        
        // 分析Cookie (Google Analytics等)
        if (this.consentData.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        
        // 营销Cookie
        if (this.consentData.marketing) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }
        
        // 功能Cookie
        if (this.consentData.functional) {
            this.enableFunctional();
        } else {
            this.disableFunctional();
        }
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
            detail: this.consentData
        }));
    }

    enableAnalytics() {
        // 这里可以启用Google Analytics或其他分析工具
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('📊 [NaviBatch] Analytics enabled');
        }
        
        // 示例：启用Google Analytics
        // if (typeof gtag !== 'undefined') {
        //     gtag('consent', 'update', {
        //         'analytics_storage': 'granted'
        //     });
        // }
    }

    disableAnalytics() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🚫 [NaviBatch] Analytics disabled');
        }
        
        // 示例：禁用Google Analytics
        // if (typeof gtag !== 'undefined') {
        //     gtag('consent', 'update', {
        //         'analytics_storage': 'denied'
        //     });
        // }
    }

    enableMarketing() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🎯 [NaviBatch] Marketing enabled');
        }
    }

    disableMarketing() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🚫 [NaviBatch] Marketing disabled');
        }
    }

    enableFunctional() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('⚙️ [NaviBatch] Functional cookies enabled');
        }
    }

    disableFunctional() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🚫 [NaviBatch] Functional cookies disabled');
        }
    }

    showConsentMessage(message) {
        // 显示简短的确认消息
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00A3FF;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10002;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 163, 255, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Cookie工具方法
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    // 公共API方法
    updateConsent(newConsent) {
        this.consentData = { ...this.consentData, ...newConsent };
        this.saveConsent();
        this.applyConsentSettings();
    }

    getConsent() {
        return { ...this.consentData };
    }

    resetConsent() {
        this.deleteCookie(this.cookieName);
        location.reload();
    }
}

// 初始化Cookie同意管理器
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
    
    // 添加Cookie设置快捷方式
    addCookieSettingsLink();
});

// 添加Cookie设置链接到页脚
function addCookieSettingsLink() {
    const footer = document.querySelector('.footer-bottom .copyright');
    if (footer && !footer.querySelector('.cookie-settings-link')) {
        const cookieLink = document.createElement('span');
        cookieLink.innerHTML = ' | <a href="#" class="cookie-settings-link" style="color: #00A3FF; text-decoration: none;">Cookie Settings</a>';
        footer.appendChild(cookieLink);
        
        // 绑定点击事件
        cookieLink.querySelector('.cookie-settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            if (window.cookieConsent) {
                window.cookieConsent.showSettingsModal();
            }
        });
    }
}

// 导出给其他脚本使用
window.CookieConsent = CookieConsent;