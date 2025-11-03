document.addEventListener('DOMContentLoaded', () => {
    console.log('script.js: DOMContentLoaded event fired.');
    const startMenuButton = document.getElementById('start-menu-button');
    const startMenu = document.getElementById('start-menu');
    const clockElement = document.getElementById('clock');
    const windowsContainer = document.getElementById('windows-container');
    const programTray = document.getElementById('program-tray'); // Get the program tray element

    // Ensure desktop is visible by default now that authentication is removed
    document.getElementById('desktop').style.display = 'flex';

    // Clock functionality
    function updateClock() {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        clockElement.textContent = now.toLocaleTimeString('en-US', options);
    }
    setInterval(updateClock, 1000);
    updateClock(); // Initial call

    // Start Menu functionality
    startMenuButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click from immediately closing
        startMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!startMenu.contains(event.target) && event.target !== startMenuButton) {
            startMenu.classList.add('hidden');
        }
    });

    // Window Management (Drag, Resize, Minimize, Maximize, Close)
    let zIndexCounter = 1;

    function createWindow(title, contentHtml, width = 600, height = 400) {
        const windowElement = document.createElement('div');
        windowElement.classList.add('window');
        windowElement.style.width = `${width}px`;
        windowElement.style.height = `${height}px`;
        windowElement.style.left = `${Math.random() * (window.innerWidth - width - 50) + 25}px`;
        windowElement.style.top = `${Math.random() * (window.innerHeight - height - 80) + 50}px`;
        windowElement.style.zIndex = ++zIndexCounter;

        windowElement.innerHTML = `
            <div class="window-header">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    <button class="minimize-button">_</button>
                    <button class="maximize-button">□</button>
                    <button class="close-button">X</button>
                </div>
            </div>
            <div class="window-content">${contentHtml}</div>
        `;

        windowsContainer.appendChild(windowElement);

        // Bring to front on click
        windowElement.addEventListener('mousedown', () => {
            windowElement.style.zIndex = ++zIndexCounter;
        });

        // Drag functionality
        const header = windowElement.querySelector('.window-header');
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection and other default behaviors
            isDragging = true;
            offsetX = e.clientX - windowElement.getBoundingClientRect().left;
            offsetY = e.clientY - windowElement.getBoundingClientRect().top;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent text selection during drag
            windowElement.style.left = `${e.clientX - offsetX}px`;
            windowElement.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });

        // Close button
        windowElement.querySelector('.close-button').addEventListener('click', () => {
            windowElement.remove();
            const trayItem = programTray.querySelector(`[data-window-id="${windowElement.id}"]`);
            if (trayItem) {
                trayItem.remove();
            }
        });

        // Maximize/Restore functionality
        let isMaximized = false;
        let originalPos = { top: 0, left: 0, width: 0, height: 0 };
        windowElement.querySelector('.maximize-button').addEventListener('click', () => {
            if (!isMaximized) {
                originalPos = {
                    top: windowElement.style.top,
                    left: windowElement.style.left,
                    width: windowElement.style.width,
                    height: windowElement.style.height
                };
                windowElement.style.top = '30px'; // Below top bar
                windowElement.style.left = '0';
                windowElement.style.width = '100vw';
                windowElement.style.height = 'calc(100vh - 30px)';
                windowElement.style.resize = 'none'; // Disable resize when maximized
                isMaximized = true;
            } else {
                windowElement.style.top = originalPos.top;
                windowElement.style.left = originalPos.left;
                windowElement.style.width = originalPos.width;
                windowElement.style.height = originalPos.height;
                windowElement.style.resize = 'both';
                isMaximized = false;
            }
        });


        // Minimize functionality (hide and add to program tray)
        windowElement.querySelector('.minimize-button').addEventListener('click', () => {
            windowElement.style.display = 'none';
            const trayItem = document.createElement('div');
            trayItem.classList.add('program-tray-item');
            trayItem.textContent = title;
            trayItem.dataset.windowId = windowElement.id; // Store a reference to the window
            trayItem.addEventListener('click', () => {
                windowElement.style.display = 'flex'; // Restore window
                windowElement.style.zIndex = ++zIndexCounter; // Bring to front
                trayItem.remove(); // Remove from tray
            });
            programTray.appendChild(trayItem);
        });

        // Close button (also remove from tray if it was minimized)
        windowElement.querySelector('.close-button').addEventListener('click', () => {
            windowElement.remove();
            const trayItem = programTray.querySelector(`[data-window-id="${windowElement.id}"]`);
            if (trayItem) {
                trayItem.remove();
            }
        });

        return windowElement;
    }

    // Example: Open a new window
    // createWindow('Welcome', '<h1>Hello Orea OS!</h1><p>This is your new desktop environment.</p>');

    // Placeholder for apps in start menu
    const apps = [
        {
            name: 'Terminal',
            action: () => {
                const terminalWindow = createWindow('Terminal', `
                    <div class="terminal-output" style="background-color: black; color: #0f0; height: calc(100% - 30px); overflow-y: auto; padding: 5px; font-family: monospace;"></div>
                    <input type="text" class="terminal-input" style="width: calc(100% - 10px); background-color: black; color: #0f0; border: none; padding: 5px; outline: none;">
                `, 700, 500);

                const outputElement = terminalWindow.querySelector('.terminal-output');
                const inputElement = terminalWindow.querySelector('.terminal-input');

                const appendOutput = (text) => {
                    outputElement.innerHTML += `<div>${text}</div>`;
                    outputElement.scrollTop = outputElement.scrollHeight;
                };

                appendOutput('Orea OS Terminal [Version 1.0.0]');
                appendOutput('(c) 2025 Orea OS. All rights reserved.');
                appendOutput('');
                appendOutput('Type "help" for a list of commands.');

                inputElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const command = inputElement.value.trim();
                        appendOutput(`> ${command}`);
                        inputElement.value = '';
                        executeCommand(command);
                    }
                });

                const executeCommand = (command) => {
                    const args = command.split(' ');
                    const cmd = args[0].toLowerCase();

                    switch (cmd) {
                        case 'help':
                            appendOutput('Available commands:');
                            appendOutput('  help - Display this help message');
                            appendOutput('  echo [text] - Display a line of text');
                            appendOutput('  clear - Clear the terminal screen');
                            appendOutput('  whoami - Display current user');
                            appendOutput('  date - Display the current date and time');
                            appendOutput('  ls - List directory contents (emulated)');
                            appendOutput('  ping [host] - Emulated ping command');
                            break;
                        case 'echo':
                            appendOutput(args.slice(1).join(' '));
                            break;
                        case 'clear':
                            outputElement.innerHTML = '';
                            break;
                        case 'whoami':
                            appendOutput('ethical_hacker'); // Placeholder
                            break;
                        case 'date':
                            appendOutput(new Date().toLocaleString());
                            break;
                        case 'ls':
                            appendOutput('  . ..');
                            appendOutput('  apps/');
                            appendOutput('  documents/');
                            appendOutput('  config.sys');
                            break;
                        case 'ping':
                            const host = args[1];
                            if (host) {
                                appendOutput(`Pinging ${host} with 32 bytes of data:`);
                                for (let i = 0; i < 4; i++) {
                                    setTimeout(() => {
                                        const delay = Math.floor(Math.random() * 100) + 10; // 10-109ms
                                        appendOutput(`Reply from ${host}: bytes=32 time=${delay}ms TTL=64`);
                                    }, i * 1000);
                                }
                                setTimeout(() => {
                                    appendOutput(`Ping statistics for ${host}:`);
                                    appendOutput(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
                                    appendOutput(`Approximate round trip times in milli-seconds:`);
                                    appendOutput(`    Minimum = 10ms, Maximum = 109ms, Average = 50ms`);
                                }, 4500);
                            } else {
                                appendOutput('Usage: ping [host]');
                            }
                            break;
                        default:
                            appendOutput(`Unknown command: ${command}`);
                            break;
                    }
                    appendOutput('');
                };
            }
        },
        {
            name: 'Browser',
            action: () => {
                const browserWindow = createWindow('Web Browser', `
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <div style="display: flex; padding: 5px; background-color: #eee; border-bottom: 1px solid #ccc;">
                            <input type="text" class="browser-url-input" value="about:blank" style="flex-grow: 1; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <button class="browser-go-button" style="margin-left: 5px; padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer;">Go</button>
                            <button class="browser-back-button" style="margin-left: 5px; padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer;"><</button>
                            <button class="browser-forward-button" style="margin-left: 5px; padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer;">></button>
                        </div>
                        <iframe class="browser-iframe" src="about:blank" style="flex-grow: 1; border: none;"></iframe>
                    </div>
                `, 800, 600);

                const urlInput = browserWindow.querySelector('.browser-url-input');
                const goButton = browserWindow.querySelector('.browser-go-button');
                const backButton = browserWindow.querySelector('.browser-back-button');
                const forwardButton = browserWindow.querySelector('.browser-forward-button');
                const browserIframe = browserWindow.querySelector('.browser-iframe');

                let history = [];
                let historyIndex = -1;

                const navigate = (url) => {
                    if (!url.startsWith('http://') && !url.startsWith('https://') && url !== 'about:blank') {
                        url = 'https://' + url; // Default to https
                    }
                    browserIframe.src = url;
                    urlInput.value = url;

                    // Update history
                    if (historyIndex < history.length - 1) {
                        history = history.slice(0, historyIndex + 1);
                    }
                    history.push(url);
                    historyIndex++;
                };

                goButton.addEventListener('click', () => navigate(urlInput.value));
                urlInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        navigate(urlInput.value);
                    }
                });

                backButton.addEventListener('click', () => {
                    if (historyIndex > 0) {
                        historyIndex--;
                        browserIframe.src = history[historyIndex];
                        urlInput.value = history[historyIndex];
                    }
                });

                forwardButton.addEventListener('click', () => {
                    if (historyIndex < history.length - 1) {
                        historyIndex++;
                        browserIframe.src = history[historyIndex];
                        urlInput.value = history[historyIndex];
                    }
                });

                // Initial navigation
                navigate('about:blank');
            }
        },
        {
            name: 'Notepad',
            action: () => {
                const notepadWindow = createWindow('Notepad', `
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <textarea class="notepad-textarea" style="flex-grow: 1; width: 100%; border: none; resize: none; padding: 10px; box-sizing: border-box;"></textarea>
                        <div style="padding: 5px; background-color: #eee; border-top: 1px solid #ccc; text-align: right;">
                            <button class="notepad-save-button" style="padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer;">Save</button>
                            <button class="notepad-load-button" style="padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer;">Load</button>
                            <select class="notepad-select-note" style="padding: 5px; border: 1px solid #ccc; border-radius: 3px; margin-left: 5px;"></select>
                        </div>
                    </div>
                `, 500, 400);

                const textarea = notepadWindow.querySelector('.notepad-textarea');
                const saveButton = notepadWindow.querySelector('.notepad-save-button');
                const loadButton = notepadWindow.querySelector('.notepad-load-button');
                const selectNote = notepadWindow.querySelector('.notepad-select-note');

                const loadNotesList = async () => {
                    selectNote.innerHTML = '<option value="">-- Select Note --</option>';
                    const notes = await window.db.getAllData(window.db.STORES.notepad);
                    notes.forEach(note => {
                        const option = document.createElement('option');
                        option.value = note.id;
                        option.textContent = note.title || `Note ${note.id}`;
                        selectNote.appendChild(option);
                    });
                };

                saveButton.addEventListener('click', async () => {
                    const content = textarea.value;
                    if (content.trim() === '') {
                        alert('Note cannot be empty.');
                        return;
                    }
                    const title = prompt('Enter note title:', `Note ${new Date().toLocaleString()}`);
                    if (title) {
                        await window.db.addData(window.db.STORES.notepad, { title, content });
                        alert('Note saved!');
                        loadNotesList();
                    }
                });

                loadButton.addEventListener('click', async () => {
                    const selectedId = selectNote.value;
                    if (selectedId) {
                        const note = await window.db.getData(window.db.STORES.notepad, parseInt(selectedId));
                        if (note) {
                            textarea.value = note.content;
                            alert(`Note "${note.title}" loaded.`);
                        }
                    } else {
                        alert('Please select a note to load.');
                    }
                });

                loadNotesList(); // Load notes when notepad opens
            }
        },
        { name: 'Insecam-like App', action: () => createWindow('Insecam Viewer', '<iframe src="https://www.insecam.org/" style="width:100%; height:100%; border:none;"></iframe>') },
        {
            name: 'Python Editor',
            action: () => {
                const pythonWindow = createWindow('Python Editor', `
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <textarea class="python-code-editor" style="flex-grow: 1; width: 100%; border: none; resize: none; padding: 10px; box-sizing: border-box; font-family: monospace;">print("Hello, Orea OS Python!")</textarea>
                        <div style="padding: 5px; background-color: #eee; border-top: 1px solid #ccc; display: flex; justify-content: space-between; align-items: center;">
                            <button class="python-run-button" style="padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer;">Run Python</button>
                            <select class="python-script-select" style="padding: 5px; border: 1px solid #ccc; border-radius: 3px; margin-left: 5px;"></select>
                            <button class="python-save-button" style="padding: 5px 10px; background-color: #333; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;">Save</button>
                        </div>
                        <pre class="python-output" style="height: 100px; background-color: black; color: #0f0; overflow-y: auto; padding: 5px; font-family: monospace; margin: 0;"></pre>
                    </div>
                `, 700, 500);

                const codeEditor = pythonWindow.querySelector('.python-code-editor');
                const runButton = pythonWindow.querySelector('.python-run-button');
                const outputElement = pythonWindow.querySelector('.python-output');
                const scriptSelect = pythonWindow.querySelector('.python-script-select');
                const saveButton = pythonWindow.querySelector('.python-save-button');

                const loadPythonScripts = async () => {
                    scriptSelect.innerHTML = '<option value="">-- New Script --</option>';
                    const scripts = await window.db.getAllData(window.db.STORES.pythonEditor);
                    scripts.forEach(script => {
                        const option = document.createElement('option');
                        option.value = script.id;
                        option.textContent = script.title || `Script ${script.id}`;
                        scriptSelect.appendChild(option);
                    });
                };

                saveButton.addEventListener('click', async () => {
                    const code = codeEditor.value;
                    if (code.trim() === '') {
                        alert('Script cannot be empty.');
                        return;
                    }
                    const title = prompt('Enter script title:', `Script ${new Date().toLocaleString()}`);
                    if (title) {
                        await window.db.addData(window.db.STORES.pythonEditor, { title, code });
                        alert('Script saved!');
                        loadPythonScripts();
                    }
                });

                scriptSelect.addEventListener('change', async () => {
                    const selectedId = scriptSelect.value;
                    if (selectedId) {
                        const script = await window.db.getData(window.db.STORES.pythonEditor, parseInt(selectedId));
                        if (script) {
                            codeEditor.value = script.code;
                        }
                    } else {
                        codeEditor.value = 'print("Hello, Orea OS Python!")'; // Default new script
                    }
                });

                runButton.addEventListener('click', () => {
                    outputElement.textContent = ''; // Clear previous output
                    try {
                        // Redirect console output to the pre element
                        const oldConsoleLog = console.log;
                        console.log = (...args) => {
                            outputElement.textContent += args.join(' ') + '\n';
                            oldConsoleLog(...args);
                        };

                        // Brython specific execution
                        // This requires the brython() function to be called on the body
                        // Brython specific execution
                        // A more robust solution for dynamic execution:
                        // 1. Create a new Brython interpreter instance if needed, or use the global one.
                        // 2. Redirect stdout/stderr to capture output.
                        // 3. Execute the script.

                        // For now, we'll use a simpler approach that leverages Brython's global state
                        // and redirects console.log.
                        // The `brython()` function re-initializes Brython and executes all `text/python` scripts.
                        // To avoid re-executing all scripts on the page, we need a more controlled approach.

                        // A better way to run dynamic Python code with Brython:
                        // Use __BRYTHON__.run_script(code, 'script_name', 'module_name')
                        // This requires Brython to be initialized once on page load.

                        // Ensure Brython is initialized once globally
                        if (typeof __BRYTHON__ === 'undefined') {
                            brython({ debug: 1, indexedDB: true });
                        }

                        // Execute the script using Brython's internal mechanism
                        // This will capture print statements if console.log is redirected
                        __BRYTHON__.run_script(codeEditor.value, '__main__', '__main__');

                        console.log = oldConsoleLog; // Restore console.log
                    } catch (e) {
                        outputElement.textContent += `Error: ${e}\n`;
                        console.error('Python execution error:', e);
                    }
                });

                loadPythonScripts(); // Load scripts when editor opens
            }
        }
    ];

    apps.forEach(app => {
        const appItem = document.createElement('div');
        appItem.classList.add('start-menu-item');
        appItem.textContent = app.name;
        appItem.addEventListener('click', () => {
            app.action();
            startMenu.classList.add('hidden'); // Close start menu after launching app
        });
        startMenu.appendChild(appItem);
    });
});
