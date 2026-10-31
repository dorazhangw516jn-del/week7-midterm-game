let balloon;
let clouds = [];
let mice = [];

let score = 0;
let gameTime = 0; // 單位：秒
let maxTime = 120; // 2 分鐘 (120 秒)
let gameState = "RULES"; // "RULES" (規則畫面), "PLAYING" (遊戲中), "GAMEOVER" (結算畫面)
let ruleStartTime = 0;
let gameResult = ""; // "WIN", "TIME_UP_HIGH", "TIME_UP_LOW"

// Web Audio API 音效控制
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// 答對音效
function playCorrectSound() {
  initAudio();
  if (!audioCtx) return;
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
  osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

// 答錯音效
function playWrongSound() {
  initAudio();
  if (!audioCtx) return;
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.setValueAtTime(100, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

// 獲勝音效：歡呼鼓掌聲
function playWinSound() {
  initAudio();
  if (!audioCtx) return;
  let notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, index) => {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + index * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.1 + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + index * 0.1);
    osc.stop(audioCtx.currentTime + index * 0.1 + 0.25);
  });
}

// 時間到加油聲
function playCheerUpSound() {
  initAudio();
  if (!audioCtx) return;
  let notes = [440, 554.37, 659.25, 880];
  notes.forEach((freq, index) => {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.12);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.12 + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + index * 0.12);
    osc.stop(audioCtx.currentTime + index * 0.12 + 0.35);
  });
}

// 完整 100 個單字題庫
const wordBank = [
  { word: "Student", note: "學生", isCorrect: true },
  { word: "Student", note: "老師", isCorrect: false },
  { word: "Teacher", note: "教師、老師", isCorrect: true },
  { word: "Teacher", note: "學生", isCorrect: false },
  { word: "Classroom", note: "教室", isCorrect: true },
  { word: "Classroom", note: "操場", isCorrect: false },
  { word: "Subject", note: "學科、科目", isCorrect: true },
  { word: "Subject", note: "物件", isCorrect: false },
  { word: "English", note: "英語；(adj.) 英國的", isCorrect: true },
  { word: "English", note: "數學", isCorrect: false },
  { word: "History", note: "歷史", isCorrect: true },
  { word: "History", note: "地理", isCorrect: false },
  { word: "Science", note: "科學", isCorrect: true },
  { word: "Science", note: "體育", isCorrect: false },
  { word: "Library", note: "圖書館", isCorrect: true },
  { word: "Library", note: "書局", isCorrect: false },
  { word: "Homework", note: "家用作業、作業", isCorrect: true },
  { word: "Homework", note: "家事", isCorrect: false },
  { word: "Exam", note: "測驗、考試", isCorrect: true },
  { word: "Exam", note: "練習", isCorrect: false },
  { word: "Family", note: "家庭、家人", isCorrect: true },
  { word: "Family", note: "朋友", isCorrect: false },
  { word: "Parent", note: "雙親之一（父或母）", isCorrect: true },
  { word: "Parent", note: "祖父母", isCorrect: false },
  { word: "Brother", note: "兄弟", isCorrect: true },
  { word: "Brother", note: "姐妹", isCorrect: false },
  { word: "Sister", note: "姐妹", isCorrect: true },
  { word: "Sister", note: "兄弟", isCorrect: false },
  { word: "House", note: "房屋、住宅", isCorrect: true },
  { word: "House", note: "公園", isCorrect: false },
  { word: "Kitchen", note: "廚房", isCorrect: true },
  { word: "Kitchen", note: "浴室", isCorrect: false },
  { word: "Bedroom", note: "臥室", isCorrect: true },
  { word: "Bedroom", note: "陽台", isCorrect: false },
  { word: "Breakfast", note: "早餐", isCorrect: true },
  { word: "Breakfast", note: "午餐", isCorrect: false },
  { word: "Dinner", note: "晚餐、正餐", isCorrect: true },
  { word: "Dinner", note: "早餐", isCorrect: false },
  { word: "Friend", note: "朋友", isCorrect: true },
  { word: "Friend", note: "敵人", isCorrect: false },
  { word: "Weather", note: "天氣", isCorrect: true },
  { word: "Weather", note: "氣候", isCorrect: false },
  { word: "Season", note: "季節", isCorrect: true },
  { word: "Season", note: "月份", isCorrect: false },
  { word: "Spring", note: "春天；泉水", isCorrect: true },
  { word: "Spring", note: "夏天", isCorrect: false },
  { word: "Summer", note: "夏天", isCorrect: true },
  { word: "Summer", note: "春天", isCorrect: false },
  { word: "Autumn", note: "秋天 (=Fall)", isCorrect: true },
  { word: "Autumn", note: "夏天", isCorrect: false },
  { word: "Winter", note: "冬天", isCorrect: true },
  { word: "Winter", note: "春天", isCorrect: false },
  { word: "Flower", note: "花朵", isCorrect: true },
  { word: "Flower", note: "樹木", isCorrect: false },
  { word: "River", note: "河流", isCorrect: true },
  { word: "River", note: "海洋", isCorrect: false },
  { word: "Mountain", note: "高山", isCorrect: true },
  { word: "Mountain", note: "丘陵", isCorrect: false },
  { word: "Animal", note: "動物", isCorrect: true },
  { word: "Animal", note: "植物", isCorrect: false },
  { word: "Apple", note: "蘋果", isCorrect: true },
  { word: "Apple", note: "香蕉", isCorrect: false },
  { word: "Banana", note: "香蕉", isCorrect: true },
  { word: "Banana", note: "水蜜桃", isCorrect: false },
  { word: "Bread", note: "麵包", isCorrect: true },
  { word: "Bread", note: "蛋糕", isCorrect: false },
  { word: "Water", note: "水", isCorrect: true },
  { word: "Water", note: "果汁", isCorrect: false },
  { word: "Chicken", note: "雞肉；小雞", isCorrect: true },
  { word: "Chicken", note: "豬肉", isCorrect: false },
  { word: "Elephant", note: "大象", isCorrect: true },
  { word: "Elephant", note: "獅子", isCorrect: false },
  { word: "Monkey", note: "猴子", isCorrect: true },
  { word: "Monkey", note: "猩猩", isCorrect: false },
  { word: "Rabbit", note: "兔子", isCorrect: true },
  { word: "Rabbit", note: "貓咪", isCorrect: false },
  { word: "Tiger", note: "老虎", isCorrect: true },
  { word: "Tiger", note: "豹", isCorrect: false },
  { word: "Vegetable", note: "蔬菜", isCorrect: true },
  { word: "Vegetable", note: "水果", isCorrect: false },
  { word: "Station", note: "車站、局/所", isCorrect: true },
  { word: "Station", note: "機場", isCorrect: false },
  { word: "Airport", note: "機場", isCorrect: true },
  { word: "Airport", note: "火車站", isCorrect: false },
  { word: "Bicycle", note: "腳踏車 (=Bike)", isCorrect: true },
  { word: "Bicycle", note: "摩托車", isCorrect: false },
  { word: "Bus", note: "公車、巴士", isCorrect: true },
  { word: "Bus", note: "計程車", isCorrect: false },
  { word: "Hospital", note: "醫院", isCorrect: true },
  { word: "Hospital", note: "藥局", isCorrect: false },
  { word: "Market", note: "市場", isCorrect: true },
  { word: "Market", note: "超商", isCorrect: false },
  { word: "Park", note: "公園；(v.) 停車", isCorrect: true },
  { word: "Park", note: "停車場", isCorrect: false },
  { word: "Street", note: "街道", isCorrect: true },
  { word: "Street", note: "高速公路", isCorrect: false },
  { word: "Train", note: "火車；(v.) 訓練", isCorrect: true },
  { word: "Train", note: "高鐵", isCorrect: false },
  { word: "Country", note: "國家；鄉村", isCorrect: true },
  { word: "Country", note: "城市", isCorrect: false },
  { word: "Doctor", note: "醫生；博士", isCorrect: true },
  { word: "Doctor", note: "護理師", isCorrect: false },
  { word: "Nurse", note: "護理師、護士", isCorrect: true },
  { word: "Nurse", note: "醫生", isCorrect: false },
  { word: "Police", note: "警察", isCorrect: true },
  { word: "Police", note: "消防員", isCorrect: false },
  { word: "Driver", note: "司機、駕駛", isCorrect: true },
  { word: "Driver", note: "乘客", isCorrect: false },
  { word: "Farmer", note: "農夫", isCorrect: true },
  { word: "Farmer", note: "工人", isCorrect: false },
  { word: "Singer", note: "歌手", isCorrect: true },
  { word: "Singer", note: "演員", isCorrect: false },
  { word: "Writer", note: "作家", isCorrect: true },
  { word: "Writer", note: "記者", isCorrect: false },
  { word: "Worker", note: "工人、工作者", isCorrect: true },
  { word: "Worker", note: "老闆", isCorrect: false },
  { word: "Chef", note: "主廚、廚師", isCorrect: true },
  { word: "Chef", note: "服務生", isCorrect: false },
  { word: "Student", note: "學生", isCorrect: true },
  { word: "Student", note: "校長", isCorrect: false },
  { word: "Beautiful", note: "美麗的", isCorrect: true },
  { word: "Beautiful", note: "醜陋的", isCorrect: false },
  { word: "Important", note: "重要的", isCorrect: true },
  { word: "Important", note: "輕微的", isCorrect: false },
  { word: "Difficult", note: "困難的", isCorrect: true },
  { word: "Difficult", note: "容易的", isCorrect: false },
  { word: "Famous", note: "有名的", isCorrect: true },
  { word: "Famous", note: "陌生的", isCorrect: false },
  { word: "Happy", note: "快樂的", isCorrect: true },
  { word: "Happy", note: "悲傷的", isCorrect: false },
  { word: "Healthy", note: "健康的", isCorrect: true },
  { word: "Healthy", note: "虛弱的", isCorrect: false },
  { word: "Interesting", note: "有趣的", isCorrect: true },
  { word: "Interesting", note: "無聊的", isCorrect: false },
  { word: "Special", note: "特殊的、特別的", isCorrect: true },
  { word: "Special", note: "普通的", isCorrect: false },
  { word: "Strong", note: "強壯的", isCorrect: true },
  { word: "Strong", note: "虛弱的", isCorrect: false },
  { word: "Young", note: "年輕的", isCorrect: true },
  { word: "Young", note: "年老的", isCorrect: false },
  { word: "Become", note: "變成、成為", isCorrect: true },
  { word: "Become", note: "保持", isCorrect: false },
  { word: "Believe", note: "相信", isCorrect: true },
  { word: "Believe", note: "懷疑", isCorrect: false },
  { word: "Change", note: "改變；(n.) 零錢", isCorrect: true },
  { word: "Change", note: "維持", isCorrect: false },
  { word: "Create", note: "創造、創作", isCorrect: true },
  { word: "Create", note: "破壞", isCorrect: false },
  { word: "Decide", note: "決定", isCorrect: true },
  { word: "Decide", note: "猶豫", isCorrect: false },
  { word: "Finish", note: "完成、結束", isCorrect: true },
  { word: "Finish", note: "開始", isCorrect: false },
  { word: "Happen", note: "發生", isCorrect: true },
  { word: "Happen", note: "避免", isCorrect: false },
  { word: "Listen", note: "傾聽", isCorrect: true },
  { word: "Listen", note: "看見", isCorrect: false },
  { word: "Practice", note: "練習", isCorrect: true },
  { word: "Practice", note: "表演", isCorrect: false },
  { word: "Remember", note: "記得", isCorrect: true },
  { word: "Remember", note: "忘記", isCorrect: false },
  { word: "Morning", note: "早晨、上午", isCorrect: true },
  { word: "Morning", note: "中午", isCorrect: false },
  { word: "Afternoon", note: "下午", isCorrect: true },
  { word: "Afternoon", note: "上午", isCorrect: false },
  { word: "Evening", note: "傍晚、晚上", isCorrect: true },
  { word: "Evening", note: "清晨", isCorrect: false },
  { word: "Yesterday", note: "昨天", isCorrect: true },
  { word: "Yesterday", note: "今天", isCorrect: false },
  { word: "Tomorrow", note: "明天", isCorrect: true },
  { word: "Tomorrow", note: "昨天", isCorrect: false },
  { word: "Future", note: "未來；(adj.) 未來的", isCorrect: true },
  { word: "Future", note: "過去", isCorrect: false },
  { word: "Center", note: "中心、中央", isCorrect: true },
  { word: "Center", note: "邊緣", isCorrect: false },
  { word: "Corner", note: "角落、轉角", isCorrect: true },
  { word: "Corner", note: "中心", isCorrect: false },
  { word: "Inside", note: "在...裡面", isCorrect: true },
  { word: "Inside", note: "在外面", isCorrect: false },
  { word: "Outside", note: "在...外面", isCorrect: true },
  { word: "Outside", note: "在裡面", isCorrect: false },
  { word: "Answer", note: "回答、答案", isCorrect: true },
  { word: "Answer", note: "問題", isCorrect: false },
  { word: "Question", note: "問題；(v.) 詢問", isCorrect: true },
  { word: "Question", note: "答案", isCorrect: false },
  { word: "Problem", note: "難題、問題", isCorrect: true },
  { word: "Problem", note: "方法", isCorrect: false },
  { word: "Reason", note: "理由、原因", isCorrect: true },
  { word: "Reason", note: "結果", isCorrect: false },
  { word: "Result", note: "結果", isCorrect: true },
  { word: "Result", note: "原因", isCorrect: false },
  { word: "Knowledge", note: "知識", isCorrect: true },
  { word: "Knowledge", note: "常識", isCorrect: false },
  { word: "Language", note: "語言", isCorrect: true },
  { word: "Language", note: "文化", isCorrect: false },
  { word: "Meaning", note: "意思、意義", isCorrect: true },
  { word: "Meaning", note: "發音", isCorrect: false },
  { word: "Number", note: "數字、號碼", isCorrect: true },
  { word: "Number", note: "符號", isCorrect: false },
  { word: "World", note: "世界", isCorrect: true },
  { word: "World", note: "國家", isCorrect: false }
];

function setup() {
  createCanvas(600, 700);
  balloon = new Balloon(width / 2, height - 120);
  textAlign(CENTER, CENTER);
  ruleStartTime = millis(); // 記錄規則畫面開始的時間
}

// 阻止方向鍵讓網頁捲動
function keyPressed() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    return false; 
  }
}

function draw() {
  background(210, 235, 255);

  // === 1. 遊戲規則畫面 (10秒倒數) ===
  if (gameState === "RULES") {
    background(25, 45, 75); // 規則畫面深藍背景

    fill(255, 220, 100);
    textSize(32);
    textStyle(BOLD);
    text("遊戲規則", width / 2, 60);

    fill(255);
    textSize(15);
    textStyle(NORMAL);
    textAlign(LEFT, TOP);
    
    let rulesText = 
      "1. 使用方向鍵(上、左、右)。\n\n" +
      "2. 努力接到正確英文單字配對正確註解的雲朵以及小老鼠。\n\n" +
      "3. 接到正確的雲朵及小老鼠可積 +5 分，接錯誤的可積 -3 分。\n\n" +
      "4. 在兩分鐘內累積越多分，達 100 分時即結束遊戲獲得勝利。\n\n" +
      "大家加油！遊戲即將開始！";
      
    // 繪製靠左對齊的規則內文區塊
    text(rulesText, 60, 120, width - 120, height - 200);

    // 計算剩餘秒數 (10 秒倒數)
    let elapsed = Math.floor((millis() - ruleStartTime) / 1000);
    let ruleTimeLeft = max(0, 10 - elapsed);

    textAlign(CENTER, CENTER);
    textSize(18);
    fill(100, 255, 100);
    text(`遊戲即將在 ${ruleTimeLeft} 秒後開始...`, width / 2, height - 55);

    // 時間到切換至遊戲進行中狀態
    if (ruleTimeLeft <= 0) {
      gameState = "PLAYING";
      gameTime = 0;
    }
    return;
  }

  // 畫出綠色草地地板
  fill(100, 180, 90);
  noStroke();
  rect(0, height - 40, width, 40);

  // === 2. 遊戲時間與計時機制（120秒） ===
  if (gameState === "PLAYING") {
    if (frameCount % 60 === 0) { 
      gameTime++;

      // 時間到 (2分鐘 = 120秒)
      if (gameTime >= maxTime) {
        gameState = "GAMEOVER";
        if (score >= 60) {
          gameResult = "TIME_UP_HIGH"; // 60 ~ 99 分
        } else {
          gameResult = "TIME_UP_LOW";  // 0 ~ 59 分
        }
        playCheerUpSound();
      }
    }

    if (frameCount % 90 === 0) {
      let data = random(wordBank);
      clouds.push(new Cloud(random(60, width - 60), -40, data.word, data.note, data.isCorrect));
    }

    if (frameCount % 480 === 0) {
      let data = random(wordBank);
      let spawnX = random() < 0.5 ? -30 : width + 30;
      let dir = spawnX < 0 ? 1 : -1;
      mice.push(new MouseItem(spawnX, height - 55, data.word, data.note, data.isCorrect, dir));
    }
  }

  // === 3. 更新與繪製氣球 ===
  if (gameState === "PLAYING") {
    balloon.update();
    balloon.display();
  }

  // === 4. 處理雲朵邏輯與碰撞 ===
  for (let i = clouds.length - 1; i >= 0; i--) {
    if (gameState === "PLAYING") {
      clouds[i].update();
    }
    clouds[i].display();

    if (gameState === "PLAYING" && dist(balloon.x, balloon.y, clouds[i].x, clouds[i].y) < (balloon.r + clouds[i].r) * 0.85) {
      applyResult(clouds[i].isCorrect);
      clouds.splice(i, 1);
      continue;
    }

    if (clouds[i].y > height) {
      clouds.splice(i, 1);
    }
  }

  // === 5. 處理地面小老鼠邏輯與碰撞 ===
  for (let i = mice.length - 1; i >= 0; i--) {
    if (gameState === "PLAYING") {
      mice[i].update();
    }
    mice[i].display();

    if (gameState === "PLAYING" && dist(balloon.x, balloon.y, mice[i].x, mice[i].y) < (balloon.r + mice[i].r) * 0.85) {
      applyResult(mice[i].isCorrect);
      mice.splice(i, 1);
      continue;
    }

    if (mice[i].x < -50 || mice[i].x > width + 50) {
      mice.splice(i, 1);
    }
  }

  // === 6. 勝負條件檢查（分數達到 100 分直接獲勝） ===
  if (gameState === "PLAYING") {
    if (score >= 100) {
      gameState = "GAMEOVER";
      gameResult = "WIN";
      playWinSound();
    }
  }

  // === 7. 繪製頂部 UI 介面 ===
  drawUI();

  // === 8. 結束畫面 ===
  if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  }
}

// === 碰撞結算函數（對 +5 分，錯 -3 分，最低 0 分） ===
function applyResult(isCorrect) {
  if (isCorrect) {
    score += 5;
    playCorrectSound();
  } else {
    score = max(0, score - 3);
    playWrongSound();
  }
}

// === 頂部 UI ===
function drawUI() {
  fill(0, 150);
  rect(0, 0, width, 55);

  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text(`🏆 分數: ${score} / 100`, 30, 28);
  
  let remTime = maxTime - gameTime;
  let min = Math.floor(remTime / 60);
  let sec = remTime % 60;
  let timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  text(`⏱️ 時間: ${timeStr}`, 450, 28);
}

// === 結算畫面展示 ===
function drawGameOverScreen() {
  fill(0, 200);
  rect(0, 0, width, height);

  textSize(32);
  textAlign(CENTER, CENTER);

  if (gameResult === "WIN") {
    fill(100, 255, 100);
    text("🎉 恭喜你獲勝！", width / 2, height / 2 - 120);
    drawGeometricPeople("dance", 3); // 3個人跳舞
  } else if (gameResult === "TIME_UP_HIGH") {
    fill(255, 220, 90);
    text("👍 快成功了，繼續努力！", width / 2, height / 2 - 120);
    drawGeometricPeople("jump", 5); // 5個人蹦蹦跳跳
  } else if (gameResult === "TIME_UP_LOW") {
    fill(255, 180, 90);
    text("⭐ 相信自己，不要放棄！", width / 2, height / 2 - 120);
    drawGeometricPeople("jump", 5); // 5個人蹦蹦跳跳
  }

  textSize(20);
  fill(255);
  text(`最終得分: ${score} 分`, width / 2, height / 2 + 130);
}

// === 繪製幾何小人動畫（跳舞或蹦蹦跳跳） ===
function drawGeometricPeople(state, count) {
  let centerX = width / 2;
  let baseY = height / 2 + 50;

  let spacing = count === 5 ? 75 : 120;
  let startX = centerX - ((count - 1) * spacing) / 2;

  for (let i = 0; i < count; i++) {
    let px = startX + i * spacing;
    let py = baseY;

    push();
    if (state === "dance") {
      let jump = sin(frameCount * 0.15 + i) * 15;
      py += jump;
      
      fill(255, 150 + i * 30, 100);
      rectMode(CENTER);
      rect(px, py, 35, 45, 8);

      fill(255, 220, 150);
      ellipse(px, py - 35, 30, 30);

      stroke(255, 200, 100);
      strokeWeight(3);
      let armAngle = sin(frameCount * 0.2 + i) * 0.8;
      line(px - 18, py - 10, px - 35 + sin(frameCount * 0.2)*8, py - 25 + armAngle * 18);
      line(px + 18, py - 10, px + 35 - sin(frameCount * 0.2)*8, py - 25 - armAngle * 18);

      fill(100, 200, 255);
      noStroke();
      triangle(px - 18, py - 50, px + 18, py - 50, px, py - 75);

    } else if (state === "jump") {
      let bounce = abs(sin(frameCount * 0.2 + i * 0.6)) * 25;
      py -= bounce;

      fill(100, 220 + i * 8, 180);
      rectMode(CENTER);
      rect(px, py, 30, 40, 6);

      fill(255, 240, 180);
      ellipse(px, py - 30, 26, 26);

      stroke(200, 220, 150);
      strokeWeight(3);
      line(px - 15, py - 10, px - 28, py - 45);
      line(px + 15, py - 10, px + 28, py - 45);
    }
    pop();
  }
}

// ==========================================
// 類別定義 (Classes)
// ==========================================

// --- 1. 氣球類別 ---
class Balloon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 30;
    this.vy = 0;
    this.gravity = 0.15;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= 5;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += 5;
    }

    if (keyIsDown(UP_ARROW)) {
      this.vy = -4;
    } else {
      this.vy += this.gravity;
    }

    this.y += this.vy;

    this.x = constrain(this.x, this.r, width - this.r);
    this.y = constrain(this.y, this.r + 60, height - 40 - this.r);
  }

  display() {
    push();
    noStroke();
    fill(255, 80, 80);
    ellipse(this.x, this.y, this.r * 2, this.r * 2.3);

    stroke(100);
    strokeWeight(2);
    line(this.x, this.y + this.r * 1.1, this.x, this.y + this.r * 1.8);
    pop();
  }
}

// --- 2. 空中雲朵類別 ---
class Cloud {
  constructor(x, y, word, note, isCorrect) {
    this.x = x;
    this.y = y;
    this.r = 35;
    this.vy = 1.8;
    this.word = word;
    this.note = note;
    this.isCorrect = isCorrect;
  }

  update() {
    this.y += this.vy;
  }

  display() {
    push();
    noStroke();
    fill(240, 245, 255, 230);
    
    let cx = this.x;
    let cy = this.y;
    ellipse(cx, cy, this.r * 2, this.r * 1.2);
    ellipse(cx - this.r * 0.6, cy + this.r * 0.2, this.r * 1.2, this.r * 1.0);
    ellipse(cx + this.r * 0.6, cy + this.r * 0.2, this.r * 1.2, this.r * 1.0);
    ellipse(cx, cy - this.r * 0.4, this.r * 1.4, this.r * 1.0);

    fill(30);
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(BOLD);
    text(this.word, cx, cy - 4);
    textSize(12);
    textStyle(NORMAL);
    fill(80);
    text(`(${this.note})`, cx, cy + 14);
    pop();
  }
}

// --- 3. 地面小老鼠類別（灰色橢圓身軀 + 兩耳 + 細尾巴） ---
class MouseItem {
  constructor(x, y, word, note, isCorrect, dir) {
    this.x = x;
    this.y = y;
    this.r = 25;
    this.vx = dir * 1.5;
    this.word = word;
    this.note = note;
    this.isCorrect = isCorrect;
  }

  update() {
    this.x += this.vx;
  }

  display() {
    push();
    noStroke();

    let mx = this.x;
    let my = this.y;
    let dirFactor = this.vx > 0 ? 1 : -1;

    // 繪製尾巴（細線）
    stroke(120);
    strokeWeight(2);
    noFill();
    beginShape();
    vertex(mx - dirFactor * 18, my);
    bezierVertex(mx - dirFactor * 30, my - 10, mx - dirFactor * 35, my + 10, mx - dirFactor * 40, my);
    endShape();

    // 繪製灰色橢圓身體
    noStroke();
    fill(170, 175, 185);
    ellipse(mx, my, this.r * 2.2, this.r * 1.3);

    // 繪製兩隻耳朵
    fill(170, 175, 185);
    ellipse(mx - 8, my - 14, 12, 12);
    ellipse(mx + 8, my - 14, 12, 12);
    fill(255, 180, 200);
    ellipse(mx - 8, my - 14, 6, 6);
    ellipse(mx + 8, my - 14, 6, 6);

    // 單字文字顯示
    fill(20);
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);
    text(this.word, mx, my - 3);
    textSize(10);
    textStyle(NORMAL);
    text(`(${this.note})`, mx, my + 10);
    pop();
  }
}