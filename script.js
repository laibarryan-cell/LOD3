// 核心設定與狀態控制
const targetNumber = "0987654321";
let currentInputNumber = "";
let isPhoneCompleted = false; 
let currentActiveChat = null;
let bgmInitialized = false;

// 計分與進度追蹤
let completedChatsCount = 0;
let correctAnswersCount = 0;

// 1. 全新分句對話數據結構
const phoneDialogues = [
    { speaker: "孫女 👧", text: "「阿嬤，你剛剛怎麼摀著肚子？」" },
    { speaker: "阿嬤 👵", text: "「乖孫，我昨天吃了個春捲後就感覺不太舒服。」" },
    { speaker: "孫女 👧", text: "「怎麼會這樣？」" },
    { speaker: "阿嬤 👵", text: "「因為我吃不完，又忘了冰冰箱，晚上才看到，但我怕丟掉遭天譴啊！所以就吃了。」" },
    { speaker: "孫女 👧", text: "「阿嬤這樣不行啦！如果吃壞肚子就要花很多錢看醫生，還會讓我們擔心。」" },
    { speaker: "孫女 👧", text: "「如果食物吃不完，一定要冰冰箱。尤其是夏天，食物若置放3小時，可能就滋生一堆細菌了。」" },
    { speaker: "孫女 👧", text: "「清明節的時候有一堆人吃到很久沒冰的潤餅就住院欸!」" },
    { speaker: "阿嬤 👵", text: "「我昨天還有吃水果，我有特地切掉黑做的一地方才吃。」" },
    { speaker: "孫女 👧", text: "「發霉了嗎?發霉的話，黴菌可能已經深入水果內部，吃到可能也會肚子痛，切掉一部分是沒用的。」" },
    { speaker: "阿嬤 👵", text: "「真的哦?唉唷，我們社區的line群組都亂傳，我以為我都學到正確的知識欸!」" },
    { speaker: "孫女 👧", text: "「阿嬤，我來幫你看看!」" }
];
let currentDialogueIndex = 0;

// LINE 聊天室食安文本資料 (已修正：@All 藍字渲染)
const chatData = [
    {
        id: 1,
        sender: "社區群組",
        avatar: "./grandma_avatar.PNG", 
        type: "group",
        message: "📊 [投票活動] 發霉的地方切掉就可以吃嗎？",
        groupMessages: [
            { speaker: "王老先生", text: "「食品安全沒關係啦，麵包水果稍微發霉，只要用刀把發霉毛毛的地方切掉，剩下的地方乾淨照樣可以吃，省錢又健康喔！」" },
            { speaker: "陳老太太", text: "「不要騙人。」" },
            // 利用內嵌樣式將 @All 改為高亮寶藍色 (符合真實 LINE 的樣式)
            { speaker: "王老先生", text: "「你真的不懂民間疾苦!<span style='color: #0066ff; font-weight: bold;'>@All</span> 大家評評理。」" }
        ],
        voteTitle: "發霉的地方切掉就可以吃",
        opt1: "ok",
        opt2: "不可以",
        isRumor: true, 
        explain: "這是【謠言詐騙】！黴菌的菌絲呈樹狀生長，肉眼能看到的只是表面發霉，其實微小的菌絲已經深入整塊食物內部，並且會釋放有害毒素。切掉表面絕對不安全，必須整顆丟棄！",
        answered: false,
        userSelectedOpt: null, 
        userCorrect: false
    },
    {
        id: 2,
        sender: "LINE熱心鄰居張阿姨",
        avatar: "./sushi_spring_rolls.PNG",
        type: "chat",
        message: "「重要分享！沒吃完的潤餅跟配料放在室溫下沒關係，隔天直接吃也沒事，不用麻煩冰冰箱啦，古早人都是這樣吃的！」",
        isRumor: true,
        explain: "這是【謠言詐騙】！食物在室溫下極易滋生細菌。吃剩的潤餅或熟食必須盡快放進冰箱冷藏，而且隔天食用前一定要徹底加熱，才不會食物中毒喔！",
        answered: false,
        userCorrect: false
    },
    {
        id: 3,
        sender: "食藥署食安主播",
        avatar: "./granddaughter_adult.png",
        type: "news",
        message: "「食安小常識！冰箱裡的食物應遵守『先進先出』原則。先買的、快到期的食物要放在冰箱外側優先食用，才能確保食材新鮮！」",
        isRumor: false,
        explain: "這是【真實安全資訊】！冰箱不是萬能保鮮盒。遵守『先進先出』原則，可以避免食物在冰箱角落被遺忘而過期腐壞，是最好的食物保存好習慣！",
        answered: false,
        userCorrect: false
    }
];

// 🔊 背景音樂動態啟動器
function tryStartBGM() {
    if (!bgmInitialized) {
        const bgm = document.getElementById('bgm-player');
        if (bgm) {
            bgm.volume = 0.15; 
            bgm.play().then(() => {
                bgmInitialized = true;
            }).catch(e => console.log("等待互動啟動音樂"));
        }
    }
}

// 🔊 網頁內建通用按鍵音效
function playBeepSound() {
    tryStartBGM(); 
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(750, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.9, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        console.log("音效異常");
    }
}

// 🔊 模擬真實電話響鈴系統
let ringTimeout1 = null;
let ringTimeout2 = null;
let ringOsc1 = null;
let ringOsc2 = null;
let ringAudioCtx = null;

function playRealisticRingbackTone() {
    try {
        ringAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        function soundOneRing() {
            ringOsc1 = ringAudioCtx.createOscillator();
            ringOsc2 = ringAudioCtx.createOscillator();
            const ringGain = ringAudioCtx.createGain();

            ringOsc1.type = 'sine';
            ringOsc1.frequency.setValueAtTime(440, ringAudioCtx.currentTime);
            ringOsc2.type = 'sine';
            ringOsc2.frequency.setValueAtTime(480, ringAudioCtx.currentTime);

            ringGain.gain.setValueAtTime(0.2, ringAudioCtx.currentTime);

            ringOsc1.connect(ringGain);
            ringOsc2.connect(ringGain);
            ringGain.connect(ringAudioCtx.destination);

            ringOsc1.start();
            ringOsc2.start();

            setTimeout(() => {
                if(ringOsc1) { ringOsc1.stop(); ringOsc1 = null; }
                if(ringOsc2) { ringOsc2.stop(); ringOsc2 = null; }
            }, 1300);
        }

        soundOneRing();

        ringTimeout1 = setTimeout(() => {
            if (document.getElementById('calling-screen').classList.contains('active') && currentDialogueIndex === 0) {
                soundOneRing();
            }
        }, 2200);

    } catch (e) {
        console.log("音效異常");
    }
}

function stopAllRinging() {
    clearTimeout(ringTimeout1);
    clearTimeout(ringTimeout2);
    if (ringOsc1) { try { ringOsc1.stop(); } catch(e){} ringOsc1 = null; }
    if (ringOsc2) { try { ringOsc2.stop(); } catch(e){} ringOsc2 = null; }
    if (ringAudioCtx) { try { ringAudioCtx.close(); } catch(e){} ringAudioCtx = null; }
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function handleAppClick(type) {
    playBeepSound();
    if (type === 'phone') {
        if (isPhoneCompleted) return; 
        openPhone();
    } else if (type === 'line') {
        openLine();
    }
}

// --- 電話功能區 ---
function openPhone() {
    switchScreen('dial-screen');
}

function pressKey(num) {
    playBeepSound();
    if (currentInputNumber.length < 10) {
        currentInputNumber += num;
        updateDialDisplay();
    }
}

function deleteKey() {
    playBeepSound();
    currentInputNumber = currentInputNumber.slice(0, -1);
    updateDialDisplay();
}

function updateDialDisplay() {
    const display = document.getElementById('phone-number-display');
    const callBtn = document.getElementById('call-main-btn');
    display.innerText = currentInputNumber;

    if (currentInputNumber === targetNumber) {
        callBtn.classList.add('active-green');
    } else {
        callBtn.classList.remove('active-green');
    }
}

function makeCall() {
    playBeepSound();
    if (currentInputNumber === targetNumber) {
        switchScreen('calling-screen');
        
        document.getElementById('call-status-text').innerText = "撥號中...";
        document.getElementById('avatar-row-area').style.visibility = "hidden";
        document.getElementById('dialogue-box-wrapper').style.visibility = "hidden";
        document.getElementById('next-dialogue-action-btn').style.visibility = "hidden";
        currentDialogueIndex = 0;

        playRealisticRingbackTone();
        
        ringTimeout2 = setTimeout(() => {
            if (document.getElementById('calling-screen').classList.contains('active')) {
                connectCall();
            }
        }, 4000);
    }
}

function connectCall() {
    document.getElementById('call-status-text').innerText = "通話中 00:03";
    document.getElementById('avatar-row-area').style.visibility = "visible";
    document.getElementById('dialogue-box-wrapper').style.visibility = "visible";
    document.getElementById('next-dialogue-action-btn').style.visibility = "visible";
    renderDialogueLine();
}

function renderDialogueLine() {
    const activeData = phoneDialogues[currentDialogueIndex];
    document.getElementById('chat-text-content').innerText = activeData.text;
    document.getElementById('dialogue-speaker-name').innerText = activeData.speaker;

    const grandmaBox = document.getElementById('avatar-box-grandma');
    const granddaughterBox = document.getElementById('avatar-box-granddaughter');

    if (activeData.speaker.includes("阿嬤")) {
        grandmaBox.className = "char-avatar-box active-speaker";
        granddaughterBox.className = "char-avatar-box inactive-speaker";
    } else if (activeData.speaker.includes("孫女")) {
        granddaughterBox.className = "char-avatar-box active-speaker";
        grandmaBox.className = "char-avatar-box inactive-speaker";
    }

    const nextBtn = document.getElementById('next-dialogue-action-btn');
    if (currentDialogueIndex === phoneDialogues.length - 1) {
        nextBtn.innerText = "對話結束";
        nextBtn.style.opacity = "0.5";
    } else {
        nextBtn.innerText = "下一句 ❯";
        nextBtn.style.opacity = "1";
    }
}

function advanceDialogue() {
    playBeepSound();
    if (currentDialogueIndex < phoneDialogues.length - 1) {
        currentDialogueIndex++;
        renderDialogueLine();
    }
}

// 掛斷電話
function hangUp() {
    playBeepSound();
    stopAllRinging(); 
    switchScreen('home-screen');
    
    isPhoneCompleted = true;
    
    const phoneIcon = document.getElementById('phone-icon');
    const phoneBtn = document.getElementById('phone-app-btn');
    phoneIcon.classList.remove('glowing');
    phoneBtn.classList.add('disabled-click');
    
    const lineIcon = document.getElementById('line-icon');
    const lineBtn = document.getElementById('line-app-btn');
    lineIcon.classList.add('glowing');
    lineBtn.classList.remove('disabled-click');
    
    currentInputNumber = "";
    updateDialDisplay();
}

// --- LINE 功能區 ---
function openLine() {
    if (!isPhoneCompleted) return;
    renderChatList();
    switchScreen('line-home');
}

function renderChatList() {
    const container = document.getElementById('chat-list-container');
    container.innerHTML = ""; 

    chatData.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.onclick = () => {
            playBeepSound();
            openChatRoom(chat.id);
        };

        const statusTag = chat.answered ? " <span style='color:#06C755; font-size:14px; font-weight:bold;'>[已檢查]</span>" : "";

        item.innerHTML = `
            <img class="chat-avatar" src="${chat.avatar}" onerror="this.src='https://via.placeholder.com/60/e4e6eb/000000?text=群'" alt="avatar">
            <div class="chat-content">
                <div class="chat-sender">${chat.sender}${statusTag}</div>
                <div class="chat-preview">${chat.message}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function openChatRoom(id) {
    const chat = chatData.find(c => c.id === id);
    if (!chat) return;
    currentActiveChat = chat;

    document.getElementById('chat-room-title').innerText = chat.sender;
    
    const container = document.querySelector('#line-chat .chat-container');
    container.innerHTML = ""; 

    const filterZone = document.getElementById('line-filter-zone');

    if (chat.type === "group") {
        filterZone.style.display = "none"; 

        chat.groupMessages.forEach(m => {
            const row = document.createElement('div');
            row.className = "msg-row";
            const color = m.speaker.includes("王") ? "d1d8e0" : "ffb8b8";
            row.innerHTML = `
                <div style="width:60px; height:60px; border-radius:50%; background-color:#${color}; display:flex; justify-content:center; align-items:center; font-size:15px; font-weight:bold; color:#333; margin-right:15px; border:1px solid #ddd; flex-shrink:0;">
                    ${m.speaker[0]}鄰
                </div>
                <div style="display:flex; flex-direction:column; gap:5px; max-width:75%;">
                    <div style="font-size:15px; color:#ffffff; font-weight:bold; text-shadow:0 1px 2px rgba(0,0,0,0.6);">${m.speaker}</div>
                    <div class="msg-bubble">${m.text}</div>
                </div>
            `;
            container.appendChild(row);
        });

        // 注入群組專屬的「LINE投票活動小卡」
        const voteCard = document.createElement('div');
        voteCard.style.marginTop = "15px";
        voteCard.style.flexShrink = "0"; // 防止小卡在彈性盒中被擠壓變形
        const btnTagText = chat.answered ? "已投票 (看結果)" : "點擊參與投票 ❯";
        voteCard.innerHTML = `
            <div onclick="openGroupVoteScreen()" style="background-color:#ffffff; border-radius:15px; padding:16px; border:1px solid #e1e4e8; box-shadow:0 4px 12px rgba(0,0,0,0.15); width:100%; cursor:pointer;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <span style="background-color:#06C755; color:#ffffff; font-size:13px; padding:2px 8px; border-radius:4px; font-weight:bold;">投票</span>
                    <span style="font-size:14px; color:#777;">群組公開投票活動</span>
                </div>
                <div style="font-size:20px; font-weight:bold; color:#111; margin-bottom:6px;">單選：${chat.voteTitle}</div>
                <div style="font-size:15px; color:#888; display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <span>已有 22 人參與</span>
                    <span style="color:#06C755; font-weight:bold;">${btnTagText}</span>
                </div>
            </div>
        `;
        container.appendChild(voteCard);

    } else {
        filterZone.style.display = "flex";

        const row = document.createElement('div');
        row.className = "msg-row";
        row.innerHTML = `
            <img class="chat-avatar" src="${chat.avatar}" onerror="this.src='https://via.placeholder.com/60/e4e6eb/000000?text=LINE'" alt="avatar">
            <div class="msg-bubble">${chat.message}</div>
        `;
        container.appendChild(row);

        const explainBox = document.getElementById('explain-result');
        const btnReal = document.getElementById('btn-real');
        const btnRumor = document.getElementById('btn-rumor');

        if (chat.answered) {
            const feedbackText = chat.userCorrect ? "✅ 您當時答對了！\n\n" : "❌ 您當時答錯了！\n\n";
            explainBox.innerText = feedbackText + chat.explain;
            explainBox.className = "explain-box show " + (chat.isRumor ? "rumor-style" : "real-style");
            btnReal.disabled = true;
            btnRumor.disabled = true;
            btnReal.style.opacity = "0.4";
            btnRumor.style.opacity = "0.4";
        } else {
            explainBox.className = "explain-box";
            explainBox.innerText = "";
            btnReal.disabled = false;
            btnRumor.disabled = false;
            btnReal.style.opacity = "1";
            btnRumor.style.opacity = "1";
        }
    }

    switchScreen('line-chat');
}

// 📊 打開高仿真 LINE 投票結果頁面
function openGroupVoteScreen() {
    playBeepSound();
    const chat = chatData[0];
    
    document.getElementById('vote-main-title').innerText = chat.voteTitle;
    document.getElementById('vote-opt-text-1').innerText = chat.opt1;
    document.getElementById('vote-opt-text-2').innerText = chat.opt2;

    const circle1 = document.getElementById('vote-circle-1');
    const circle2 = document.getElementById('vote-circle-2');
    const explainBox = document.getElementById('vote-explain-result');

    let totalVoters = 22;
    let votes1 = 20;
    let votes2 = 2;

    if (chat.answered) {
        totalVoters = 23; 
        if (chat.userSelectedOpt === "opt1") {
            circle1.className = "vote-circle checked checked-gray"; 
            circle2.className = "vote-circle";
            votes1 = 21;
        } else {
            circle1.className = "vote-circle";
            circle2.className = "vote-circle checked"; 
            votes2 = 3;
        }

        const feedbackText = chat.userCorrect ? "✅ 恭喜阿嬤！您選了【不可以】，答對了！\n\n" : "❌ 哎呀阿嬤！您選了【ok】，這題答錯了！\n\n";
        explainBox.innerText = feedbackText + chat.explain;
        explainBox.className = "explain-box show rumor-style";
    } else {
        circle1.className = "vote-circle";
        circle2.className = "vote-circle";
        explainBox.className = "explain-box";
        explainBox.innerText = "";
    }

    document.getElementById('vote-total-voters-label').innerText = `已有${totalVoters}人投票`;
    document.getElementById('vote-count-text-1').innerText = votes1;
    document.getElementById('vote-count-text-2').innerText = votes2;

    document.getElementById('vote-bar-1').style.width = Math.round((votes1 / totalVoters) * 100) + "%";
    document.getElementById('vote-bar-2').style.width = Math.round((votes2 / totalVoters) * 100) + "%";

    switchScreen('line-vote-screen');
}

// 點擊投票選取
function submitGroupVote(isOpt1) {
    const chat = chatData[0];
    if (chat.answered) return; 

    chat.answered = true;
    completedChatsCount++;

    if (isOpt1) {
        chat.userSelectedOpt = "opt1";
        chat.userCorrect = false; 
    } else {
        chat.userSelectedOpt = "opt2";
        chat.userCorrect = true;  
        correctAnswersCount++;
    }

    openGroupVoteScreen();
}

function backToGroupChat() {
    playBeepSound();
    openChatRoom(1);
}

function verifyMessage(userSelectedRumor) {
    playBeepSound();
    if (!currentActiveChat || currentActiveChat.answered) return;

    currentActiveChat.answered = true;
    completedChatsCount++;

    const isCorrect = (userSelectedRumor === currentActiveChat.isRumor);
    currentActiveChat.userCorrect = isCorrect;

    if (isCorrect) correctAnswersCount++;

    const explainBox = document.getElementById('explain-result');
    const feedbackText = isCorrect ? "✅ 恭喜您答對了！\n\n" : "❌ 哎呀，答錯了！\n\n";
    explainBox.innerText = feedbackText + currentActiveChat.explain;
    explainBox.classList.add('show');

    if (currentActiveChat.isRumor) {
        explainBox.classList.add('rumor-style');
    } else {
        explainBox.classList.add('real-style');
    }

    document.getElementById('btn-real').disabled = true;
    document.getElementById('btn-rumor').disabled = true;
    document.getElementById('btn-real').style.opacity = "0.4";
    document.getElementById('btn-rumor').style.opacity = "0.4";
}

function backToLineHome() {
    playBeepSound();
    if (completedChatsCount === 3) {
        showFinalResultScreen();
    } else {
        renderChatList();
        switchScreen('line-home');
    }
}

function showFinalResultScreen() {
    switchScreen('line-result-screen');
    document.getElementById('final-score-num').innerText = correctAnswersCount;

    const titleEl = document.getElementById('final-rating-title');
    const emojiEl = document.getElementById('final-rating-emoji');

    if (correctAnswersCount === 3) {
        titleEl.innerText = "食在好厲害";
        titleEl.style.color = "#2ecc71";
        emojiEl.innerText = "🥳 🏆 🌟";
    } else if (correctAnswersCount >= 1 && correctAnswersCount <= 2) {
        titleEl.innerText = "食在好安心";
        titleEl.style.color = "#3498db";
        emojiEl.innerText = "👍 😊 🍎";
    } else {
        titleEl.innerText = "食在要加油";
        titleEl.style.color = "#e74c3c";
        emojiEl.innerText = "💪 🥺 ⚠️";
    }
}

function resetAllGame() {
    playBeepSound();
    isPhoneCompleted = false;
    currentInputNumber = "";
    currentDialogueIndex = 0;
    updateDialDisplay();

    completedChatsCount = 0;
    correctAnswersCount = 0;
    
    chatData.forEach(chat => {
        chat.answered = false;
        chat.userCorrect = false;
        if(chat.userSelectedOpt) chat.userSelectedOpt = null;
    });

    const phoneIcon = document.getElementById('phone-icon');
    const phoneBtn = document.getElementById('phone-app-btn');
    phoneIcon.classList.add('glowing');
    phoneBtn.classList.remove('disabled-click');

    const lineIcon = document.getElementById('line-icon');
    const lineBtn = document.getElementById('line-app-btn');
    lineIcon.classList.remove('glowing');
    lineBtn.classList.add('disabled-click');

    switchScreen('home-screen');
}
