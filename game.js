// 初始化 Matter.js 引擎
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;

// 遊戲常數
const POCKET_RADIUS = 20;
const BALL_RADIUS = 10;
const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const WALL_THICKNESS = 20;

const engine = Engine.create();
const canvas = document.getElementById('gameCanvas');
const powerBar = document.querySelector('.power-bar');
const resetBtn = document.getElementById('resetBtn');

// 設置渲染器
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: TABLE_WIDTH,
        height: TABLE_HEIGHT,
        wireframes: false
    }
});

// 創建球袋
const pockets = [
    // 左上角
    Bodies.circle(WALL_THICKNESS, WALL_THICKNESS, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'black' },
        label: 'pocket'
    }),
    // 右上角
    Bodies.circle(TABLE_WIDTH - WALL_THICKNESS, WALL_THICKNESS, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'black' },
        label: 'pocket'
    }),
    // 左中
    Bodies.circle(WALL_THICKNESS, TABLE_HEIGHT/2, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'black' },
        label: 'pocket'
    }),
    // 右中
    Bodies.circle(TABLE_WIDTH - WALL_THICKNESS, TABLE_HEIGHT/2, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'black' },
        label: 'pocket'
    }),
    // 左下角
    Bodies.circle(WALL_THICKNESS, TABLE_HEIGHT - WALL_THICKNESS, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'black' },
        label: 'pocket'
    }),
    // 右下角
    Bodies.circle(TABLE_WIDTH - WALL_THICKNESS, TABLE_HEIGHT - WALL_THICKNESS, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'black' },
        label: 'pocket'
    })
];

// 創建球桌邊界
const walls = [
    Bodies.rectangle(TABLE_WIDTH/2, 0, TABLE_WIDTH, WALL_THICKNESS, { 
        isStatic: true,
        render: { fillStyle: '#8B4513' }  // 深棕色邊框
    }), // 上邊界
    Bodies.rectangle(TABLE_WIDTH/2, TABLE_HEIGHT, TABLE_WIDTH, WALL_THICKNESS, { 
        isStatic: true,
        render: { fillStyle: '#8B4513' }
    }), // 下邊界
    Bodies.rectangle(0, TABLE_HEIGHT/2, WALL_THICKNESS, TABLE_HEIGHT, { 
        isStatic: true,
        render: { fillStyle: '#8B4513' }
    }), // 左邊界
    Bodies.rectangle(TABLE_WIDTH, TABLE_HEIGHT/2, WALL_THICKNESS, TABLE_HEIGHT, { 
        isStatic: true,
        render: { fillStyle: '#8B4513' }
    }) // 右邊界
];

// 創建球
const whiteBall = Bodies.circle(200, 200, BALL_RADIUS, {
    render: { 
        fillStyle: 'white',
        strokeStyle: '#ddd',
        lineWidth: 1
    },
    restitution: 0.9,
    friction: 0.001,
    density: 0.002,
    label: 'ball'
});

const ballColors = ['#ff0000', '#ffff00', '#0000ff'];
const balls = ballColors.map((color, index) => {
    const xOffset = index * (BALL_RADIUS * 2 + 2);
    return Bodies.circle(600 + xOffset, 200, BALL_RADIUS, {
        render: { 
            fillStyle: color,
            strokeStyle: '#666',
            lineWidth: 1
        },
        restitution: 0.9,
        friction: 0.001,
        density: 0.002,
        label: 'ball'
    });
});

// 添加所有物體到世界
World.add(engine.world, [...walls, ...pockets, whiteBall, ...balls]);

// 遊戲狀態
let score = 0;
const BALL_SCORES = {
    '#ff0000': 3,  // 紅球
    '#ffff00': 2,  // 黃球
    '#0000ff': 1   // 藍球
};

// 設置碰撞檢測
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // 檢查是否有球進袋
        if (bodyA.label === 'pocket' || bodyB.label === 'pocket') {
            const ball = bodyA.label === 'pocket' ? bodyB : bodyA;
            if (ball !== whiteBall) {
                // 如果不是白球，計算得分並移除該球
                if (ball.render && ball.render.fillStyle) {
                    const ballScore = BALL_SCORES[ball.render.fillStyle] || 0;
                    score += ballScore;
                    document.getElementById('score').textContent = score;
                }
                World.remove(engine.world, ball);
                const index = balls.indexOf(ball);
                if (index > -1) {
                    balls.splice(index, 1);
                }
                // 更新剩餘球數
                document.getElementById('ballsCount').textContent = balls.length;
            } else {
                // 如果是白球進袋，重置白球位置
                Body.setPosition(whiteBall, { x: 200, y: 200 });
                Body.setVelocity(whiteBall, { x: 0, y: 0 });
                // 犯規扣分
                score = Math.max(0, score - 1);
                document.getElementById('score').textContent = score;
            }
        }
    });
});

// 啟動引擎和渲染器
Engine.run(engine);
Render.run(render);

// 游戲狀態變量
let isAiming = false;
let power = 0;
let maxPower = 100;
let powerIncrement = 2;
let isIncreasing = true;

// 滑鼠事件處理
canvas.addEventListener('mousedown', startAiming);
canvas.addEventListener('mousemove', updateAiming);
canvas.addEventListener('mouseup', shoot);

function startAiming(e) {
    if (Math.abs(whiteBall.velocity.x) < 0.1 && Math.abs(whiteBall.velocity.y) < 0.1) {
        isAiming = true;
        updatePowerMeter();
    }
}

function updateAiming(e) {
    if (!isAiming) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 計算角度
    const angle = Math.atan2(mouseY - whiteBall.position.y, mouseX - whiteBall.position.x);
    render.context.beginPath();
    render.context.moveTo(whiteBall.position.x, whiteBall.position.y);
    render.context.lineTo(
        whiteBall.position.x + Math.cos(angle) * 50,
        whiteBall.position.y + Math.sin(angle) * 50
    );
    render.context.strokeStyle = 'white';
    render.context.stroke();
}

function shoot(e) {
    if (!isAiming) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const angle = Math.atan2(mouseY - whiteBall.position.y, mouseX - whiteBall.position.x);
    const force = power * 0.05;
    
    Body.setVelocity(whiteBall, {
        x: Math.cos(angle) * force,
        y: Math.sin(angle) * force
    });
    
    isAiming = false;
    power = 0;
    powerBar.style.width = '0%';
}

function updatePowerMeter() {
    if (!isAiming) return;
    
    if (isIncreasing) {
        power += powerIncrement;
        if (power >= maxPower) {
            isIncreasing = false;
        }
    } else {
        power -= powerIncrement;
        if (power <= 0) {
            isIncreasing = true;
        }
    }
    
    powerBar.style.width = `${power}%`;
    
    if (isAiming) {
        requestAnimationFrame(updatePowerMeter);
    }
}

// 重置遊戲
resetBtn.addEventListener('click', () => {
    // 重置分數
    score = 0;
    document.getElementById('score').textContent = '0';
    
    // 重置白球位置
    Body.setPosition(whiteBall, { x: 200, y: 200 });
    Body.setVelocity(whiteBall, { x: 0, y: 0 });
    
    // 移除所有現有的球
    balls.forEach(ball => {
        World.remove(engine.world, ball);
    });
    balls.length = 0;
    
    // 重新創建所有球
    ballColors.forEach((color, index) => {
        const xOffset = index * (BALL_RADIUS * 2 + 2);
        const ball = Bodies.circle(600 + xOffset, 200, BALL_RADIUS, {
            render: { 
                fillStyle: color,
                strokeStyle: '#666',
                lineWidth: 1
            },
            restitution: 0.9,
            friction: 0.001,
            density: 0.002,
            label: 'ball'
        });
        balls.push(ball);
        World.add(engine.world, ball);
    });
    
    // 更新剩餘球數
    document.getElementById('ballsCount').textContent = balls.length;
});

// 防止球滾動太久
Events.on(engine, 'afterUpdate', () => {
    const bodies = [whiteBall, ...balls];
    bodies.forEach(ball => {
        if (Math.abs(ball.velocity.x) < 0.1 && Math.abs(ball.velocity.y) < 0.1) {
            Body.setVelocity(ball, { x: 0, y: 0 });
        }
    });
});