/**
 * 文件预览处理模块
 */

// 支持的预览类型
const PREVIEW_TYPES = {
    TEXT: ['txt', 'md', 'log', 'json', 'xml', 'csv', 'conf', 'yaml'],
    CODE: ['js', 'html', 'css', 'py', 'java', 'php', 'sh', 'c', 'cpp'],
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
};

// 获取文件扩展名
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// 判断文件是否可预览
function isPreviewable(filename) {
    const ext = getFileExtension(filename);
    return Object.values(PREVIEW_TYPES).some(types => types.includes(ext));
}

// 获取预览类型
function getPreviewType(filename) {
    const ext = getFileExtension(filename);
    for (const [type, exts] of Object.entries(PREVIEW_TYPES)) {
        if (exts.includes(ext)) {
            return type;
        }
    }
    return null;
}

// 预览文本文件
function previewText(content) {
    return `<pre class="text-preview">${escapeHtml(content)}</pre>`;
}

// HTML转义函数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

// 预览代码文件
function previewCode(content, language) {
    const pre = document.createElement('pre');
    pre.className = 'code-preview';
    pre.dataset.lang = language;
    
    const code = document.createElement('code');
    code.textContent = content; // 使用textContent确保不被解析
    
    pre.appendChild(code);
    return pre.outerHTML;
}

// 预览图片文件
function previewImage(url) {
    return `
        <img src="${url}" 
             class="image-preview" 
             alt="图片预览"
             ondblclick="handleImageDblClick(this, event)"
             onmousedown="handleImageMouseDown(this, event)"
             ontouchstart="handleImageTouchStart(this, event)"
             ontouchmove="handleImageTouchMove(this, event)"
             ontouchend="handleImageTouchEnd(this, event)">
    `;
}

// 加载文件内容并预览
async function loadAndPreview(filePath, filename) {
    try {
        const response = await fetch(filePath);
        const previewType = getPreviewType(filename);
        
        if (previewType === 'IMAGE') {
            return previewImage(filePath);
        } else {
            const content = await response.text();
            if (previewType === 'TEXT') {
                return previewText(content);
            } else if (previewType === 'CODE') {
                return previewCode(content, getFileExtension(filename));
            }
        }
    } catch (error) {
        console.error('预览失败:', error);
        return '<div class="preview-error">预览加载失败</div>';
    }
}

// 初始化预览功能
// 处理触摸开始事件
window.handleImageTouchStart = function(img, e) {
    e.preventDefault();
    
    // 双击检测
    if (!img.lastTouchTime) {
        img.lastTouchTime = Date.now();
        return;
    }
    
    const now = Date.now();
    if (now - img.lastTouchTime < 300) { // 300ms内视为双击
        img.lastTouchTime = 0;
        const isZoomed = img.classList.contains('zoomed');
        
        if (isZoomed) {
            // 缩小图片
            img.classList.remove('zoomed');
            img.style.transform = 'scale(1)';
            return;
        } else {
            // 放大图片
            img.classList.add('zoomed');
            img.style.transform = 'scale(2)';
            return;
        }
    }
    img.lastTouchTime = now;
    
    if (!img.classList.contains('zoomed')) return;
    
    const touch = e.touches[0];
    let isDragging = true;
    let startX = touch.clientX;
    let startY = touch.clientY;
    
    const transform = img.style.transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    let translateX = transform ? parseFloat(transform[1]) : 0;
    let translateY = transform ? parseFloat(transform[2]) : 0;
    
    img.style.cursor = 'grabbing';
    img.setAttribute('draggable', 'false');

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const newX = touch.clientX - startX + translateX;
        const newY = touch.clientY - startY + translateY;
        
        const maxX = (img.width * 2 - img.parentElement.clientWidth) / 2;
        const maxY = (img.height * 2 - img.parentElement.clientHeight) / 2;
        
        const boundedX = Math.min(Math.max(newX, -maxX), maxX);
        const boundedY = Math.min(Math.max(newY, -maxY), maxY);
        
        img.style.transform = `scale(2) translate(${boundedX}px, ${boundedY}px)`;
    }

    function handleTouchEnd() {
        isDragging = false;
        img.style.cursor = 'grab';
        img.removeEventListener('touchmove', handleTouchMove);
        img.removeEventListener('touchend', handleTouchEnd);
    }

    img.addEventListener('touchmove', handleTouchMove, {passive: false});
    img.addEventListener('touchend', handleTouchEnd, {passive: false});
};

// 空函数保持接口一致
window.handleImageTouchMove = function() {};
window.handleImageTouchEnd = function() {};

function initPreview() {
    console.log('文件预览模块初始化完成');
    
    // 注册全局函数
    window.handleImageDblClick = function(img, e) {
        const isZoomed = img.classList.contains('zoomed');
        
        if (isZoomed) {
            // 缩小图片
            img.classList.remove('zoomed');
            img.style.transform = 'scale(1)';
            img.style.cursor = 'zoom-in';
        } else {
            // 计算双击位置相对于图片中心的偏移
            const rect = img.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // 放大图片并定位到点击位置 (使用像素单位)
            const offsetXPx = (clickX - centerX) * 2;
            const offsetYPx = (clickY - centerY) * 2;
            img.classList.add('zoomed');
            img.style.transform = `scale(2) translate(${-offsetXPx}px, ${-offsetYPx}px)`;
            img.style.cursor = 'grab';
        }
    };

    window.handleImageMouseDown = function(img, e) {
        if (!img.classList.contains('zoomed')) return;
        
        e.preventDefault();
        
        let isDragging = true;
        let prevX = e.clientX;
        let prevY = e.clientY;
        
        // 获取当前transform值
        const transform = img.style.transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        let translateX = transform ? parseFloat(transform[1]) : 0;
        let translateY = transform ? parseFloat(transform[2]) : 0;
        
        img.style.cursor = 'grabbing';
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            // 计算鼠标移动距离
            const deltaX = e.clientX - prevX;
            const deltaY = e.clientY - prevY;
            
            // 直接更新位置
            translateX += deltaX;
            translateY += deltaY;
            
            // 边界检查 - 使用显示尺寸计算
            const rect = img.getBoundingClientRect();
            const displayWidth = rect.width;
            const displayHeight = rect.height;
            
            const maxX = Math.max(0, (displayWidth - img.parentElement.clientWidth) / 2);
            const maxY = Math.max(0, (displayHeight - img.parentElement.clientHeight) / 2);
            
            translateX = Math.max(-maxX, Math.min(translateX, maxX));
            translateY = Math.max(-maxY, Math.min(translateY, maxY));
            
            // 更新图片位置 
            img.style.transform = `scale(2) translate(${translateX}px, ${translateY}px)`;
            
            // 更新前一个位置
            prevX = e.clientX;
            prevY = e.clientY;
        }

        
        function handleMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            img.style.cursor = 'grab';
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
}

// 导出所有需要的函数
export {
    initPreview,
    isPreviewable, 
    loadAndPreview,
    getPreviewType
};
