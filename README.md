# 文件共享服务

基于Nginx搭建的现代化文件共享服务，响应式设计，提供文件预览和文件下载功能。

## 功能特性

- 美观的响应式界面，适配各种设备
- 文件列表自动加载
- 文件大小智能格式化显示
- 文件修改时间显示
- 一键下载功能
- 文件预览功能，支持:
  - 文本文件(.txt, .md, .log等)
  - 代码文件(.js, .html, .css, .py等)
  - 图片文件(.jpg, .png, .gif等)

## 技术栈

- Nginx - 高性能Web服务器
- HTML5/CSS3 - 响应式前端界面
- JavaScript - 动态交互

## 安装部署

1. 确保已安装Nginx
2. 修改`file_server.conf`中的路径配置
3. 将本项目文件复制到Nginx配置指定的root目录
4. 重启Nginx服务

```bash
sudo systemctl restart nginx
```

## 配置说明

- `file_server.conf`: Nginx配置文件
- `index.html`: 前端主页面
- `css/style.css`: 样式文件
- `js/main.js`: 前端交互逻辑
- `js/preview.js`: 文件预览处理逻辑

## 文件结构

```
/home/nier/share/       # 共享文件目录
file_server/
├── css
│   └── style.css
├── favicon.ico
├── file_server.conf
├── index.html
├── js
│   ├── main.js
│   └── preview.js
└── README.md

```

## 作者

Nier Demon

## 许可证

MIT License
