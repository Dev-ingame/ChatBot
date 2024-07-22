document
    .getElementById("user-input")
    .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    document.getElementById("user-input").value = "";
    appendMessage("user-message", userInput);

    fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
    })
        .then((response) => response.json())
        .then((data) => {
            appendMessage("bot-message", data.response);
            showFeedbackForm(userInput, data.response);
        });
}

function appendMessage(className, message) {
    const chatbox = document.getElementById("chatbox");
    const messageElement = document.createElement("div");
    messageElement.className = className;
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the bottom
}

function showFeedbackForm(input, response) {
    const feedbackForm = document.getElementById("feedback-form");
    feedbackForm.style.display = "block"; // Show the feedback form
    feedbackForm.dataset.input = input;
    feedbackForm.dataset.response = response;
}

function submitFeedback() {
    const input = document.getElementById("feedback-form").dataset.input;
    const correctResponse = document.getElementById("correct-response").value;

    fetch("/api/feedback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, correctResponse }),
    })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
            document.getElementById("feedback-form").style.display = "none"; // Hide the feedback form
            document.getElementById("correct-response").value = ""; // Clear the input
        });
}

function Retrain() {
    fetch("/api/chat/retrain", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
            document.getElementById("feedback-form").style.display = "none"; // Hide the feedback form
            document.getElementById("correct-response").value = ""; // Clear the input
        });
}
