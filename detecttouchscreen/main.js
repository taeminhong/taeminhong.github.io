const root = document.getElementById('root');
const para = document.createElement('p');

// Detection routine came from: https://stackoverflow.com/a/4819886
const messages = [];
('ontouchstart' in window) && messages.push('window has ontouchstart method');
(navigator.maxTouchPoints > 0) && messages.push(`navigator.maxTouchPoints is ${navigator.maxTouchPoints}`);
(navigator.msMaxTouchPoints > 0) && messages.push(`navigator.msMaxTouchPoints is ${navigator.msMaxTouchPoints}`);

const text = document.createTextNode((messages.length > 0 ? "Touch" : "No touch") + " screen detected");
para.append(text);
root.append(para);

if (messages.length > 0) {
    const ul = document.createElement('ul');
    for (const message of messages) {
        const li = document.createElement('li');
        const text = document.createTextNode(message);
        li.append(text);
        ul.append(li);
    }
    root.append(ul);
}
