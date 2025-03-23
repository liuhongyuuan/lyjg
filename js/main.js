// 全局变量
let priceData = JSON.parse(localStorage.getItem('priceData')) || [];

// DOM 元素
const searchInput = document.getElementById('searchInput');
const priceGrid = document.getElementById('priceGrid');
const priceChart = document.getElementById('priceChart');
const categoryFilter = document.getElementById('categoryFilter');
const chartPeriod = document.getElementById('chartPeriod');

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 初始加载页面时强制重新获取数据
    priceData = JSON.parse(localStorage.getItem('priceData')) || [];
    console.log('页面加载，获取到数据条数:', priceData.length);
    
    // 检查数据格式
    if (priceData.length > 0) {
        console.log('数据示例:', priceData[0]);
    }
    
    // 由于HTML中已经有内容，不需要重新生成页面结构
    // 直接获取DOM元素并绑定事件
    const categoryFilter = document.getElementById('categoryFilter');
    const chartPeriod = document.getElementById('chartPeriod');
    const searchInput = document.getElementById('searchInput');

    // 添加事件监听
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            updatePriceCards(searchInput ? searchInput.value : '');
        });
    }

    if (chartPeriod) {
        chartPeriod.addEventListener('change', updateChart);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            updatePriceCards(searchTerm);
        });
    }

    // 初始化其他功能
    updateCategoryFilter();
    updatePriceCards();
    
    // 直接初始化图表，不使用setTimeout
    initializeChart();
});

// 初始化主页面
function initializeMainPage() {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    // 恢复原有的页面内容
    mainContent.innerHTML = `
        <div class="container">
            <!-- 价格概览区域 -->
            <section class="price-overview">
                <div class="filter-bar">
                    <select id="categoryFilter" class="category-select">
                        <option value="">全部类别</option>
                    </select>
                    <input type="text" id="searchInput" placeholder="搜索数据..." class="search-input">
                </div>
                <div id="priceGrid" class="price-grid"></div>
            </section>

            <!-- 价格趋势图表 -->
            <section class="price-trend">
                <div class="chart-header">
                    <h2>价格趋势</h2>
                    <select id="chartPeriod" class="period-select">
                        <option value="last3">近三年</option>
                        <option value="365">近1年</option>
                        <option value="90">近90天</option>
                        <option value="30">近30天</option>
                        <option value="7">近7天</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="priceChart"></canvas>
                </div>
            </section>
        </div>
    `;

    // 重新获取DOM元素引用
    const categoryFilter = document.getElementById('categoryFilter');
    const chartPeriod = document.getElementById('chartPeriod');
    const searchInput = document.getElementById('searchInput');
    const priceGrid = document.getElementById('priceGrid');
    const priceChart = document.getElementById('priceChart');

    // 添加事件监听
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            updatePriceCards(searchInput ? searchInput.value : '');
        });
    }

    if (chartPeriod) {
        chartPeriod.addEventListener('change', updateChart);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            updatePriceCards(searchTerm);
        });
    }

    // 初始化其他功能
    updateCategoryFilter();
    updatePriceCards();
    
    // 直接初始化图表，不使用setTimeout
    initializeChart();
}

// 更新类别筛选器
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    // 获取所有唯一的类别
    const categories = [...new Set(priceData.map(item => item.category))].sort();
    
    // 更新选择框选项
    categoryFilter.innerHTML = `
        <option value="">全部类别</option>
        ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}
    `;
}

// 更新价格卡片
function updatePriceCards(searchTerm = '') {
    const priceGrid = document.getElementById('priceGrid');
    if (!priceGrid) return;
    priceGrid.innerHTML = '';

    if (!priceData || priceData.length === 0) {
        priceGrid.innerHTML = `
            <div class="empty-state">
                <p>暂无价格数据，请先在数据录入页面导入数据</p>
                <a href="data-management.html" class="nav-btn">前往数据录入</a>
            </div>
        `;
        return;
    }

    // 筛选数据
    let filteredData = [...priceData];
    if (searchTerm) {
        filteredData = filteredData.filter(item => {
            return (item.category && item.category.toLowerCase().includes(searchTerm)) ||
                   (item.district && item.district.toLowerCase().includes(searchTerm)) ||
                   (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
                   (item.year && item.year.toString().includes(searchTerm)) ||
                   (item.price && item.price.toString().includes(searchTerm));
        });
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    if (selectedCategory) {
        filteredData = filteredData.filter(item => item.category === selectedCategory);
    }
    
    // 如果筛选后没有数据，显示提示
    if (filteredData.length === 0) {
        priceGrid.innerHTML = `
            <div class="empty-state">
                <p>没有匹配的数据</p>
            </div>
        `;
        return;
    }
    
    // 按年份分组数据
    const yearlyData = {};
    filteredData.forEach(item => {
        const year = parseInt(item.year);
        if (!yearlyData[year]) {
            yearlyData[year] = [];
        }
        yearlyData[year].push(item);
    });

    // 计算近三年的最高价和最低价
    const years = Object.keys(yearlyData).map(Number).sort((a, b) => b - a);
    
    if (years.length === 0) {
        priceGrid.innerHTML = `
            <div class="empty-state">
                <p>没有有效的年份数据</p>
            </div>
        `;
        return;
    }
    
    const last3Years = years.slice(0, Math.min(3, years.length));
    let last3YearsMaxPrice = -Infinity;
    let last3YearsMinPrice = Infinity;
    let last3YearsMaxItem = null;
    let last3YearsMinItem = null;

    last3Years.forEach(year => {
        const items = yearlyData[year];
        items.forEach(item => {
            const price = parseFloat(item.price);
            if (price > last3YearsMaxPrice) {
                last3YearsMaxPrice = price;
                last3YearsMaxItem = item;
            }
            if (price < last3YearsMinPrice) {
                last3YearsMinPrice = price;
                last3YearsMinItem = item;
            }
        });
    });

    // 创建近三年统计卡片
    if (last3Years.length > 0 && last3YearsMaxItem && last3YearsMinItem) {
        const last3YearsCard = document.createElement('div');
        last3YearsCard.className = 'price-card three-years-summary';
        last3YearsCard.innerHTML = `
            <h3>近${last3Years.length}年统计 (${last3Years.length > 1 ? last3Years[last3Years.length - 1] + '-' + last3Years[0] : last3Years[0]})</h3>
            <div class="price-info">
                <div class="price-row">
                    <span class="price-label">最高价：</span>
                    <span class="price-value max-price">¥${last3YearsMaxPrice.toFixed(2)}</span>
                </div>
                <div class="price-detail">
                    <small>${last3YearsMaxItem.year}年 ${last3YearsMaxItem.district} - ${last3YearsMaxItem.brand}</small>
                </div>
                <div class="price-row">
                    <span class="price-label">最低价：</span>
                    <span class="price-value min-price">¥${last3YearsMinPrice.toFixed(2)}</span>
                </div>
                <div class="price-detail">
                    <small>${last3YearsMinItem.year}年 ${last3YearsMinItem.district} - ${last3YearsMinItem.brand}</small>
                </div>
            </div>
        `;
        priceGrid.appendChild(last3YearsCard);
    }

    // 创建年度价格卡片
    Object.entries(yearlyData).sort((a, b) => b[0] - a[0]).forEach(([year, items]) => {
        const prices = items.map(item => parseFloat(item.price));
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        const maxPriceItem = items.find(item => parseFloat(item.price) === maxPrice);
        const minPriceItem = items.find(item => parseFloat(item.price) === minPrice);

        if (!maxPriceItem || !minPriceItem) return;

        const card = document.createElement('div');
        card.className = 'price-card';
        card.innerHTML = `
            <h3>${year}年</h3>
            <div class="price-info">
                <div class="price-row">
                    <span class="price-label">最高价：</span>
                    <span class="price-value max-price">¥${maxPrice.toFixed(2)}</span>
                </div>
                <div class="price-detail">
                    <small>${maxPriceItem.district} - ${maxPriceItem.brand}</small>
                </div>
                <div class="price-row">
                    <span class="price-label">最低价：</span>
                    <span class="price-value min-price">¥${minPrice.toFixed(2)}</span>
                </div>
                <div class="price-detail">
                    <small>${minPriceItem.district} - ${minPriceItem.brand}</small>
                </div>
                <div class="price-row">
                    <span class="price-label">平均价：</span>
                    <span class="price-value avg-price">¥${avgPrice.toFixed(2)}</span>
                </div>
                <div class="price-detail">
                    <small>共${items.length}条数据</small>
                </div>
            </div>
        `;
        priceGrid.appendChild(card);
    });
}

// 初始化图表
function initializeChart() {
    const priceChart = document.getElementById('priceChart');
    if (!priceChart) {
        console.error('找不到图表容器元素');
        return;
    }
    
    console.log('正在初始化图表...');
    
    try {
        // 确保Chart.js已加载
        if (typeof Chart === 'undefined') {
            console.error('Chart.js未加载，请确保已引入Chart.js库');
            return;
        }
        
        console.log('Chart.js已加载，开始创建图表');
        
        // 如果已存在图表实例，先销毁它
        if (window.mainChart) {
            console.log('销毁旧图表实例');
            window.mainChart.destroy();
        }

        // 创建新图表
        console.log('创建新图表实例');
        window.mainChart = new Chart(priceChart, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: '价格 (元)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '年份'
                        }
                    }
                }
            }
        });

        // 更新图表数据
        console.log('更新图表数据');
        updateChart();
    } catch (error) {
        console.error('初始化图表出错:', error);
    }
}

// 更新图表
function updateChart() {
    console.log('执行updateChart函数');
    const priceChart = document.getElementById('priceChart');
    if (!priceChart) {
        console.error('找不到图表容器元素');
        return;
    }
    
    if (!window.mainChart) {
        console.error('图表实例未创建');
        initializeChart();
        return;
    }
    
    // 清除旧的无数据提示
    const chartContainer = priceChart.parentElement;
    if (chartContainer) {
        const noDataMsg = chartContainer.querySelector('.no-data-message');
        if (noDataMsg) {
            noDataMsg.remove();
        }
    }
    
    if (!priceData || priceData.length === 0) {
        console.log('无数据，清空图表');
        window.mainChart.data.labels = [];
        window.mainChart.data.datasets = [];
        window.mainChart.update();
        
        // 显示无数据提示
        if (chartContainer) {
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data-message';
            noDataMsg.innerHTML = '<p>暂无价格数据，请先在数据录入页面导入数据</p>';
            chartContainer.appendChild(noDataMsg);
        }
        return;
    }

    console.log('图表数据总量:', priceData.length);

    // 获取选择的时间范围
    const chartPeriod = document.getElementById('chartPeriod');
    const period = chartPeriod ? chartPeriod.value : 'last3';
    console.log('选择的时间范围:', period);
    
    // 确保价格数据为数字
    const validPriceData = priceData.map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        year: item.year.toString()
    })).filter(item => !isNaN(item.price));
    
    // 筛选数据
    let filteredData = [...validPriceData];
    if (period === 'last3') {
        // 获取所有年份并排序
        const years = [...new Set(validPriceData.map(item => item.year))].sort();
        console.log('所有年份:', years);
        if (years.length > 0) {
            const currentYear = years[years.length - 1];
            filteredData = validPriceData.filter(item => {
                const year = item.year;
                return parseInt(year) >= parseInt(currentYear) - 2;
            });
        }
    } else {
        const days = parseInt(period);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredData = validPriceData.filter(item => {
            const itemDate = new Date(parseInt(item.year), 0, 1);
            return itemDate >= cutoffDate;
        });
    }

    console.log('筛选后的数据量:', filteredData.length);
    
    if (filteredData.length === 0) {
        console.log('筛选后无数据，清空图表');
        window.mainChart.data.labels = [];
        window.mainChart.data.datasets = [];
        window.mainChart.update();
        
        // 显示无数据提示
        if (chartContainer) {
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data-message';
            noDataMsg.innerHTML = '<p>所选时间范围内没有数据</p>';
            chartContainer.appendChild(noDataMsg);
        }
        return;
    }

    // 按类别分组数据
    const categoryGroups = {};
    filteredData.forEach(item => {
        if (!item.category) return;
        
        if (!categoryGroups[item.category]) {
            categoryGroups[item.category] = [];
        }
        categoryGroups[item.category].push(item);
    });

    // 获取所有年份并排序
    const years = [...new Set(filteredData.map(item => item.year))].sort();
    console.log('图表年份标签:', years);

    // 准备图表数据
    const datasets = [];
    
    Object.entries(categoryGroups).forEach(([category, items], index) => {
        // 按年份计算平均价格
        const yearlyPrices = {};
        years.forEach(year => {
            const yearItems = items.filter(item => item.year === year);
            if (yearItems.length > 0) {
                const prices = yearItems.map(item => item.price);
                const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                yearlyPrices[year] = avg;
            }
        });
        
        // 创建数据集
        const data = years.map(year => yearlyPrices[year] || null);
        
        datasets.push({
            label: category,
            data: data,
            borderColor: getChartColor(index),
            backgroundColor: getChartColor(index, 0.1),
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
        });
    });

    console.log('数据集数量:', datasets.length);
    console.log('数据集预览:', datasets.map(d => ({label: d.label, dataPoints: d.data.length})));
    
    // 更新图表数据
    window.mainChart.data.labels = years.map(year => `${year}年`);
    window.mainChart.data.datasets = datasets;
    
    // 强制更新图表
    window.mainChart.update('active');
    console.log('图表更新完成');
}

// 辅助函数：获取图表颜色
function getChartColor(index, alpha = 1) {
    const colors = [
        `rgba(75, 192, 192, ${alpha})`,
        `rgba(255, 99, 132, ${alpha})`,
        `rgba(255, 205, 86, ${alpha})`,
        `rgba(54, 162, 235, ${alpha})`,
        `rgba(153, 102, 255, ${alpha})`,
        `rgba(255, 159, 64, ${alpha})`
    ];
    return colors[index % colors.length];
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
`;
document.head.appendChild(style);

// 清除所有数据的函数
function clearAllData() {
    if (confirm('确定要清除所有历史数据吗？此操作不可恢复。')) {
        localStorage.removeItem('priceData');
        priceData = [];
        updatePriceCards();
        updateChart();
        if (searchInput) {
            searchInput.value = '';
        }
        showNotification('成功', '历史数据已清除');
    }
}

// 更新样式
style.textContent += `
    .upload-content {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .select-file-btn {
        background: #1890ff;
        color: white;
        border: none;
        border-radius: var(--border-radius);
        padding: 0.8rem 2rem;
        margin-top: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    }

    .select-file-btn:hover {
        background: #40a9ff;
    }

    .select-file-btn:active {
        transform: scale(0.98);
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        width: 100%;
        border-top: 1px solid #eee;
        padding-top: 1.5rem;
    }

    .reupload-btn, .clear-data-btn {
        flex: 1;
        padding: 0.8rem;
        border: none;
        border-radius: var(--border-radius);
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

    .reupload-btn:active, .clear-data-btn:active {
        transform: scale(0.98);
    }

    .upload-hint {
        color: #666;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .upload-icon {
        font-size: 2rem;
        color: #1890ff;
        margin-bottom: 1rem;
    }

    .district-login {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--card-shadow);
    }

    .district-login h2 {
        text-align: center;
        margin-bottom: 2rem;
        color: var(--text-color);
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .district-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--card-shadow);
        margin-bottom: 1rem;
    }

    .logout-btn {
        padding: 0.5rem 1rem;
        background: #ff4d4f;
        color: white;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .logout-btn:hover {
        background: #ff7875;
    }
`;

// 移除之前的重复样式
style.textContent = style.textContent.replace(/\.clear-data-btn \{[\s\S]*?\}/, '');
style.textContent = style.textContent.replace(/\.clear-data-btn:hover \{[\s\S]*?\}/, '');
style.textContent = style.textContent.replace(/\.clear-data-btn:active \{[\s\S]*?\}/, '');