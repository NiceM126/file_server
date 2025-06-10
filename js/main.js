document.addEventListener('DOMContentLoaded', function() {
    const fileListContainer = document.getElementById('file-list-container');
    let currentPath = '/'; // 跟踪当前路径状态
    
    // 初始加载根目录
    fetch('/file-list')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse JSON:', text);
                    throw e;
                }
            });
        })
        .then(data => {
            const files = processFileData(data, '/');
            renderFileList(files, '/');
        })
        .catch(error => {
            console.error('获取文件列表失败:', error);
            fileListContainer.innerHTML = '<div class="error">加载文件列表失败</div>';
        });

    // 渲染文件列表
    function renderFileList(files, currentPath = '/') {
        const pathParts = currentPath.split('/').filter(Boolean);
        const breadcrumbs = pathParts.map((part, index) => {
            const path = '/' + pathParts.slice(0, index + 1).join('/');
            return `<a href="#" class="folder-link" data-path="${path}">${part}</a>`;
        }).join(' / ');

        const listHtml = `
            <div class="path-navigation">
                <a href="#" class="back-link" data-path="${getParentPath(currentPath)}">← 返回上级</a>
                <span class="breadcrumbs">${breadcrumbs || '根目录'}</span>
            </div>
            <table class="file-table">
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>大小</th>
                        <th>修改时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${files.map(file => `
                        <tr>
                            <td>
                                ${file.isDirectory 
                                    ? `<a href="#" class="folder-link" data-path="${currentPath === '/' ? '' : currentPath}/${file.rawName}">📁 ${file.name}</a>`
                                    : file.name}
                            </td>
                            <td>${file.isDirectory ? '-' : formatFileSize(file.size)}</td>
                            <td>${new Date(file.mtime).toLocaleString()}</td>
                            <td>
                                ${file.isDirectory
                                    ? '<span class="folder-label">文件夹</span>'
                                    : `<a href="${file.path}" download class="download-btn">下载</a>`}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        fileListContainer.innerHTML = listHtml;
    }

    // 处理文件数据（从Nginx格式转换）
    function processFileData(data, currentPath) {
        console.log('Processing file data with currentPath:', currentPath);
        return Object.keys(data).map(key => {
            const item = data[key];
            const isDirectory = item.type === 'directory' || item.name.endsWith('/');
            
            const fileSize = isDirectory ? '-' : (
                typeof item.size === 'string' 
                    ? parseInt(item.size.replace(/\D/g, '')) 
                    : Number(item.size) || 0
            );
            
            let fileTime;
            if (typeof item.mtime === 'string') {
                fileTime = new Date(item.mtime).getTime();
            } else {
                fileTime = item.mtime * 1000;
            }
            
            // 规范化路径处理
            const cleanCurrentPath = currentPath.replace(/\/+$/, '').replace(/^\/+/, '');
            const cleanName = item.name.replace(/\/+$/, '').replace(/^\/+/, '');
            
            // 构建完整文件路径
            let fullPath = '';
            if (cleanCurrentPath && cleanName) {
                fullPath = `${cleanCurrentPath}/${cleanName}`;
            } else {
                fullPath = cleanCurrentPath || cleanName;
            }
            
            // 规范化文件下载路径
            let filePath = '';
            if (!isDirectory) {
                // 只编码文件名部分，保持路径结构
                const encodedPath = cleanCurrentPath ? 
                    `${cleanCurrentPath}/${encodeURIComponent(cleanName)}` : 
                    encodeURIComponent(cleanName);
                filePath = `/files/${encodedPath}?download=true`;
                console.log('File download path:', filePath);
            } else {
                filePath = `/${cleanCurrentPath}/${cleanName}/`.replace(/\/+/g, '/');
            }
            
            return {
                name: item.name,
                size: fileSize,
                mtime: isNaN(fileTime) ? Date.now() : fileTime,
                path: filePath,
                isDirectory: isDirectory,
                rawName: item.name.replace(/\/+$/, '')
            };
        });
    }

    // 获取父级路径（规范化处理）
    function getParentPath(currentPath) {
        // 规范化输入路径
        const normalizedPath = currentPath.replace(/\/+/g, '/').replace(/\/$/, '');
        
        if (normalizedPath === '' || normalizedPath === '/') {
            return '/';
        }
        
        const parts = normalizedPath.split('/').filter(Boolean);
        parts.pop();
        
        // 确保返回的路径格式正确
        return parts.length === 0 ? '/' : '/' + parts.join('/') + '/';
    }

    // 添加点击事件处理
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('folder-link')) {
            e.preventDefault();
            const folderPath = e.target.getAttribute('data-path');
            // 直接使用点击的完整路径
            const newPath = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
            // 规范化路径
            const normalizedPath = newPath.replace(/\/+/g, '/').replace(/\/$/, '');
            
            fetch('/file-list/' + normalizedPath.replace(/^\//, ''))
                .then(response => response.json())
                .then(data => {
                    currentPath = normalizedPath;
                    renderFileList(processFileData(data, currentPath), currentPath);
                })
                .catch(console.error);
        }
        else if (e.target.classList.contains('back-link')) {
            e.preventDefault();
            const parentPath = getParentPath(currentPath);
            fetch('/file-list/' + parentPath.replace(/^\//, ''))
                .then(response => response.json())
                .then(data => {
                    currentPath = parentPath;
                    renderFileList(processFileData(data, currentPath), currentPath);
                })
                .catch(console.error);
        }
    });

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
