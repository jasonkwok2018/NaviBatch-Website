// 全局错误处理
window.addEventListener('error', function(event) {
    console.warn('Global error caught:', event.error);
    // 不显示给用户，只记录在控制台
});

window.addEventListener('unhandledrejection', function(event) {
    console.warn('Unhandled promise rejection:', event.reason);
    // 不显示给用户，只记录在控制台
});

// 页面加载处理
window.addEventListener('load', function() {
    // 页面完全加载后移除加载指示器
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 200); // 延迟200毫秒以确保页面渲染完成

    // 强制清除旧缓存
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName.startsWith('navibatch-v1.1.1') || cacheName.startsWith('navibatch-v1.1.0')) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        });
    }

    // 注册Service Worker（仅在生产环境中）
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                // Service Worker注册成功
                console.log('Service Worker registered successfully');
            })
            .catch(function(error) {
                console.warn('Service Worker registration failed:', error);
            });
    }
});

// 邮件服务已迁移到 Cloudflare Worker
// 不再需要 EmailJS 初始化

// 页面加载完成后初始化功能
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是 Formspree 成功返回
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === '1') {
        alert('Your message has been sent successfully! We will respond as soon as possible.');
        // 清除 URL 参数
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    setupImageUpload();

    // 设置inquiry type选择器的事件监听
    const inquiryTypeSelect = document.getElementById('inquiry-type');
    if (inquiryTypeSelect) {
        inquiryTypeSelect.addEventListener('change', toggleImageUpload);
    }

    // 修复 Logo 点击问题
    setupLogoClickHandler();
});

// Logo 点击处理函数
function setupLogoClickHandler() {
    const logoLink = document.querySelector('.logo a');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            // 检查是否在主页
            const isHomePage = window.location.pathname === '/' ||
                              window.location.pathname === '/index.html' ||
                              window.location.pathname === '';

            if (isHomePage) {
                // 如果已经在主页，阻止默认行为并滚动到顶部
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
            // 如果不在主页，允许默认的链接行为（跳转到主页）
        });
    }
}

// 简化的表单处理函数
function handleFormSubmit(event) {
    event.preventDefault();

    // 获取表单数据
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const inquiryType = document.getElementById('inquiry-type').value;
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    // 验证表单
    if (!name || !email || !inquiryType || !message) {
        alert('Please fill in all required fields.');
        return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // 根据咨询类型选择收件人
    const toEmail = inquiryType === 'technical' ? 'supports@navibatch.com' : 'info@navibatch.com';

    // 构建邮件内容
    const emailSubject = subject || `NaviBatch Contact: ${inquiryType}`;
    const emailBody = `
Name: ${name}
Email: ${email}
Inquiry Type: ${inquiryType}
Subject: ${subject || 'N/A'}
Time: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from the NaviBatch website contact form.
    `;

    // 创建 mailto 链接
    const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // 尝试打开邮件客户端
    try {
        window.open(mailtoUrl);

        // 显示友好的成功消息
        const userConfirm = confirm(
            'Your email client should now be open with your message pre-filled.\n\n' +
            'If your email client didn\'t open, you can:\n' +
            '• Copy the email address: ' + toEmail + '\n' +
            '• Or click "OK" to try a different method'
        );

        if (userConfirm) {
            // 提供备用方案
            const emailInfo = `
Email: ${toEmail}
Subject: ${emailSubject}

Message:
${emailBody}
            `;

            // 尝试复制到剪贴板
            if (navigator.clipboard) {
                navigator.clipboard.writeText(emailInfo).then(() => {
                    alert('Email information has been copied to your clipboard!');
                }).catch(() => {
                    // 如果复制失败，显示信息
                    prompt('Please copy this email information:', emailInfo);
                });
            } else {
                // 如果不支持剪贴板 API，使用 prompt
                prompt('Please copy this email information:', emailInfo);
            }
        }
    } catch (error) {
        // 如果 mailto 失败，提供备用方案
        alert('Unable to open email client. Please send an email manually to: ' + toEmail);
    }

    // 重置表单
    document.getElementById('contact-form').reset();

    // 隐藏图片上传区域
    const imageUploadGroup = document.getElementById('image-upload-group');
    if (imageUploadGroup) {
        imageUploadGroup.style.display = 'none';
    }
}

// 保留原来的函数名以兼容现有代码
async function validateAndSubmitForm(event) {
    // 阻止表单默认提交行为
    event.preventDefault();

    // 获取表单元素
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const inquiryTypeSelect = document.getElementById('inquiry-type');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    const submitButton = document.querySelector('.contact-form button[type="submit"]');

    // 验证表单
    if (!nameInput.value.trim()) {
        alert('Please enter your name');
        nameInput.focus();
        return false;
    }

    if (!emailInput.value.trim()) {
        alert('Please enter your email');
        emailInput.focus();
        return false;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        alert('Please enter a valid email address');
        emailInput.focus();
        return false;
    }

    if (!inquiryTypeSelect.value) {
        alert('Please select an inquiry type');
        inquiryTypeSelect.focus();
        return false;
    }

    if (!messageInput.value.trim()) {
        alert('Please enter your message');
        messageInput.focus();
        return false;
    }

    // 禁用提交按钮，防止重复点击
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    // 准备发送的参数
    const inquiryType = inquiryTypeSelect.options[inquiryTypeSelect.selectedIndex].text;
    const subject = subjectInput.value.trim() || inquiryType;

    // 根据咨询类型选择收件人
    let toEmail = 'info@navibatch.com';
    if (inquiryTypeSelect.value === 'technical') {
        toEmail = 'supports@navibatch.com';
    }

    // 准备模板参数
    const templateParams = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        subject: subject,
        message: messageInput.value.trim(),
        time: new Date().toLocaleString(),
        inquiry_type: inquiryType
    };

    // 如果是技术支持且有上传图片，添加图片信息
    if (inquiryTypeSelect.value === 'technical' && uploadedImages.length > 0) {
        const imageInfo = uploadedImages.map((img, index) =>
            `Image ${index + 1}: ${img.name} (${formatFileSize(img.size)})`
        ).join('\n');

        templateParams.message += `\n\n--- Attached Images ---\n${imageInfo}\n\n⚠️ IMPORTANT: Due to email size limitations, images are included as compressed previews. For full resolution images, please reply to this email and we will provide a secure upload link.`;

        // 添加图片数据（注意：EmailJS有大小限制，这里主要是通知有图片）
        templateParams.has_images = 'Yes';
        templateParams.image_count = uploadedImages.length;

        // 尝试添加压缩后的图片预览（仅用于小图片）
        const compressedImages = await compressImagesForEmail(uploadedImages);
        if (compressedImages.length > 0) {
            templateParams.image_previews = compressedImages.map((img, index) =>
                `[Image ${index + 1}: ${img.name}]\nData: ${img.dataUrl.substring(0, 100)}...`
            ).join('\n\n');
        }
    }

    // Send email using new email service
    try {
        // 使用新的邮件服务
        const emailData = {
            name: templateParams.name,
            email: templateParams.email,
            subject: templateParams.subject,
            message: templateParams.message,
            inquiry_type: inquiryTypeSelect.value,
            time: templateParams.time
        };

        // 添加图片数据到邮件数据中
        if (inquiryTypeSelect.value === 'technical' && uploadedImages.length > 0) {
            emailData.images = uploadedImages.map(imageData => ({
                name: imageData.name,
                content: imageData.dataUrl.split(',')[1], // 移除data:image/...;base64,前缀
                size: imageData.size,
                type: imageData.file.type
            }));
        }

        const response = await fetch('https://navibatch-email.jasonkwok2018.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();

        if (result.success) {
            // 根据发送方法显示不同的消息
            if (result.method === 'mailto') {
                // 如果是 mailto 方案，打开邮件客户端
                if (result.mailto_url) {
                    window.open(result.mailto_url);
                    alert('Your email client has been opened. Please send the email manually.');
                } else {
                    alert('Please send an email directly to ' + toEmail);
                }
            } else {
                // 其他方法发送成功
                alert('Your message has been sent successfully! We will respond as soon as possible.');
            }

            // Reset form
            document.getElementById('contact-form').reset();

            // 清除上传的图片
            clearUploadedImages();

            // 隐藏图片上传区域
            const imageUploadGroup = document.getElementById('image-upload-group');
            if (imageUploadGroup) {
                imageUploadGroup.style.display = 'none';
            }

            // Enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        // Sending failed
        console.warn('Email sending failed:', error);
        alert('Sending failed. Please try again later or send an email directly to ' + toEmail);

        // Enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
    }

    return false;
}

// 添加CSS样式到select元素
document.addEventListener('DOMContentLoaded', function() {
    // 清理可能的重复元素
    const existingMobileMenus = document.querySelectorAll('.mobile-menu');
    if (existingMobileMenus.length > 1) {
        for (let i = 1; i < existingMobileMenus.length; i++) {
            existingMobileMenus[i].remove();
        }
    }

    // 检查竞品对比section的CSS是否正确加载
    const competitorSection = document.querySelector('.competitor-section');
    if (competitorSection) {
        // CSS样式检查（仅在开发模式下）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // 竞品对比样式加载成功
        }
    }

    // 给select添加样式
    const selectElements = document.querySelectorAll('select');
    selectElements.forEach(select => {
        select.classList.add('styled-select');
    });

    // 移动菜单切换
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    let mobileMenu = document.querySelector('.mobile-menu');
    const body = document.body;

    // 只在移动设备上创建移动菜单
    if (mobileMenuToggle && !mobileMenu && window.innerWidth <= 992) {
        // 确保没有重复创建
        if (document.querySelector('.mobile-menu')) {
            return;
        }

        const newMobileMenu = document.createElement('div');
        newMobileMenu.className = 'mobile-menu';

        const closeButton = document.createElement('button');
        closeButton.className = 'mobile-menu-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';

        const nav = document.createElement('nav');
        nav.className = 'mobile-menu-nav';

        const mainNav = document.querySelector('.main-nav');
        if (mainNav) {
            const navItems = mainNav.cloneNode(true);
            navItems.className = 'mobile-menu-nav';
            nav.appendChild(navItems);
        }

        const ctaButtons = document.querySelector('.cta-buttons');
        if (ctaButtons) {
            const ctaClone = ctaButtons.cloneNode(true);
            ctaClone.className = 'mobile-menu-cta';
            nav.appendChild(ctaClone);
        }

        newMobileMenu.appendChild(closeButton);
        newMobileMenu.appendChild(nav);

        // 将菜单插入到body的开头，而不是末尾
        document.body.insertBefore(newMobileMenu, document.body.firstChild);

        // 更新引用
        mobileMenu = newMobileMenu;

        // 添加事件监听器
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            body.style.overflow = 'hidden';
        });

        closeButton.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            body.style.overflow = '';
        });

        // 点击菜单项后关闭菜单
        mobileMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                mobileMenu.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }

    // 滚动效果
    const scrollElements = document.querySelectorAll('.feature-card, .section-header, .case-study-card');

    const elementInView = (el, scrollOffset = 100) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) - scrollOffset
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('scrolled');
    };

    const hideScrollElement = (element) => {
        element.classList.remove('scrolled');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 100)) {
                displayScrollElement(el);
            } else {
                hideScrollElement(el);
            }
        });
    };

    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });

    // 初始检查元素是否在视图中
    handleScrollAnimation();

    // 处理回到顶部按钮
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // 当页面滚动超过300px时显示按钮
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // 点击按钮滚动到顶部
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 案例研究模态框功能
    const modal = document.getElementById('case-study-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const closeBtn = document.querySelector('.close');
    const readMoreBtns = document.querySelectorAll('.read-more');

    // 案例研究数据
    const caseStudies = {
        1: {
            title: "FastDelivery Co. - 2 Hours Daily Time Savings",
            content: `
                <div class="case-study-meta">
                    <div class="case-study-stat">
                        <span class="number">2h</span>
                        <span class="label">Daily Time Saved</span>
                    </div>
                    <div class="case-study-stat">
                        <span class="number">50+</span>
                        <span class="label">Daily Deliveries</span>
                    </div>
                    <div class="case-study-stat">
                        <span class="number">25%</span>
                        <span class="label">Efficiency Increase</span>
                    </div>
                </div>

                <div class="case-study-section">
                    <h3>The Challenge</h3>
                    <p>FastDelivery Co., a mid-sized delivery company serving the metropolitan area, was struggling with inefficient route planning. Their drivers were spending 2-3 hours each morning manually planning routes for 50+ daily deliveries, often resulting in suboptimal paths and wasted fuel.</p>
                </div>

                <div class="case-study-section">
                    <h3>The Solution</h3>
                    <p>After implementing NaviBatch, FastDelivery Co. transformed their morning routine. Drivers now import their delivery addresses directly from their dispatch system and let NaviBatch's AI optimize the entire route in seconds.</p>
                </div>

                <div class="case-study-quote">
                    <div class="quote-text">"NaviBatch has revolutionized our operations. What used to take our drivers 2-3 hours of route planning now takes just 5 minutes. We can start deliveries earlier and complete more routes per day."</div>
                    <div class="quote-author">— Sarah Johnson, Operations Manager, FastDelivery Co.</div>
                </div>

                <div class="case-study-section">
                    <h3>Key Results</h3>
                    <div class="case-study-results">
                        <div class="result-item">
                            <span class="result-number">2h</span>
                            <span class="result-label">Time saved daily per driver</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">25%</span>
                            <span class="result-label">Increase in daily deliveries</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">15%</span>
                            <span class="result-label">Reduction in fuel costs</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">95%</span>
                            <span class="result-label">Driver satisfaction rate</span>
                        </div>
                    </div>
                </div>

                <div class="case-study-section">
                    <h3>Implementation Process</h3>
                    <p>The transition to NaviBatch was seamless. The company started with a pilot program using 5 drivers for one week. After seeing immediate results, they rolled out the app to their entire fleet of 25 drivers within a month.</p>
                    <p>Training was minimal - most drivers were comfortable with the app within their first day of use, thanks to NaviBatch's intuitive interface.</p>
                </div>
            `
        },
        2: {
            title: "QuickCourier - 30% Increase in Daily Deliveries",
            content: `
                <div class="case-study-meta">
                    <div class="case-study-stat">
                        <span class="number">30%</span>
                        <span class="label">More Deliveries</span>
                    </div>
                    <div class="case-study-stat">
                        <span class="number">80+</span>
                        <span class="label">Daily Stops</span>
                    </div>
                    <div class="case-study-stat">
                        <span class="number">$2,500</span>
                        <span class="label">Monthly Revenue Increase</span>
                    </div>
                </div>

                <div class="case-study-section">
                    <h3>The Challenge</h3>
                    <p>QuickCourier, an independent courier service, was limited by inefficient routing. Their single driver could only complete 60-65 deliveries per day, missing opportunities for additional revenue and struggling to compete with larger delivery services.</p>
                </div>

                <div class="case-study-section">
                    <h3>The Solution</h3>
                    <p>By adopting NaviBatch's intelligent route optimization, QuickCourier was able to maximize their delivery capacity. The app's batch navigation feature eliminated time wasted on manual route planning and reduced travel time between stops.</p>
                </div>

                <div class="case-study-quote">
                    <div class="quote-text">"I went from struggling to complete 60 deliveries a day to easily handling 80+ stops. NaviBatch's route optimization is like having a logistics expert in my pocket. My income has increased by over $2,500 per month!"</div>
                    <div class="quote-author">— Mike Rodriguez, Owner, QuickCourier</div>
                </div>

                <div class="case-study-section">
                    <h3>Key Results</h3>
                    <div class="case-study-results">
                        <div class="result-item">
                            <span class="result-number">30%</span>
                            <span class="result-label">Increase in daily deliveries</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">80+</span>
                            <span class="result-label">Deliveries per day</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">$2,500</span>
                            <span class="result-label">Additional monthly revenue</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">40%</span>
                            <span class="result-label">Reduction in planning time</span>
                        </div>
                    </div>
                </div>

                <div class="case-study-section">
                    <h3>Business Impact</h3>
                    <p>The increased efficiency allowed QuickCourier to take on more clients and expand their service area. The time saved on route planning is now used for customer acquisition and business development.</p>
                    <p>The consistent delivery performance has also improved customer satisfaction, leading to more repeat business and referrals.</p>
                </div>

                <div class="case-study-section">
                    <h3>Future Plans</h3>
                    <p>Based on the success with NaviBatch, QuickCourier is planning to hire additional drivers and expand their fleet, confident that they can maintain the same level of efficiency across multiple vehicles.</p>
                </div>
            `
        },
        3: {
            title: "LogiTrans Corp - 15% Monthly Fuel Savings",
            content: `
                <div class="case-study-meta">
                    <div class="case-study-stat">
                        <span class="number">15%</span>
                        <span class="label">Fuel Cost Reduction</span>
                    </div>
                    <div class="case-study-stat">
                        <span class="number">$8,000</span>
                        <span class="label">Monthly Savings</span>
                    </div>
                    <div class="case-study-stat">
                        <span class="number">50</span>
                        <span class="label">Fleet Vehicles</span>
                    </div>
                </div>

                <div class="case-study-section">
                    <h3>The Challenge</h3>
                    <p>LogiTrans Corp, a large logistics company with a fleet of 50 delivery vehicles, was facing rising fuel costs that were significantly impacting their profit margins. Their existing route planning system was outdated and often created inefficient routes with unnecessary backtracking.</p>
                </div>

                <div class="case-study-section">
                    <h3>The Solution</h3>
                    <p>LogiTrans implemented NaviBatch across their entire fleet. The app's advanced route optimization algorithms significantly reduced total driving distances and eliminated inefficient routing patterns. Real-time traffic integration also helped drivers avoid congested areas.</p>
                </div>

                <div class="case-study-quote">
                    <div class="quote-text">"NaviBatch's route optimization has been a game-changer for our fuel efficiency. We're saving over $8,000 per month in fuel costs alone, and our drivers are completing routes faster than ever before."</div>
                    <div class="quote-author">— David Chen, Fleet Manager, LogiTrans Corp</div>
                </div>

                <div class="case-study-section">
                    <h3>Key Results</h3>
                    <div class="case-study-results">
                        <div class="result-item">
                            <span class="result-number">15%</span>
                            <span class="result-label">Reduction in fuel costs</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">$8,000</span>
                            <span class="result-label">Monthly fuel savings</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">20%</span>
                            <span class="result-label">Reduction in total mileage</span>
                        </div>
                        <div class="result-item">
                            <span class="result-number">98%</span>
                            <span class="result-label">On-time delivery rate</span>
                        </div>
                    </div>
                </div>

                <div class="case-study-section">
                    <h3>Environmental Impact</h3>
                    <p>Beyond cost savings, LogiTrans has significantly reduced their carbon footprint. The 20% reduction in total mileage translates to approximately 150 tons less CO2 emissions annually, supporting their corporate sustainability goals.</p>
                </div>

                <div class="case-study-section">
                    <h3>Operational Improvements</h3>
                    <p>The efficiency gains have allowed LogiTrans to handle 25% more deliveries with the same fleet size. This increased capacity has enabled them to take on new clients without additional vehicle investments.</p>
                    <p>Driver satisfaction has also improved significantly, as they spend less time in traffic and can complete their routes more predictably.</p>
                </div>

                <div class="case-study-section">
                    <h3>ROI Analysis</h3>
                    <p>With monthly fuel savings of $8,000 and increased delivery capacity, LogiTrans achieved a complete return on their NaviBatch investment within the first month. The ongoing savings continue to improve their bottom line quarter after quarter.</p>
                </div>
            `
        }
    };

    // 打开模态框
    if (readMoreBtns.length > 0) {
        readMoreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const caseStudyId = btn.getAttribute('data-case-study');
                const caseStudy = caseStudies[caseStudyId];

                if (caseStudy) {
                    modalTitle.textContent = caseStudy.title;
                    modalContent.innerHTML = caseStudy.content;
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden'; // 防止背景滚动
                }
            });
        });
    }

    // 关闭模态框
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // 如果是案例研究链接，不阻止默认行为
            if (this.hasAttribute('data-case-study')) {
                return;
            }

            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // 关闭移动菜单（如果打开）
                const activeMobileMenu = document.querySelector('.mobile-menu.active');
                if (activeMobileMenu) {
                    activeMobileMenu.classList.remove('active');
                    body.style.overflow = '';
                }

                // 平滑滚动到目标位置
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去头部高度
                    behavior: 'smooth'
                });
            }
        });
    });
});

// 图片上传相关功能
let uploadedImages = [];
const maxImages = 3;
const maxFileSize = 10 * 1024 * 1024; // 10MB

// 显示/隐藏图片上传区域
function toggleImageUpload() {
    const inquiryTypeSelect = document.getElementById('inquiry-type');
    const imageUploadGroup = document.getElementById('image-upload-group');

    if (!inquiryTypeSelect || !imageUploadGroup) {
        console.warn('Required elements not found for image upload toggle');
        return;
    }

    const inquiryType = inquiryTypeSelect.value;

    if (inquiryType === 'technical') {
        imageUploadGroup.style.display = 'block';
    } else {
        imageUploadGroup.style.display = 'none';
        // 清除已上传的图片
        clearUploadedImages();
    }
}

// 设置图片上传功能
function setupImageUpload() {
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('image-upload');

    if (!uploadArea || !fileInput) return;

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
}

// 处理文件上传
function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    const validFiles = files.filter(file => {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('Please upload only image files (PNG, JPG, GIF)');
            return false;
        }

        // 检查文件大小
        if (file.size > maxFileSize) {
            alert(`File "${file.name}" exceeds 10MB limit`);
            return false;
        }

        return true;
    });

    // 检查总数量限制
    if (uploadedImages.length + validFiles.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
    }

    validFiles.forEach(file => {
        addImagePreview(file);
    });
}

// 添加图片预览
function addImagePreview(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const imageData = {
            file: file,
            dataUrl: e.target.result,
            name: file.name,
            size: file.size
        };

        uploadedImages.push(imageData);
        renderImagePreviews();
    };

    reader.readAsDataURL(file);
}

// 渲染图片预览
function renderImagePreviews() {
    const previewContainer = document.getElementById('image-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    uploadedImages.forEach((imageData, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        previewItem.innerHTML = `
            <img src="${imageData.dataUrl}" alt="${imageData.name}">
            <button type="button" class="image-remove-btn" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
            <div class="image-info">
                ${formatFileSize(imageData.size)}
            </div>
        `;

        previewContainer.appendChild(previewItem);
    });

    // 更新上传区域显示
    updateUploadAreaText();
}

// 移除图片
function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();

    // 清除文件输入
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
        fileInput.value = '';
    }
}

// 清除所有上传的图片
function clearUploadedImages() {
    uploadedImages = [];

    // 安全地渲染预览
    const previewContainer = document.getElementById('image-preview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }

    // 更新上传区域文本
    updateUploadAreaText();

    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
        fileInput.value = '';
    }
}

// 更新上传区域文本
function updateUploadAreaText() {
    const uploadText = document.querySelector('.upload-text p:first-child');
    if (!uploadText) return;

    if (uploadedImages.length === 0) {
        uploadText.innerHTML = '<strong>Click to upload</strong> or drag and drop';
    } else if (uploadedImages.length < maxImages) {
        uploadText.innerHTML = `<strong>Add more images</strong> (${uploadedImages.length}/${maxImages})`;
    } else {
        uploadText.innerHTML = `<strong>Maximum reached</strong> (${uploadedImages.length}/${maxImages})`;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 将图片转换为base64字符串用于邮件发送
function getImagesForEmail() {
    return uploadedImages.map(imageData => ({
        name: imageData.name,
        content: imageData.dataUrl.split(',')[1], // 移除data:image/...;base64,前缀
        size: formatFileSize(imageData.size)
    }));
}

// 优化的图片压缩 - 使用requestIdleCallback避免阻塞主线程
async function compressImagesForEmail(images) {
    const compressedImages = [];
    const maxEmailImageSize = 50 * 1024; // 50KB限制用于邮件预览

    // 分批处理图片，避免一次性处理太多
    const batchSize = 2;
    for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);

        // 并行处理当前批次
        const batchPromises = batch.map(async (imageData) => {
            try {
                const compressedDataUrl = await compressImageAsync(imageData.dataUrl, maxEmailImageSize);
                if (compressedDataUrl) {
                    return {
                        name: imageData.name,
                        dataUrl: compressedDataUrl,
                        originalSize: imageData.size
                    };
                }
            } catch (error) {
                console.warn(`Failed to compress image ${imageData.name}:`, error);
            }
            return null;
        });

        const batchResults = await Promise.all(batchPromises);
        compressedImages.push(...batchResults.filter(result => result !== null));

        // 在批次之间让出控制权
        if (i + batchSize < images.length) {
            await new Promise(resolve => {
                if (window.requestIdleCallback) {
                    requestIdleCallback(resolve, { timeout: 100 });
                } else {
                    setTimeout(resolve, 10);
                }
            });
        }
    }

    return compressedImages;
}

// 异步压缩单个图片 - 优化性能
function compressImageAsync(dataUrl, maxSize) {
    return new Promise((resolve) => {
        const processImage = () => {
            const img = new Image();
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 计算压缩后的尺寸（保持宽高比）
                    let { width, height } = img;
                    const maxDimension = 300; // 最大尺寸300px

                    if (width > height) {
                        if (width > maxDimension) {
                            height = (height * maxDimension) / width;
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width = (width * maxDimension) / height;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // 绘制压缩后的图片
                    ctx.drawImage(img, 0, 0, width, height);

                    // 优化质量调整算法 - 减少循环次数
                    let quality = 0.3;
                    let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                    // 如果第一次就符合要求，直接返回
                    if (compressedDataUrl.length <= maxSize) {
                        resolve(compressedDataUrl);
                        return;
                    }

                    // 二分查找最佳质量
                    let minQuality = 0.1;
                    let maxQuality = 0.3;
                    let bestResult = null;

                    for (let i = 0; i < 5; i++) { // 最多5次迭代
                        quality = (minQuality + maxQuality) / 2;
                        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                        if (compressedDataUrl.length <= maxSize) {
                            bestResult = compressedDataUrl;
                            minQuality = quality;
                        } else {
                            maxQuality = quality;
                        }
                    }

                    resolve(bestResult);
                } catch (error) {
                    console.warn('Image compression error:', error);
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        };

        // 使用requestIdleCallback延迟处理
        if (window.requestIdleCallback) {
            requestIdleCallback(processImage, { timeout: 1000 });
        } else {
            setTimeout(processImage, 0);
        }
    });
}
