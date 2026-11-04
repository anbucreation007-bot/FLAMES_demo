"use strict";

// Get HTML elements
const form = document.getElementById("flamesForm");

const name1Input = document.getElementById("name1");
const name2Input = document.getElementById("name2");

const formError = document.getElementById("formError");

const resultSection = document.getElementById("result");
const resultName = document.getElementById("resultName");
const resultEmoji = document.getElementById("resultEmoji");
const resultNames = document.getElementById("resultNames");
const resultDescription = document.getElementById("resultDescription");

const resultPanel = document.getElementById("resultPanel");

const shareBtn = document.getElementById("shareBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");

const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const soundLabel = document.getElementById("soundLabel");

const toast = document.getElementById("toast");

// Current year
document.getElementById("year").textContent =
    new Date().getFullYear();

// FLAMES result meanings
const results = {
    F: {
        name: "Friends",
        emoji: "🤝",
        description:
            "A friendly and caring connection — the perfect excuse to celebrate your bond."
    },

    L: {
        name: "Love",
        emoji: "❤️",
        description:
            "A romantic-themed result from the classic FLAMES game. Keep being kind to each other."
    },

    A: {
        name: "Affection",
        emoji: "🫶",
        description:
            "Warmth, care and affection — a lovely result in this playful name game."
    },

    M: {
        name: "Marriage",
        emoji: "💍",
        description:
            "The game landed on Marriage! Remember, this is a playful result, not a real-life prediction."
    },

    E: {
        name: "Enemy",
        emoji: "😅",
        description:
            "A dramatic FLAMES result! Don't take it seriously — a game can't measure a real connection."
    },

    S: {
        name: "Siblings",
        emoji: "👫",
        description:
            "A sibling-like connection according to the game. Real relationships are more than a letter."
    }
};

// Sound settings
let soundEnabled = false;
let audioContext = null;

let latestShareText = "";

// Normalize names
function normalizeName(value) {
    return value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
}

// FLAMES calculation
function calculateFlamesResult(firstName, secondName) {

    const first = normalizeName(firstName);
    const second = normalizeName(secondName);

    // Custom result for Anbu and Ranjini
    if (
        (first === "anbu" && second === "ranjini") ||
        (first === "ranjini" && second === "anbu")
    ) {
        return {
            code: "M",
            unmatchedCount: 0,
            custom: true
        };
    }

    const firstLetters = first.split("");
    const secondLetters = second.split("");

    // Remove matching letters
    for (let i = firstLetters.length - 1; i >= 0; i--) {

        const matchIndex = secondLetters.indexOf(firstLetters[i]);

        if (matchIndex !== -1) {
            firstLetters.splice(i, 1);
            secondLetters.splice(matchIndex, 1);
        }
    }

    const unmatchedCount =
        firstLetters.length + secondLetters.length;

    const count = Math.max(unmatchedCount, 1);

    const flames = ["F", "L", "A", "M", "E", "S"];

    let index = 0;

    // Elimination process
    while (flames.length > 1) {

        index = (index + count - 1) % flames.length;

        flames.splice(index, 1);
    }

    return {
        code: flames[0],
        unmatchedCount
    };
}

// Sound effect
function playTone(
    frequency = 660,
    duration = 0.12,
    type = "sine"
) {

    if (!soundEnabled) return;

    try {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        audioContext = audioContext || new AudioContextClass();

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            frequency,
            audioContext.currentTime
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.075,
            audioContext.currentTime + 0.015
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + duration + 0.02
        );

    } catch (error) {
        console.log("Audio unavailable");
    }
}

// Toast message
function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timeoutId);

    showToast.timeoutId = setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

// Confetti animation
function launchConfetti() {

    const colors = [
        "#ff69b4",
        "#ff1493",
        "#ffb6c1",
        "#ffd700",
        "#ffffff"
    ];

    for (let i = 0; i < 42; i++) {

        const piece = document.createElement("span");

        piece.className = "confetti";

        piece.setAttribute("aria-hidden", "true");

        piece.style.left = `${Math.random() * 100}%`;

        piece.style.background =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.animationDelay =
            `${Math.random() * 0.65}s`;

        piece.style.setProperty(
            "--drift",
            `${Math.round(Math.random() * 220 - 110)}px`
        );

        resultPanel.appendChild(piece);

        setTimeout(() => piece.remove(), 3400);
    }
}

// Form submission
form.addEventListener("submit", function (event) {

    event.preventDefault();

    const rawName1 = name1Input.value.trim();
    const rawName2 = name2Input.value.trim();

    const normalized1 = normalizeName(rawName1);
    const normalized2 = normalizeName(rawName2);

    // Empty input validation
    if (!rawName1 || !rawName2) {

        formError.textContent =
            "Please enter both names to reveal your result.";

        (!rawName1 ? name1Input : name2Input).focus();

        playTone(220, 0.16, "triangle");

        return;
    }

    // Invalid names
    if (!normalized1 || !normalized2) {

        formError.textContent =
            "Please use names containing English letters (A–Z).";

        (!normalized1 ? name1Input : name2Input).focus();

        return;
    }

    // Same names validation
    if (normalized1 === normalized2) {

        formError.textContent =
            "You entered the same name twice. Try two different names.";

        name2Input.focus();

        return;
    }

    formError.textContent = "";

    // Calculate result
    const outcome = calculateFlamesResult(
        rawName1,
        rawName2
    );

    const result = results[outcome.code];

    // Display result
    resultEmoji.textContent = result.emoji;

    resultNames.textContent =
        `${rawName1} + ${rawName2}`;

    resultName.textContent = result.name;

    resultDescription.textContent = result.description;

    // Share text
    latestShareText =
        `🔥 AR Flames Result 🔥
${rawName1} + ${rawName2} = ${result.name}
Try the FLAMES name game! (Just for fun)`;

    // Show result section
    resultSection.classList.add("show");

    // Animations and sounds
    launchConfetti();

    playTone(523.25, 0.13);

    setTimeout(() => playTone(659.25, 0.13), 120);

    setTimeout(() => playTone(783.99, 0.2), 240);

    // Scroll to result
    resultSection.scrollIntoView({
        behavior: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches ? "auto" : "smooth",

        block: "start"
    });
});

// Sound toggle
soundToggle.addEventListener("click", function () {

    soundEnabled = !soundEnabled;

    soundToggle.setAttribute(
        "aria-pressed",
        String(soundEnabled)
    );

    soundIcon.textContent =
        soundEnabled ? "🔊" : "🔇";

    soundLabel.textContent =
        soundEnabled ? "Sound on" : "Sound off";

    if (soundEnabled) {
        playTone(660, 0.12);
    }
});

// Share result
shareBtn.addEventListener("click", async function () {

    if (!latestShareText) return;

    try {

        if (navigator.share) {

            await navigator.share({
                title: "AR Flames Result",
                text: latestShareText
            });

        } else if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                latestShareText
            );

            showToast("Result copied — ready to share!");

        } else {

            const textArea =
                document.createElement("textarea");

            textArea.value = latestShareText;

            textArea.setAttribute("readonly", "");

            textArea.style.position = "fixed";
            textArea.style.opacity = "0";

            document.body.appendChild(textArea);

            textArea.select();

            const copied =
                document.execCommand("copy");

            textArea.remove();

            if (copied) {
                showToast("Result copied — ready to share!");
            } else {
                window.prompt(
                    "Copy your result:",
                    latestShareText
                );
            }
        }

    } catch (error) {

        if (error.name !== "AbortError") {
            showToast("Unable to share right now. Please try again.");
        }
    }
});

// Try Again button
tryAgainBtn.addEventListener("click", function () {

    resultSection.classList.remove("show");

    formError.textContent = "";

    name1Input.value = "";
    name2Input.value = "";

    latestShareText = "";

    name1Input.focus();

    document.getElementById("home").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// Clear error while typing
[name1Input, name2Input].forEach(function (input) {

    input.addEventListener("input", function () {

        if (formError.textContent) {
            formError.textContent = "";
        }
    });

    // Enter key moves to second input
    input.addEventListener("keydown", function (event) {

        if (
            event.key === "Enter" &&
            input === name1Input
        ) {
            event.preventDefault();

            name2Input.focus();
        }
    });
});