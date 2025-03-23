// 示例数据：粮油价格记录
const demoData = [
  // 大米类
  { year: "2023", category: "大米", district: "北京", brand: "京香优质大米", price: "5.80" },
  { year: "2022", category: "大米", district: "北京", brand: "京香优质大米", price: "5.60" },
  { year: "2021", category: "大米", district: "北京", brand: "京香优质大米", price: "5.40" },
  { year: "2023", category: "大米", district: "上海", brand: "沪上贡米", price: "6.20" },
  { year: "2022", category: "大米", district: "上海", brand: "沪上贡米", price: "5.90" },
  { year: "2021", category: "大米", district: "上海", brand: "沪上贡米", price: "5.50" },
  { year: "2023", category: "大米", district: "广州", brand: "珠江香米", price: "5.90" },
  { year: "2022", category: "大米", district: "广州", brand: "珠江香米", price: "5.70" },
  { year: "2021", category: "大米", district: "广州", brand: "珠江香米", price: "5.30" },

  // 面粉类
  { year: "2023", category: "面粉", district: "北京", brand: "北方雪花粉", price: "4.80" },
  { year: "2022", category: "面粉", district: "北京", brand: "北方雪花粉", price: "4.50" },
  { year: "2021", category: "面粉", district: "北京", brand: "北方雪花粉", price: "4.20" },
  { year: "2023", category: "面粉", district: "上海", brand: "海之星面粉", price: "5.10" },
  { year: "2022", category: "面粉", district: "上海", brand: "海之星面粉", price: "4.80" },
  { year: "2021", category: "面粉", district: "上海", brand: "海之星面粉", price: "4.50" },
  { year: "2023", category: "面粉", district: "广州", brand: "南粤金粉", price: "4.90" },
  { year: "2022", category: "面粉", district: "广州", brand: "南粤金粉", price: "4.60" },
  { year: "2021", category: "面粉", district: "广州", brand: "南粤金粉", price: "4.40" },

  // 食用油类
  { year: "2023", category: "食用油", district: "北京", brand: "长城花生油", price: "22.80" },
  { year: "2022", category: "食用油", district: "北京", brand: "长城花生油", price: "21.50" },
  { year: "2021", category: "食用油", district: "北京", brand: "长城花生油", price: "19.80" },
  { year: "2023", category: "食用油", district: "上海", brand: "鲁花食用油", price: "24.50" },
  { year: "2022", category: "食用油", district: "上海", brand: "鲁花食用油", price: "23.20" },
  { year: "2021", category: "食用油", district: "上海", brand: "鲁花食用油", price: "21.90" },
  { year: "2023", category: "食用油", district: "广州", brand: "金龙鱼调和油", price: "18.90" },
  { year: "2022", category: "食用油", district: "广州", brand: "金龙鱼调和油", price: "17.80" },
  { year: "2021", category: "食用油", district: "广州", brand: "金龙鱼调和油", price: "16.50" },

  // 杂粮类
  { year: "2023", category: "杂粮", district: "北京", brand: "北方小米", price: "8.50" },
  { year: "2022", category: "杂粮", district: "北京", brand: "北方小米", price: "8.20" },
  { year: "2021", category: "杂粮", district: "北京", brand: "北方小米", price: "7.80" },
  { year: "2023", category: "杂粮", district: "上海", brand: "东北黑米", price: "12.80" },
  { year: "2022", category: "杂粮", district: "上海", brand: "东北黑米", price: "12.20" },
  { year: "2021", category: "杂粮", district: "上海", brand: "东北黑米", price: "11.50" },
  { year: "2023", category: "杂粮", district: "广州", brand: "南方红豆", price: "9.80" },
  { year: "2022", category: "杂粮", district: "广州", brand: "南方红豆", price: "9.40" },
  { year: "2021", category: "杂粮", district: "广州", brand: "南方红豆", price: "8.90" }
];

// 将示例数据写入localStorage
function loadDemoData() {
  localStorage.setItem('priceData', JSON.stringify(demoData));
  console.log('示例数据已加载到localStorage');
  return demoData.length;
} 