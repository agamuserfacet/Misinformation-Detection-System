// Add a floating button to the page
const button = document.createElement('button');
button.textContent = 'Analyze Page';
button.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  padding: 10px 20px;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
`;

document.body.appendChild(button);

// Handle button click
button.addEventListener('click', () => {
  const pageText = document.body.innerText;
  const pageUrl = window.location.href;
  
  chrome.runtime.sendMessage({
    action: "analyzeContent",
    text: pageText,
    url: pageUrl
  });
});