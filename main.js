const path = require("path"); // loads index.html
const os = require("os"); 
const fs = require("fs"); 
const resizeImg = require("resize-img");
const { app, BrowserWindow, Menu, ipcMain, shell} = require("electron");

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

// Create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "Image Resizer",
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    // Open devtools if in dev env
    if(isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// Create About window
function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: "About Image Resizer",
        width: 300,
        height: 300,
    });

    aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// App is ready
app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
    // Quit app when closed

    // Remove mainWindow from memory on close
    mainWindow.on('closed', () => (mainWindow = null));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    });
});

// Menu Template
const menu = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Exit',
                click: () => app.quit(),
                accelerator: 'Ctrl+W'
            }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    },
];

// Respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'image-resizer');
    resizeImage(options);
});

// Resize the image
async function resizeImage({ buffer, filename, width, height, dest }) {
    try {
        // Convert ArrayBuffer to Buffer
        const imgBuffer = Buffer.from(buffer);

        const newPath = await resizeImg(imgBuffer, {
            width: +width,
            height: +height
        });

        // Create dest folder if not exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // Write file to dest
        fs.writeFileSync(path.join(dest, filename), newPath);

        // Send success to render
        mainWindow.webContents.send('image:done');

        // Open dest folder
        shell.openPath(dest);

    } catch (error) {
        console.log(error);
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    };
});