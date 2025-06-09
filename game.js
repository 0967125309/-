// 初始化 Matter.js 引擎
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;

const engine = Engine.create();
const canvas = document.getElementById('gameCanvas');
const powerBar = document.querySelector('.power-bar');
const resetBtn = document.getElementById('resetBtn');

// 設置渲染器
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 800,
        height: 400,
        wireframes: false
    }
});

// 創建球桌邊界
const walls = [
    Bodies.rectangle(400, 0, 800, 20, { isStatic: true }), // 上邊界
    Bodies.rectangle(400, 400, 800, 20, { isStatic: true }), // 下邊界
    Bodies.rectangle(0, 200, 20, 400, { isStatic: true }), // 左邊界
    Bodies.rectangle(800, 200, 20, 400, { isStatic: true }) // 右邊界
];

// 創建球
const whiteBall = Bodies.circle(200, 200, 10, {
    render: { fillStyle: 'white' },
    restitution: 0.9,
    friction: 0.001
});

const balls = [
    Bodies.circle(600, 200, 10, {
        render: { fillStyle: 'red' },
        restitution: 0.9,
        friction: 0.001
    }),
    Bodies.circle(620, 190, 10, {
        render: { fillStyle: 'yellow' },
        restitution: 0.9,
        friction: 0.001
    }),
    Bodies.circle(620, 210, 10, {
        render: { fillStyle: 'blue' },
        restitution: 0.9,
        friction: 0.001
    })
];

// 添加所有物體到世界
World.add(engine.world, [...walls, whiteBall, ...balls]);

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
    // 重置白球位置
    Body.setPosition(whiteBall, { x: 200, y: 200 });
    Body.setVelocity(whiteBall, { x: 0, y: 0 });
    
    // 重置其他球的位置
    balls.forEach((ball, index) => {
        const offset = index * 20;
        Body.setPosition(ball, { x: 600, y: 200 - 10 + offset });
        Body.setVelocity(ball, { x: 0, y: 0 });
    });
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