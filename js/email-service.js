// NaviBatch 邮件服务 - 替代 EmailJS
// 支持多种邮件发送方式

class EmailService {
    constructor() {
        this.endpoints = {
            cloudflare: 'https://navibatch-email.jasonkwok2018.workers.dev',
            formspree: 'https://formspree.io/f/YOUR_FORM_ID', // 需要替换为实际的 Form ID
            netlify: '/.netlify/functions/send-email', // Netlify Functions
            backup: 'mailto:info@navibatch.com' // 备用方案
        };
        this.currentMethod = 'cloudflare'; // 默认使用 Cloudflare Worker
    }

    // 发送邮件的主要方法
    async sendEmail(formData) {
        try {
            switch (this.currentMethod) {
                case 'cloudflare':
                    return await this.sendViaCloudflare(formData);
                case 'formspree':
                    return await this.sendViaFormspree(formData);
                case 'netlify':
                    return await this.sendViaNetlify(formData);
                default:
                    return await this.sendViaCloudflare(formData);
            }
        } catch (error) {
            console.warn(`Failed to send via ${this.currentMethod}:`, error);
            // 尝试备用方案
            return await this.fallbackToMailto(formData);
        }
    }

    // 通过 Cloudflare Worker 发送
    async sendViaCloudflare(formData) {
        const response = await fetch(this.endpoints.cloudflare, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Unknown error');
        }

        return result;
    }

    // 通过 Formspree 发送
    async sendViaFormspree(formData) {
        const response = await fetch(this.endpoints.formspree, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
                _replyto: formData.email,
                _subject: `NaviBatch Contact: ${formData.subject || formData.inquiry_type}`
            })
        });

        if (!response.ok) {
            throw new Error(`Formspree error! status: ${response.status}`);
        }

        return { success: true, message: 'Email sent via Formspree' };
    }

    // 通过 Netlify Functions 发送
    async sendViaNetlify(formData) {
        const response = await fetch(this.endpoints.netlify, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Netlify error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    }

    // 备用方案：使用 mailto
    async fallbackToMailto(formData) {
        const subject = encodeURIComponent(`NaviBatch Contact: ${formData.subject || formData.inquiry_type}`);
        const body = encodeURIComponent(`
Name: ${formData.name}
Email: ${formData.email}
Inquiry Type: ${formData.inquiry_type || 'General'}
Time: ${new Date().toLocaleString()}

Message:
${formData.message}
        `);

        const toEmail = formData.inquiry_type === 'technical' ? 'supports@navibatch.com' : 'info@navibatch.com';
        const mailtoUrl = `mailto:${toEmail}?subject=${subject}&body=${body}`;
        
        window.open(mailtoUrl);
        
        return { 
            success: true, 
            message: 'Email client opened. Please send the email manually.',
            method: 'mailto'
        };
    }

    // 切换邮件发送方法
    setMethod(method) {
        if (this.endpoints[method]) {
            this.currentMethod = method;
            console.log(`Email service switched to: ${method}`);
        } else {
            console.warn(`Unknown email method: ${method}`);
        }
    }

    // 测试邮件服务连接
    async testConnection() {
        try {
            const testData = {
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Connection Test',
                message: 'This is a test message to verify email service connectivity.',
                inquiry_type: 'general'
            };

            const result = await this.sendEmail(testData);
            console.log('Email service test successful:', result);
            return true;
        } catch (error) {
            console.error('Email service test failed:', error);
            return false;
        }
    }
}

// 创建全局邮件服务实例
window.emailService = new EmailService();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
}
