const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

function loadImage(e) {
    const file = e.target.files[0];

    if(!isFileImage(file)) {
        alertError('Please select an image');
        return;
    }

    // Get original dimensions
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = function () {
        widthInput.value = this.width;
        heightInput.value = this.height;
    }

    form.style.display = 'block';
    filename.innerText = file.name;
    outputPath.innerText = path.join(os.homedir(), 'image-resizer');
}

// Send image data to main 
function sendImage(e) {
    e.preventDefault();

    if (!img.files[0]) {
        alertError('Please upload an image');
        return;
    }

    const width = widthInput.value;
    const height = heightInput.value;
    const file = img.files[0];

    if (width === '' || height === '') {
        alertError('Please fill in a height and width');
        return;
    }

    // Read file as ArrayBuffer and send to main
    const reader = new FileReader();
    reader.onload = function() {
        const arrayBuffer = reader.result;
        ipcRenderer.send('image:resize', {
            buffer: arrayBuffer,
            filename: file.name,
            width,
            height,
        });
    };
    reader.readAsArrayBuffer(file);
}

// Catch the image:done event
ipcRenderer.on('image:done', () => {
    alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
})

// Make sure fiel is image
function isFileImage(file) {
    const accepetedImageTypes = ['image/gif', 'image/png', 'image/jpeg'];
    return file && accepetedImageTypes.includes(file['type']);
}

function alertError(message) {
    Toastify.toast({
        text: message,
        duration: 5000, // 5 seconds
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center'
        }
    })
}

function alertSuccess(message) {
    Toastify.toast({
        text: message,
        duration: 5000, // 5 seconds
        close: false,
        style: {
            background: 'green',
            color: 'white',
            textAlign: 'center'
        }
    })
}

img.addEventListener('change', loadImage);
form.addEventListener('submit', sendImage)