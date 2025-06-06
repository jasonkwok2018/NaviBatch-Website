#!/bin/bash

# 通用项目备份脚本
# 备份整个项目目录，确保不会漏掉任何文件
#
# 用法: ./backup_project.sh [选项]
#   无参数     - 显示描述选择菜单
#   1         - 使用"修复"作为描述
#   2         - 使用"添加功能"作为描述
#   3         - 使用"完美"作为描述
#   [其他描述] - 使用自定义描述
#
# 示例:
#   ./backup_project.sh           # 显示描述选择菜单
#   ./backup_project.sh 1         # 创建描述为"修复"的备份
#   ./backup_project.sh 2         # 创建描述为"添加功能"的备份
#   ./backup_project.sh 3         # 创建描述为"完美"的备份
#   ./backup_project.sh "自定义描述" # 创建带自定义描述的备份

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 获取当前目录名称作为项目名称
PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
BACKUP_DIR="$HOME/my_project_backups"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")

# 预设描述选项
PRESET_1="修复"
PRESET_2="添加功能"
PRESET_3="完美"

echo -e "${CYAN}=== $PROJECT_NAME 项目备份工具 ===${NC}"
echo -e "${YELLOW}项目名称: $PROJECT_NAME${NC}"
echo -e "${YELLOW}项目目录: $PROJECT_DIR${NC}"
echo -e "${YELLOW}备份目录: $BACKUP_DIR${NC}"
echo ""

# 如果没有提供参数，显示描述选择菜单
if [ $# -eq 0 ]; then
    echo -e "${CYAN}=== $PROJECT_NAME 项目备份 ===${NC}"
    echo -e "${YELLOW}请选择备份描述:${NC}"
    echo ""
    echo -e "  1. ${GREEN}$PRESET_1${NC}"
    echo -e "  2. ${GREEN}$PRESET_2${NC}"
    echo -e "  3. ${GREEN}$PRESET_3${NC}"
    echo -e "  4. 自定义描述"
    echo ""
    echo -e "${YELLOW}请输入选项 (1-4):${NC}"

    read -r option

    case $option in
        1)
            DESCRIPTION="$PRESET_1"
            ;;
        2)
            DESCRIPTION="$PRESET_2"
            ;;
        3)
            DESCRIPTION="$PRESET_3"
            ;;
        4)
            echo -e "${YELLOW}请输入自定义描述:${NC}"
            read -r DESCRIPTION
            ;;
        *)
            echo -e "${YELLOW}无效选项，使用默认描述${NC}"
            DESCRIPTION="backup"
            ;;
    esac
# 如果提供了数字参数1-3，使用预设描述
elif [ "$1" = "1" ]; then
    DESCRIPTION="$PRESET_1"
elif [ "$1" = "2" ]; then
    DESCRIPTION="$PRESET_2"
elif [ "$1" = "3" ]; then
    DESCRIPTION="$PRESET_3"
# 否则使用提供的描述参数
else
    DESCRIPTION="$1"
fi

# 将描述中的空格替换为下划线
DESCRIPTION_FORMATTED=$(echo "$DESCRIPTION" | tr ' ' '_')

# 为项目创建单独的备份子目录
PROJECT_BACKUP_DIR="${BACKUP_DIR}/${PROJECT_NAME}"
BACKUP_FILENAME="${PROJECT_NAME}_${DATE_FORMAT}_${DESCRIPTION_FORMATTED}.zip"
FULL_BACKUP_PATH="${PROJECT_BACKUP_DIR}/${BACKUP_FILENAME}"

# 创建备份目录和项目子目录（如果不存在）
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}创建主备份目录: ${CYAN}$BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

if [ ! -d "$PROJECT_BACKUP_DIR" ]; then
    echo -e "${YELLOW}创建项目备份目录: ${CYAN}$PROJECT_BACKUP_DIR${NC}"
    mkdir -p "$PROJECT_BACKUP_DIR"
fi

# 显示备份开始信息
echo -e "\n${CYAN}=== 开始备份 $PROJECT_NAME 项目 ===${NC}"
echo -e "${YELLOW}描述:${NC} $DESCRIPTION"
echo -e "${YELLOW}时间:${NC} $(date)"
echo -e "${YELLOW}源目录:${NC} $PROJECT_DIR"
echo -e "${YELLOW}目标文件:${NC} $FULL_BACKUP_PATH"

# 显示项目目录大小
echo -e "\n${YELLOW}项目目录大小:${NC}"
du -sh "$PROJECT_DIR"

# 创建临时目录，使用项目名称作为子目录
TEMP_DIR="/tmp/project_backup_$(date +%s)"
TEMP_PROJECT_DIR="$TEMP_DIR/$PROJECT_NAME"
echo -e "\n${YELLOW}创建临时目录:${NC} $TEMP_DIR"
rm -rf "$TEMP_DIR"  # 确保临时目录不存在
mkdir -p "$TEMP_PROJECT_DIR"

# 复制项目文件到临时目录中的项目名称子目录
echo -e "${YELLOW}复制项目文件到临时目录...${NC}"
cp -R "$PROJECT_DIR"/* "$TEMP_PROJECT_DIR"/

# 创建压缩备份文件，只排除少量明确的临时目录
echo -e "${YELLOW}创建压缩备份文件...${NC}"
cd "$TEMP_DIR"
zip -r "$FULL_BACKUP_PATH" "$PROJECT_NAME" \
    -x "*/__pycache__/*" \
    -x "*.pyc" \
    -x "*.pyo" \
    -x "*.pyd" \
    -x "*/node_modules/*" \
    -x "*/.git/*" \
    -x "*/.vscode/*" \
    -x "*/.idea/*" \
    -x "*/venv/*" \
    -x "*/env/*" \
    -x "*/dist/*" \
    -x "*/build/*"

# 清理临时目录
echo -e "${YELLOW}清理临时目录...${NC}"
rm -rf "$TEMP_DIR"

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ 备份成功完成!${NC}"
    echo -e "${YELLOW}备份文件:${NC} $FULL_BACKUP_PATH"
    echo -e "${YELLOW}备份大小:${NC} $(du -h "$FULL_BACKUP_PATH" | cut -f1)"

    # 计算文件总数（使用更简单的方法）
    FILE_COUNT=$(unzip -l "$FULL_BACKUP_PATH" | wc -l)
    FILE_COUNT=$((FILE_COUNT - 5))  # 减去头部和尾部的行数
    echo -e "${YELLOW}备份文件中包含:${NC} $FILE_COUNT 个文件/目录"

    # 显示备份历史
    echo -e "\n${CYAN}最近15个备份:${NC}"
    echo -e "${YELLOW}大小\t日期\t\t\t描述${NC}"

    # 使用循环显示最近15个备份，格式化输出
    count=0
    for backup in $(ls -t "$PROJECT_BACKUP_DIR"/*.zip 2>/dev/null | head -15); do
        FILENAME=$(basename "$backup")
        FILESIZE=$(du -h "$backup" | cut -f1)
        DATE_PART=$(echo "$FILENAME" | grep -o "[0-9]\{8\}_[0-9]\{6\}")
        FORMATTED_DATE=$(date -j -f "%Y%m%d_%H%M%S" "$DATE_PART" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$DATE_PART")
        DESCRIPTION=$(echo "$FILENAME" | sed -E "s/${PROJECT_NAME}_[0-9]{8}_[0-9]{6}_(.*)\.zip/\1/" | tr '_' ' ')

        # 高亮显示当前备份
        if [ "$FILENAME" = "$BACKUP_FILENAME" ]; then
            echo -e "${GREEN}$FILESIZE\t$FORMATTED_DATE\t$DESCRIPTION ${CYAN}(当前)${NC}"
        else
            echo -e "$FILESIZE\t$FORMATTED_DATE\t$DESCRIPTION"
        fi

        ((count++))
    done

    if [ $count -eq 0 ]; then
        echo -e "${YELLOW}没有找到备份文件${NC}"
    fi

    echo -e "\n${YELLOW}完成时间:${NC} $(date)"
else
    echo -e "\n${RED}✗ 备份失败!${NC}"
    exit 1
fi

# 直接退出，不等待按键
exit 0
