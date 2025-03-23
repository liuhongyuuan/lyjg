// 确保在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('价格分析页面初始化');
    
    // 获取DOM元素
    const startYear = document.getElementById('startYear');
    const endYear = document.getElementById('endYear');
    const districtSelect = document.getElementById('district');
    const categorySelect = document.getElementById('category');
    const chartType = document.getElementById('chartType');
    const updateBtn = document.getElementById('updateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const analysisChart = document.getElementById('analysisChart');
    
    console.log('图表容器:', analysisChart ? '已找到' : '未找到');

    // 统计数据元素
    const maxPrice = document.getElementById('maxPrice');
    const minPrice = document.getElementById('minPrice');
    const avgPrice = document.getElementById('avgPrice');
    const priceVolatility = document.getElementById('priceVolatility');
    const maxPriceDetail = document.getElementById('maxPriceDetail');
    const minPriceDetail = document.getElementById('minPriceDetail');
    const avgPriceDetail = document.getElementById('avgPriceDetail');
    const volatilityDetail = document.getElementById('volatilityDetail');

    // 获取本地存储的数据
    let priceData = JSON.parse(localStorage.getItem('priceData')) || [];
    console.log('从localStorage获取数据量:', priceData.length);

    // 图表实例
    let analysisChartInstance = null;

    // 初始化页面
    function initializePage() {
        if (!analysisChart) {
            console.error('找不到图表容器元素');
            return;
        }

        // 获取本地存储的数据
        priceData = JSON.parse(localStorage.getItem('priceData')) || [];
        console.log('初始化页面时的数据量:', priceData.length);

        if (priceData.length === 0) {
            showNotification('提示', '暂无数据，请先导入或录入数据，或点击"加载演示数据"按钮');
            clearDisplays();
            return;
        }

        // 确保数据价格是数字类型
        priceData = priceData.map(item => ({
            ...item,
            price: parseFloat(item.price) || 0
        })).filter(item => !isNaN(item.price));

        // 获取所有年份并排序
        const years = [...new Set(priceData.map(item => parseInt(item.year)))].sort();
        console.log('获取到的年份:', years);
        
        // 填充年份选择器
        if (startYear && endYear) {
            startYear.innerHTML = `
                <option value="">起始年份</option>
                ${years.map(year => `<option value="${year}">${year}年</option>`).join('')}
            `;
            
            endYear.innerHTML = `
                <option value="">结束年份</option>
                ${years.map(year => `<option value="${year}">${year}年</option>`).join('')}
            `;
            
            // 默认选择最早年份和最近年份
            if (years.length > 0) {
                startYear.value = years[0];
                endYear.value = years[years.length - 1];
            }
        }

        // 获取所有地区并填充选择器
        if (districtSelect) {
            const districts = [...new Set(priceData.map(item => item.district))];
            districtSelect.innerHTML = districts.map(district => 
                `<option value="${district}">${district}</option>`
            ).join('');
            
            // 默认全选
            for (let i = 0; i < districtSelect.options.length; i++) {
                districtSelect.options[i].selected = true;
            }
        }

        // 获取所有品类并填充选择器
        if (categorySelect) {
            const categories = [...new Set(priceData.map(item => item.category))];
            categorySelect.innerHTML = categories.map(category => 
                `<option value="${category}">${category}</option>`
            ).join('');
            
            // 默认全选
            for (let i = 0; i < categorySelect.options.length; i++) {
                categorySelect.options[i].selected = true;
            }
        }

        // 更新数据显示
        updateAnalysis();
    }

    // 更新分析数据
    function updateAnalysis() {
        console.log('更新分析数据');
        
        // 获取筛选条件
        const start = startYear && startYear.value ? parseInt(startYear.value) : 0;
        const end = endYear && endYear.value ? parseInt(endYear.value) : 9999;
        
        const selectedDistricts = districtSelect ? 
            Array.from(districtSelect.selectedOptions).map(option => option.value) : [];
        
        const selectedCategories = categorySelect ? 
            Array.from(categorySelect.selectedOptions).map(option => option.value) : [];
        
        console.log('筛选条件:', { start, end, districts: selectedDistricts, categories: selectedCategories });

        // 筛选数据
        let filteredData = priceData.filter(item => {
            const year = parseInt(item.year);
            const matchYear = year >= start && year <= end;
            const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(item.district);
            const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
            return matchYear && matchDistrict && matchCategory;
        });

        console.log('筛选后的数据量:', filteredData.length);

        if (filteredData.length === 0) {
            showNotification('提示', '没有符合条件的数据');
            clearDisplays();
            return;
        }

        // 更新统计数据
        updateStatistics(filteredData);

        // 更新图表
        updateChart(filteredData);

        // 更新对比表格
        updateComparisonTable(filteredData);
    }

    // 清除显示
    function clearDisplays() {
        console.log('清除显示');
        
        // 清除统计卡片
        document.querySelectorAll('.stats-card').forEach(card => {
            if (card.querySelector('.stats-value')) {
                card.querySelector('.stats-value').textContent = '暂无数据';
            }
            if (card.querySelector('.stats-detail')) {
                card.querySelector('.stats-detail').textContent = '';
            }
        });

        // 清除图表
        if (analysisChartInstance) {
            analysisChartInstance.destroy();
            analysisChartInstance = null;
        }

        // 清除对比表格
        const comparisonTableBody = document.getElementById('comparisonTableBody');
        if (comparisonTableBody) {
            comparisonTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state-cell">暂无数据，请先导入或选择数据</td>
                </tr>
            `;
        }
    }

    // 更新统计数据
    function updateStatistics(data) {
        if (!data || data.length === 0) {
            console.warn('没有数据可供分析');
            showNotification('提示', '暂无数据可供分析');
            return;
        }

        console.log('更新统计数据，数据量:', data.length);

        // 确保价格是数字
        const validData = data.map(item => ({
            ...item,
            price: parseFloat(item.price) || 0
        })).filter(item => !isNaN(item.price));

        if (validData.length === 0) {
            console.warn('没有有效的价格数据');
            return;
        }

        // 计算最高价格和最低价格
        let maxPriceItem = validData[0];
        let minPriceItem = validData[0];
        let maxPrice = parseFloat(validData[0].price);
        let minPrice = parseFloat(validData[0].price);

        validData.forEach(item => {
            const price = parseFloat(item.price);
            if (price > maxPrice) {
                maxPrice = price;
                maxPriceItem = item;
            }
            if (price < minPrice) {
                minPrice = price;
                minPriceItem = item;
            }
        });

        // 计算平均价格
        const avgPriceValue = validData.reduce((sum, item) => sum + parseFloat(item.price), 0) / validData.length;

        // 计算价格波动率
        const priceVariation = calculatePriceVariation(validData);

        // 更新统计卡片
        const statsCards = document.querySelectorAll('.stats-card');
        
        // 最高价格
        if (statsCards[0]) {
            statsCards[0].innerHTML = `
                <h3>最高价格</h3>
                <div class="stats-value">¥${maxPrice.toFixed(2)}</div>
                <div class="stats-detail">${maxPriceItem.year}年 ${maxPriceItem.district}<br>${maxPriceItem.brand} ${maxPriceItem.category}</div>
            `;
        }

        // 最低价格
        if (statsCards[1]) {
            statsCards[1].innerHTML = `
                <h3>最低价格</h3>
                <div class="stats-value">¥${minPrice.toFixed(2)}</div>
                <div class="stats-detail">${minPriceItem.year}年 ${minPriceItem.district}<br>${minPriceItem.brand} ${minPriceItem.category}</div>
            `;
        }

        // 平均价格
        if (statsCards[2]) {
            statsCards[2].innerHTML = `
                <h3>平均价格</h3>
                <div class="stats-value">¥${avgPriceValue.toFixed(2)}</div>
                <div class="stats-detail">全部数据平均值</div>
            `;
        }

        // 价格波动
        if (statsCards[3]) {
            statsCards[3].innerHTML = `
                <h3>价格波动</h3>
                <div class="stats-value">${(priceVariation * 100).toFixed(1)}%</div>
                <div class="stats-detail">价格波动率</div>
            `;
        }
    }

    // 计算价格波动率
    function calculatePriceVariation(data) {
        if (data.length < 2) return 0;
        
        const prices = data.map(item => parseFloat(item.price) || 0).filter(price => !isNaN(price));
        if (prices.length < 2) return 0;
        
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        return avgPrice > 0 ? (maxPrice - minPrice) / avgPrice : 0;
    }

    // 更新图表
    function updateChart(data) {
        if (!analysisChart || !data || data.length === 0) {
            console.warn('没有图表数据或图表容器不存在');
            return;
        }

        console.log('更新图表，数据量:', data.length);

        // 如果已存在图表实例，先销毁它
        if (analysisChartInstance) {
            analysisChartInstance.destroy();
            analysisChartInstance = null;
        }

        // 确保数据类型正确
        const validData = data.map(item => ({
            ...item,
            year: parseInt(item.year),
            price: parseFloat(item.price) || 0
        })).filter(item => !isNaN(item.year) && !isNaN(item.price));

        // 按年份和品类分组数据
        const groupedData = {};
        const categories = [...new Set(validData.map(item => item.category))];
        const years = [...new Set(validData.map(item => item.year))].sort();

        console.log('图表分组:', { categories, years });

        // 填充数据
        validData.forEach(item => {
            if (!groupedData[item.category]) {
                groupedData[item.category] = {};
            }
            
            if (!groupedData[item.category][item.year]) {
                groupedData[item.category][item.year] = [];
            }
            
            groupedData[item.category][item.year].push(item.price);
        });

        // 准备图表数据
        const datasets = categories.map((category, index) => {
            const prices = years.map(year => {
                const categoryPrices = groupedData[category] && groupedData[category][year] ? groupedData[category][year] : [];
                if (categoryPrices.length === 0) return null;
                const avg = categoryPrices.reduce((sum, price) => sum + price, 0) / categoryPrices.length;
                return parseFloat(avg.toFixed(2));
            });

            const chartTypeValue = chartType ? chartType.value : 'line';
            return {
                label: category,
                data: prices,
                borderColor: getChartColor(index),
                backgroundColor: getChartColor(index, chartTypeValue === 'bar' ? 0.6 : 0.1),
                fill: chartTypeValue === 'area',
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            };
        });

        console.log('图表数据集:', datasets.map(d => ({label: d.label, dataLength: d.data.length})));

        // 获取图表类型
        const chartTypeValue = chartType ? (chartType.value === 'area' ? 'line' : chartType.value) : 'line';
        
        // 创建新图表
        const ctx = analysisChart.getContext('2d');
        analysisChartInstance = new Chart(ctx, {
            type: chartTypeValue,
            data: {
                labels: years.map(year => `${year}年`),
                datasets: datasets
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
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.parsed.y === null) return null;
                                return `${context.dataset.label}: ¥${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: '价格 (元/kg)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toFixed(2);
                            }
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

    // 更新对比表格
    function updateComparisonTable(data) {
        const tbody = document.getElementById('comparisonTableBody');
        if (!tbody) {
            console.warn('找不到对比表格主体元素');
            return;
        }
        
        console.log('更新对比表格');
        tbody.innerHTML = '';

        // 确保数据类型正确
        const validData = data.map(item => ({
            ...item,
            price: parseFloat(item.price) || 0
        })).filter(item => !isNaN(item.price));

        if (validData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state-cell">暂无有效价格数据</td>
                </tr>
            `;
            return;
        }

        // 分别按区域、类别和品牌分组
        const groups = {
            district: {},
            category: {},
            brand: {}
        };

        // 初始化分组
        validData.forEach(item => {
            ['district', 'category', 'brand'].forEach(key => {
                const value = item[key];
                if (value) {
                    if (!groups[key][value]) {
                        groups[key][value] = [];
                    }
                    groups[key][value].push(item);
                }
            });
        });

        // 添加分组标题和数据
        const groupTitles = {
            district: '按区域统计',
            category: '按类别统计',
            brand: '按品牌统计'
        };

        Object.entries(groupTitles).forEach(([key, title]) => {
            // 添加分组标题
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `<td colspan="5" class="group-header">${title}</td>`;
            tbody.appendChild(headerRow);
            
            const entries = Object.entries(groups[key]);
            if (entries.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="5" class="empty-state-cell">暂无${title}数据</td>`;
                tbody.appendChild(emptyRow);
            } else {
                // 添加该分组的所有数据行
                entries.forEach(([name, items]) => {
                    if (items.length > 0) {
                        const prices = items.map(item => item.price).filter(price => !isNaN(price));
                        if (prices.length > 0) {
                            const min = Math.min(...prices);
                            const max = Math.max(...prices);
                            const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                            const variation = calculatePriceVariation(items);

                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${name}</td>
                                <td>¥${min.toFixed(2)}</td>
                                <td>¥${max.toFixed(2)}</td>
                                <td>¥${avg.toFixed(2)}</td>
                                <td>${(variation * 100).toFixed(1)}%</td>
                            `;
                            tbody.appendChild(tr);
                        }
                    }
                });
            }
        });
    }

    // 显示通知
    function showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
        `;

        const container = document.getElementById('notificationContainer');
        if (container) {
            container.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }

    // 事件监听
    if (updateBtn) {
        updateBtn.addEventListener('click', updateAnalysis);
    }
    if (chartType) {
        chartType.addEventListener('change', updateAnalysis);
    }
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (analysisChart) {
                const link = document.createElement('a');
                link.download = '价格趋势分析.png';
                link.href = analysisChart.toDataURL('image/png');
                link.click();
            }
        });
    }

    // 初始化页面
    initializePage();
});