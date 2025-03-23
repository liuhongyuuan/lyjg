// DOM 元素
const dataEntryForm = document.getElementById('dataEntryForm');
const categorySelect = document.getElementById('category');
const otherCategoryGroup = document.getElementById('otherCategoryGroup');
const otherCategoryInput = document.getElementById('otherCategory');
const searchInput = document.getElementById('searchInput');
const filterYear = document.getElementById('filterYear');
const filterCategory = document.getElementById('filterCategory');
const dataTableBody = document.getElementById('dataTableBody');
const dropZone = document.getElementById('dropZone');
const actionButtons = document.getElementById('actionButtons');

// 存储数据
let priceData = JSON.parse(localStorage.getItem('priceData')) || [];

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 创建文件输入元素
    const fileInputElement = document.createElement('input');
    fileInputElement.type = 'file';
    fileInputElement.id = 'fileInput';
    fileInputElement.accept = '.xlsx,.xls';
    fileInputElement.style.display = 'none';
    document.body.appendChild(fileInputElement);

    // 添加文件选择按钮事件监听
    const selectFileBtn = document.getElementById('selectFileBtn');
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => {
            fileInputElement.click();
        });
    }

    // 添加文件输入事件监听
    fileInputElement.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
    });

    // 添加拖放事件监听
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }

    // 添加重新上传按钮事件
    const reuploadBtn = document.getElementById('reuploadBtn');
    if (reuploadBtn) {
        reuploadBtn.addEventListener('click', () => {
            fileInputElement.value = '';
            fileInputElement.click();
        });
    }

    // 添加清除数据按钮事件
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }

    // 初始化表格和筛选器
    updateFilters();
    renderTable();
});

// 监听类别选择变化
categorySelect.addEventListener('change', () => {
    if (categorySelect.value === '其他') {
        otherCategoryGroup.style.display = 'flex';
        otherCategoryInput.required = true;
    } else {
        otherCategoryGroup.style.display = 'none';
        otherCategoryInput.required = false;
    }
});

// 表单提交处理
dataEntryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // 获取表单数据
    const formData = {
        id: Date.now(), // 使用时间戳作为唯一ID
        year: document.getElementById('year').value,
        district: document.getElementById('district').value,
        category: categorySelect.value === '其他' ? otherCategoryInput.value : categorySelect.value,
        brand: document.getElementById('brand').value,
        price: parseFloat(document.getElementById('price').value),
        notes: document.getElementById('notes').value
    };

    // 添加数据
    priceData.push(formData);
    
    // 保存到本地存储
    saveData();
    
    // 更新显示
    updateFilters();
    renderTable();
    
    // 重置表单
    dataEntryForm.reset();
    otherCategoryGroup.style.display = 'none';
    
    // 显示成功提示
    showNotification('成功', '数据已保存');
});

// 文件处理函数
async function handleFiles(files) {
    console.log('开始处理文件:', files);
    for (let file of files) {
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel') {
            try {
                console.log('读取Excel文件:', file.name);
                await handleFile(file);
            } catch (error) {
                console.error('文件处理错误:', error);
                showNotification('错误', '文件处理失败：' + error.message);
            }
        } else {
            console.warn('文件类型不支持:', file.type);
            showNotification('错误', '请上传Excel文件(.xlsx或.xls)');
        }
    }
}

// 读取Excel文件
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                // 检查表头
                const headers = jsonData[0];
                if (!headers) {
                    reject(new Error('Excel文件为空'));
                    return;
                }

                // 定义可接受的表头映射
                const headerMaps = {
                    '年份': ['年份', 'year', '年', 'Year', 'YEAR'],
                    '区县': ['区县', 'district', '地区', 'District', 'DISTRICT', '区域'],
                    '类别': ['类别', 'category', '种类', 'Category', 'CATEGORY', '商品类别'],
                    '品牌': ['品牌', 'brand', 'Brand', 'BRAND', '商标'],
                    '单价': ['单价', 'price', 'Price', 'PRICE', '价格', '单价(元/kg)', '单价（元/kg）']
                };

                // 查找表头位置
                const headerIndexes = {};
                headers.forEach((header, index) => {
                    if (!header) return;
                    const headerStr = String(header).trim();
                    for (const [key, variations] of Object.entries(headerMaps)) {
                        if (variations.includes(headerStr)) {
                            headerIndexes[key] = index;
                            break;
                        }
                    }
                });

                // 验证必需的表头是否存在
                const missingHeaders = [];
                for (const requiredHeader of Object.keys(headerMaps)) {
                    if (headerIndexes[requiredHeader] === undefined) {
                        missingHeaders.push(requiredHeader);
                    }
                }

                if (missingHeaders.length > 0) {
                    reject(new Error(`Excel文件缺少必需的列：${missingHeaders.join(', ')}\n请确保文件包含以下列：年份、区县、类别、品牌、单价`));
                    return;
                }

                // 处理数据行
                const processedData = [];
                const errors = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue; // 跳过空行

                    const rowData = {
                        id: Date.now() + Math.random(),
                        year: String(row[headerIndexes['年份']] || '').trim(),
                        district: String(row[headerIndexes['区县']] || '').trim(),
                        category: String(row[headerIndexes['类别']] || '').trim(),
                        brand: String(row[headerIndexes['品牌']] || '').trim(),
                        price: row[headerIndexes['单价']]
                    };

                    // 验证数据
                    const rowErrors = [];
                    if (!rowData.year) rowErrors.push('年份为空');
                    if (!rowData.district) rowErrors.push('区县为空');
                    if (!rowData.category) rowErrors.push('类别为空');
                    if (!rowData.brand) rowErrors.push('品牌为空');
                    if (!rowData.price || isNaN(parseFloat(rowData.price))) rowErrors.push('单价无效');

                    if (rowErrors.length > 0) {
                        errors.push(`第${i + 1}行数据有误：${rowErrors.join(', ')}`);
                        continue;
                    }

                    // 转换价格为数字
                    rowData.price = parseFloat(rowData.price);
                    processedData.push(rowData);
                }

                if (errors.length > 0) {
                    reject(new Error('数据格式有误：\n' + errors.join('\n')));
                    return;
                }

                if (processedData.length === 0) {
                    reject(new Error('没有找到有效的数据行'));
                    return;
                }

                resolve(processedData);
            } catch (error) {
                reject(new Error('Excel文件解析失败：' + error.message));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

// 处理上传的文件
async function handleFile(file) {
    try {
        const data = await readExcelFile(file);
        
        // 合并新数据
        priceData = [...priceData, ...data];
        
        // 保存到本地存储
        saveData();

        // 更新显示
        updateFilters();
        renderTable();
        showNotification('成功', `已导入 ${data.length} 条数据`);

    } catch (error) {
        console.error('文件处理错误:', error);
        showNotification('错误', error.message);
    }
}

// 清除所有数据
function clearAllData() {
    if (confirm('确定要清除所有历史数据吗？此操作不可恢复。')) {
        localStorage.removeItem('priceData');
        priceData = [];
        updateFilters();
        renderTable();
        showNotification('成功', '历史数据已清除');
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('priceData', JSON.stringify(priceData));
}

// 更新筛选器
function updateFilters() {
    // 更新年份筛选器
    const years = [...new Set(priceData.map(item => item.year))].sort((a, b) => b - a);
    filterYear.innerHTML = `
        <option value="">全部年份</option>
        ${years.map(year => `<option value="${year}">${year}年</option>`).join('')}
    `;
    
    // 更新类别筛选器
    const categories = [...new Set(priceData.map(item => item.category))].sort();
    filterCategory.innerHTML = `
        <option value="">全部类别</option>
        ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}
    `;
}

// 渲染数据表格
function renderTable(filterText = '', filterYear = '', filterCat = '') {
    if (!dataTableBody) return;
    dataTableBody.innerHTML = '';

    // 过滤数据
    let filteredData = priceData.filter(item => {
        const matchesText = !filterText || 
            Object.values(item).some(val => 
                String(val).toLowerCase().includes(filterText.toLowerCase())
            );
        const matchesYear = !filterYear || item.year === filterYear;
        const matchesCategory = !filterCat || item.category === filterCat;
        return matchesText && matchesYear && matchesCategory;
    });

    // 按年份和区县排序
    filteredData.sort((a, b) => {
        if (a.year !== b.year) {
            return b.year - a.year;
        }
        return a.district.localeCompare(b.district, 'zh-CN');
    });

    // 创建表格行
    filteredData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.year}年</td>
            <td>${item.district}</td>
            <td>${item.category}</td>
            <td>${item.brand}</td>
            <td>¥${item.price.toFixed(2)}</td>
            <td>${item.notes || '-'}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${item.id}">编辑</button>
                <button class="action-btn delete-btn" data-id="${item.id}">删除</button>
            </td>
        `;
        dataTableBody.appendChild(tr);
    });

    // 如果没有数据，显示提示
    if (filteredData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="7" style="text-align: center;">暂无数据</td>
        `;
        dataTableBody.appendChild(tr);
    }
}

// 显示通知
function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <h4>${title}</h4>
        <p>${message}</p>
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 编辑数据
function editData(id) {
    const item = priceData.find(item => item.id === id);
    if (!item) return;

    // 填充表单
    document.getElementById('year').value = item.year;
    document.getElementById('district').value = item.district;
    if (['大米', '面粉', '食用油'].includes(item.category)) {
        categorySelect.value = item.category;
        otherCategoryGroup.style.display = 'none';
    } else {
        categorySelect.value = '其他';
        otherCategoryGroup.style.display = 'flex';
        otherCategoryInput.value = item.category;
    }
    document.getElementById('brand').value = item.brand;
    document.getElementById('price').value = item.price;
    document.getElementById('notes').value = item.notes || '';

    // 删除原数据
    priceData = priceData.filter(item => item.id !== id);
    
    // 保存更新后的数据
    saveData();
    
    // 滚动到表单
    dataEntryForm.scrollIntoView({ behavior: 'smooth' });
}

// 删除数据
function deleteData(id) {
    if (!confirm('确定要删除这条数据吗？')) return;

    priceData = priceData.filter(item => item.id !== id);
    saveData();
    updateFilters();
    renderTable(searchInput.value, filterYear.value, filterCategory.value);
    showNotification('成功', '数据已删除');
}

// 监听表格操作
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
        editData(e.target.dataset.id);
    } else if (e.target.classList.contains('delete-btn')) {
        deleteData(e.target.dataset.id);
    }
});

// 监听筛选
if (searchInput) {
    searchInput.addEventListener('input', () => {
        renderTable(searchInput.value, filterYear.value, filterCategory.value);
    });
}

if (filterYear) {
    filterYear.addEventListener('change', () => {
        renderTable(searchInput.value, filterYear.value, filterCategory.value);
    });
}

if (filterCategory) {
    filterCategory.addEventListener('change', () => {
        renderTable(searchInput.value, filterYear.value, filterCategory.value);
    });
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .upload-section {
        margin-bottom: 2rem;
    }
    .upload-area {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }
    .upload-area.drag-over {
        background: rgba(0, 122, 255, 0.1);
        border-color: #007aff;
    }
    .upload-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .select-file-btn {
        background: #1890ff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.8rem 2rem;
        margin-top: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    .select-file-btn:hover {
        background: #40a9ff;
    }
    .upload-hint {
        color: #666;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }
    .template-info {
        background: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    .template-info h4 {
        margin-top: 0;
        color: #333;
    }
    .template-info ul {
        margin: 0;
        padding-left: 1.5rem;
    }
    .action-buttons {
        display: flex;
        gap: 1rem;
    }
    .reupload-btn, .clear-data-btn {
        flex: 1;
        padding: 0.8rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    .reupload-btn {
        background: #1890ff;
        color: white;
    }
    .reupload-btn:hover {
        background: #40a9ff;
    }
    .clear-data-btn {
        background: #ff4d4f;
        color: white;
    }
    .clear-data-btn:hover {
        background: #ff7875;
    }
`;
document.head.appendChild(style); 