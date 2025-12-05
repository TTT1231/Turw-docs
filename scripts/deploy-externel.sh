#!/bin/bash
# ================== 服务器定期执行脚本 ===================
# 该脚本主要在服务器内部执行，每天凌晨cron定期执行一次
# 先在本地build好后，上传zip包到服务器，再由该脚本解压更新的方式进行部署
# 项目目录: /home/Turw-docs/
# 日志文件: /home/Turw-docs/docs/.vitepress/deploy.log
# =======================================================

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

