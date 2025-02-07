// Chatbot functionality

document.addEventListener("DOMContentLoaded", () => {
    const openBtn = document.getElementById("open-chatbot");
    const modal = document.getElementById("chatbot-modal");
    const closeBtn = document.querySelector(".chatbot-close");
    const sendBtn = document.getElementById("chatbot-send");
    const inputField = document.getElementById("chatbot-input");
    const messagesContainer = document.querySelector(".chatbot-messages");
  
    // Open the chatbot modal
    openBtn.addEventListener("click", () => {
      modal.style.display = "block";
    });
  
    // Close the chatbot modal
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  
    // Option to close modal when clicking outside the content area
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  
    // Handle sending a message
    sendBtn.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  
    function sendMessage() {
      const userText = inputField.value.trim();
      if (!userText) return;
      appendMessage("You", userText);
      inputField.value = "";
      // Simulate bot response after a short delay
      setTimeout(() => {
        appendMessage("Bot", "Under Development");
      }, 800);
    }
  
    function appendMessage(sender, text) {
      const message = document.createElement("div");
      message.classList.add("chat-message");
      message.innerHTML = `<strong>${sender}:</strong> ${text}`;
      messagesContainer.appendChild(message);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });