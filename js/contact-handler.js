// 联系表单处理器 - 多种邮件发送方案
class ContactFormHandler {
    constructor() {
        this.endpoints = {
            // 使用免费的 EmailJS 服务
            emailjs: {
                url: 'https://api.emailjs.com/api/v1.0/email/send',
                serviceId: 'service_navibatch',
                templateId: 'template_contact',
                userId: 'user_navibatch'
            },
            // 备用 Worker
            worker: 'https://navibatch-email.jasonkwok2018.workers.dev',
            // 最终备用方案
            mailto: true
        };
    }

    async handleSubmit(event) {
        event.preventDefault();

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            // 禁用提交按钮
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // 获取表单数据
            const formData = this.getFormData();

            // 验证表单
            if (!this.validateForm(formData)) {
                return;
            }

            // 尝试发送邮件
            const success = await this.sendEmail(formData);

            if (success) {
                this.showSuccess();
                this.resetForm();
            } else {
                this.showError(formData);
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(this.getFormData());
        } finally {
            // 恢复提交按钮
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    getFormData() {
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            inquiryType: document.getElementById('inquiry-type').value,
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        // 添加图片数据（如果有的话）
        if (typeof uploadedImages !== 'undefined' && uploadedImages.length > 0) {
            formData.images = uploadedImages.map(imageData => ({
                name: imageData.name,
                content: imageData.dataUrl.split(',')[1], // 移除data:image/...;base64,前缀
                size: imageData.size,
                type: imageData.file.type
            }));

            // 在消息中添加图片信息
            const imageInfo = uploadedImages.map((img, index) =>
                `Image ${index + 1}: ${img.name} (${this.formatFileSize(img.size)})`
            ).join('\n');

            formData.message += `\n\n--- Attached Images ---\n${imageInfo}\n\nNote: Images are attached as base64 data. Please contact the user directly for full resolution images if needed.`;
        }

        return formData;
    }

    validateForm(data) {
        if (!data.name || !data.email || !data.inquiryType || !data.message) {
            alert('Please fill in all required fields.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            alert('Please enter a valid email address.');
            return false;
        }

        return true;
    }

    async sendEmail(formData) {
        // 方法1: 尝试使用 Worker
        try {
            const response = await fetch(this.endpoints.worker, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    time: new Date().toLocaleString()
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return true;
                }
            }
        } catch (error) {
            console.warn('Worker method failed:', error);
        }

        // 方法2: 使用 EmailJS (如果配置了)
        try {
            if (typeof emailjs !== 'undefined') {
                const response = await emailjs.send(
                    this.endpoints.emailjs.serviceId,
                    this.endpoints.emailjs.templateId,
                    {
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject || formData.inquiryType,
                        message: formData.message,
                        inquiry_type: formData.inquiryType,
                        time: new Date().toLocaleString()
                    },
                    this.endpoints.emailjs.userId
                );

                if (response.status === 200) {
                    return true;
                }
            }
        } catch (error) {
            console.warn('EmailJS method failed:', error);
        }

        // 如果所有方法都失败，返回 false
        return false;
    }

    showSuccess() {
        alert('Your message has been sent successfully! We will respond as soon as possible.');
    }

    showError(formData) {
        const toEmail = formData.inquiryType === 'technical' ? 'supports@navibatch.com' : 'info@navibatch.com';

        const userChoice = confirm(
            'We\'re having trouble sending your message automatically.\n\n' +
            'Would you like to:\n' +
            '• Click "OK" to open your email client\n' +
            '• Click "Cancel" to copy the email information'
        );

        if (userChoice) {
            this.openEmailClient(formData, toEmail);
        } else {
            this.copyEmailInfo(formData, toEmail);
        }
    }

    openEmailClient(formData, toEmail) {
        const subject = formData.subject || `NaviBatch Contact: ${formData.inquiryType}`;
        const body = this.formatEmailBody(formData);

        const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            window.open(mailtoUrl);
            alert('Your email client should now be open with your message pre-filled.');
        } catch (error) {
            alert(`Please send an email manually to: ${toEmail}`);
        }
    }

    copyEmailInfo(formData, toEmail) {
        const subject = formData.subject || `NaviBatch Contact: ${formData.inquiryType}`;
        const body = this.formatEmailBody(formData);

        const emailInfo = `To: ${toEmail}\nSubject: ${subject}\n\n${body}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(emailInfo).then(() => {
                alert('Email information copied to clipboard! You can now paste it into your email client.');
            }).catch(() => {
                this.showEmailInfo(emailInfo);
            });
        } else {
            this.showEmailInfo(emailInfo);
        }
    }

    showEmailInfo(emailInfo) {
        prompt('Please copy this email information:', emailInfo);
    }

    formatEmailBody(formData) {
        return `Name: ${formData.name}
Email: ${formData.email}
Inquiry Type: ${formData.inquiryType}
Subject: ${formData.subject || 'N/A'}
Time: ${new Date().toLocaleString()}

Message:
${formData.message}

---
This message was sent from the NaviBatch website contact form.`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    resetForm() {
        document.getElementById('contact-form').reset();

        // 隐藏图片上传区域
        const imageUploadGroup = document.getElementById('image-upload-group');
        if (imageUploadGroup) {
            imageUploadGroup.style.display = 'none';
        }

        // 清除上传的图片
        if (typeof clearUploadedImages === 'function') {
            clearUploadedImages();
        }
    }
}

// 创建全局实例
window.contactHandler = new ContactFormHandler();

// 更新全局函数以使用新的处理器
function handleFormSubmit(event) {
    window.contactHandler.handleSubmit(event);
}
