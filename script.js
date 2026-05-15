function generateSignal(length = 256, freq = 5) {
    return Array.from(
        { length },
        (_, i) => Math.sin(2 * Math.PI * freq * i / length)
    );
}

function createLineChart(id, label, data, color = 'cyan') {
    return new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                label,
                data,
                borderColor: color,
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false
        }
    });
}

const firInput = generateSignal();

const firFiltered = firInput.map((_, i, arr) => {
    let sum = 0;
    let count = 0;

    for (let j = 0; j < 10; j++) {
        if (arr[i - j] !== undefined) {
            sum += arr[i - j];
            count++;
        }
    }

    return sum / count;
});

createLineChart(
    'firChart',
    'FIR Output',
    firFiltered
);

const iirInput = generateSignal();

let prev = 0;

const iirOutput = iirInput.map(v => {
    const alpha = 0.2;

    prev = alpha * v + (1 - alpha) * prev;

    return prev;
});

createLineChart(
    'iirChart',
    'IIR Output',
    iirOutput,
    '#00ffb3'
);

const oscSignal = [];

for (let i = 0; i < 512; i++) {
    oscSignal.push(
        Math.sin(i * 0.05) + 0.4 * Math.cos(i * 0.12)
    );
}

createLineChart(
    'oscCanvas',
    'Oscilloscope',
    oscSignal,
    '#ffc857'
);

const adcData = [];

for (let i = 0; i < 100; i++) {
    adcData.push(
        Math.round(Math.sin(i * 0.1) * 100)
    );
}

createLineChart(
    'adcChart',
    'ADC Samples',
    adcData,
    '#ff5f7a'
);

const dacData = [];

for (let i = 0; i < 80; i++) {
    dacData.push(
        Math.round(Math.sin(i * 0.2) * 8) / 8
    );
}

createLineChart(
    'dacChart',
    'DAC Staircase',
    dacData,
    '#6c63ff'
);

const berData = [];

for (let snr = 0; snr <= 30; snr++) {
    berData.push(Math.exp(-snr / 5));
}

createLineChart(
    'berChart',
    'BER',
    berData,
    '#00d2ff'
);

let modulation = 'ASK';

const modChart = createLineChart(
    'modChart',
    'ASK',
    generateSignal(256, 5),
    '#00ffb3'
);

function setModulation(type) {
    modulation = type;

    document.getElementById('modType').innerText = type;

    const data = [];

    for (let i = 0; i < 256; i++) {

        if (type === 'ASK') {
            data.push(
                Math.sin(i * 0.1) * (i % 40 < 20 ? 1 : 0.2)
            );
        }

        if (type === 'FSK') {
            data.push(
                Math.sin(i * (i % 40 < 20 ? 0.1 : 0.2))
            );
        }

        if (type === 'PSK') {
            data.push(
                Math.sin(i * 0.1 + (i % 40 < 20 ? 0 : Math.PI))
            );
        }
    }

    modChart.data.datasets[0].data = data;

    modChart.update();
}

async function startMic() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const audioCtx = new AudioContext();

        document.getElementById('sampleRate').innerText =
            audioCtx.sampleRate + ' Hz';

        const analyser = audioCtx.createAnalyser();

        analyser.fftSize = 2048;

        const source =
            audioCtx.createMediaStreamSource(stream);

        source.connect(analyser);

        const canvas =
            document.getElementById('fftCanvas');

        const ctx = canvas.getContext('2d');

        const bufferLength =
            analyser.frequencyBinCount;

        const dataArray =
            new Uint8Array(bufferLength);

        function draw() {

            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#07111e';

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            let barWidth =
                canvas.width / bufferLength * 2.5;

            let x = 0;

            for (let i = 0; i < bufferLength; i++) {

                let barHeight = dataArray[i] / 1.5;

                ctx.fillStyle =
                    `rgb(${barHeight + 50},255,255)`;

                ctx.fillRect(
                    x,
                    canvas.height - barHeight,
                    barWidth,
                    barHeight
                );

                x += barWidth + 1;
            }
        }

        draw();

    } catch (err) {

        alert(
            'Không thể truy cập microphone: ' + err
        );
    }
}
