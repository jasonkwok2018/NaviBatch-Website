// 性能优化的JavaScript - 减少主线程阻塞时间

(function() {
    'use strict';
    
    // 1. 使用requestIdleCallback优化非关键任务
    const scheduleWork = (callback) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback, { timeout: 1000 });
        } else {
            setTimeout(callback, 0);
        }
    };
    
    // 2. 分批处理DOM操作
    const batchDOMUpdates = (updates) => {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    };
    
    // 3. 优化的地理位置检测 - 非阻塞版本
    async function detectLocationNonBlocking() {
        return new Promise((resolve) => {
            scheduleWork(async () => {
                try {
                    // 使用fetch with timeout避免长时间阻塞
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000);

                    const response = await fetch('https://ipinfo.io/json', {
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        resolve(data);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    resolve(null);
                }
            });
        });
    }
    
    // 4. 优化的图片懒加载
    const optimizedLazyLoad = () => {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // 分批加载图片避免阻塞
                        scheduleWork(() => {
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.classList.add('loaded');
                                observer.unobserve(img);
                            }
                        });
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
            
            // 观察所有懒加载图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    };
    
    // 5. 优化的动画处理
    const optimizeAnimations = () => {
        // 减少动画复杂度在低性能设备上
        const isLowPerformance = navigator.hardwareConcurrency < 4 || 
                                 navigator.deviceMemory < 4;
        
        if (isLowPerformance) {
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
            document.documentElement.classList.add('reduced-motion');
        }
    };
    
    // 6. 分块执行初始化任务
    const initializationTasks = [
        () => optimizedLazyLoad(),
        () => optimizeAnimations(),
        () => detectLocationNonBlocking().then(data => {
            if (data && data.country) {
                scheduleWork(() => {
                    // 非阻塞的位置更新
                    window.dispatchEvent(new CustomEvent('locationDetected', {
                        detail: data
                    }));
                });
            }
        }),
        () => {
            // 预连接到关键域名
            const preconnectDomains = [
                'https://ipinfo.io',
                'https://cdnjs.cloudflare.com'
            ];
            
            preconnectDomains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                document.head.appendChild(link);
            });
        }
    ];
    
    // 7. 分时执行任务避免长任务
    const executeTasksInChunks = (tasks, chunkSize = 1) => {
        let index = 0;
        
        const executeChunk = () => {
            const endIndex = Math.min(index + chunkSize, tasks.length);
            
            for (let i = index; i < endIndex; i++) {
                try {
                    tasks[i]();
                } catch (error) {
                    console.warn('Task execution failed:', error);
                }
            }
            
            index = endIndex;
            
            if (index < tasks.length) {
                scheduleWork(executeChunk);
            }
        };
        
        scheduleWork(executeChunk);
    };
    
    // 8. 优化的事件监听器
    const addOptimizedEventListeners = () => {
        // 使用passive listeners提升滚动性能
        document.addEventListener('scroll', () => {
            scheduleWork(() => {
                // 非关键滚动处理
                const scrollY = window.scrollY;
                if (scrollY > 100) {
                    document.body.classList.add('scrolled');
                } else {
                    document.body.classList.remove('scrolled');
                }
            });
        }, { passive: true });
        
        // 优化resize处理
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                scheduleWork(() => {
                    // 非关键resize处理
                    window.dispatchEvent(new CustomEvent('optimizedResize'));
                });
            }, 150);
        }, { passive: true });
    };
    
    // 9. 内存优化
    const optimizeMemory = () => {
        // 清理不需要的事件监听器
        const cleanupTasks = [];
        
        window.addEventListener('beforeunload', () => {
            cleanupTasks.forEach(cleanup => cleanup());
        });
        
        return {
            addCleanupTask: (task) => cleanupTasks.push(task)
        };
    };
    
    // 10. 主初始化函数
    const initializePerformanceOptimizations = () => {
        // 检查页面是否已经加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                scheduleWork(() => {
                    executeTasksInChunks(initializationTasks);
                    addOptimizedEventListeners();
                    optimizeMemory();
                });
            });
        } else {
            scheduleWork(() => {
                executeTasksInChunks(initializationTasks);
                addOptimizedEventListeners();
                optimizeMemory();
            });
        }
    };
    
    // 11. 性能监控
    const monitorPerformance = () => {
        if ('PerformanceObserver' in window) {
            // 监控长任务
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) {
                        console.warn('Long task detected:', entry.duration + 'ms');
                    }
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // 某些浏览器可能不支持
            }
            
            // 监控布局偏移
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                list.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                
                if (clsValue > 0.1) {
                    console.warn('High CLS detected:', clsValue);
                }
            });
            
            try {
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // 某些浏览器可能不支持
            }
        }
    };
    
    // 启动优化
    initializePerformanceOptimizations();
    
    // 开发环境下启用性能监控
    if (window.location.hostname === 'localhost' || 
        window.location.hostname.includes('pages.dev')) {
        monitorPerformance();
    }
    
    // 导出给全局使用
    window.PerformanceOptimizer = {
        scheduleWork,
        batchDOMUpdates,
        detectLocationNonBlocking
    };
    
})();
