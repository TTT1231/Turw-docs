#!/bin/bash

# 自动部署脚本
# 这里之所以在定义一个脚本就是服务器运行内存低，
# 执行之前的deploy-cloud.sh中pnpm run docs:build会因为内存不足而失败
# 所以这里依赖外部生成好的zip包来更新网站内容
# !因此原来的deploy-cloud.sh脚本暂不使用

# 定义路径
BUILD_TEMP_DIR="/home/Turw-docs/docs/.vitepress/.build-temp"
DIST_DIR="/home/Turw-docs/docs/.vitepress/dist"
LOG_FILE="/home/Turw-docs/docs/.vitepress/deploy.log"

# 确保日志文件存在
if ! touch "$LOG_FILE"; then
    exit 1
fi

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 检查临时目录是否存在
if [ ! -d "$BUILD_TEMP_DIR" ]; then
    exit 0
fi

# 检查是否有 zip 文件
ZIP_COUNT=$(find "$BUILD_TEMP_DIR" -maxdepth 1 -name "*.zip" -type f | wc -l)

if [ "$ZIP_COUNT" -eq 0 ]; then
   log "没有zip文件，退出更新。"
    exit 0
fi

# 获取最新的 zip 文件（按文件名排序，因为文件名包含时间戳）
LATEST_ZIP=$(ls -1 "$BUILD_TEMP_DIR"/*.zip 2>/dev/null | sort -r | head -n 1)

if [ -z "$LATEST_ZIP" ]; then
    exit 1
fi

log "最新的 zip 文件: $(basename "$LATEST_ZIP")。"

# 删除 dist 目录中的所有内容
if [ -d "$DIST_DIR" ]; then
    rm -rf "$DIST_DIR"/*
else
    mkdir -p "$DIST_DIR"
fi

# 解压最新的 zip 文件到 dist 目录
unzip -q -o "$LATEST_ZIP" -d "$DIST_DIR" 2>&1 | grep -v "appears to use backslashes" || true

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    exit 1
fi


# 删除临时目录中的所有文件
rm -rf "$BUILD_TEMP_DIR"/*

# 重载 nginx
/www/server/nginx/sbin/nginx -s reload

