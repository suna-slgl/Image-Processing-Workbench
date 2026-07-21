# Image Processing Workbench

Image Processing Workbench is a Flask-based web application for applying common computer vision operations to uploaded images through a browser interface. It combines a lightweight Python API with a plain HTML, CSS, and JavaScript frontend, making the project easy to run locally and straightforward to extend.

The application is intended for learning, experimentation, and quick visual testing of image-processing techniques such as thresholding, edge detection, sharpening, blurring, gamma correction, corner detection, and webcam-based face detection.

## Features

- Upload images from the browser by selecting a file or using drag and drop.
- Preview original and processed images in the same workspace.
- Apply blur, sharpening, and gamma correction.
- Run adaptive and Otsu thresholding.
- Detect edges with Canny, Sobel, and Laplacian filters.
- Detect corners with Harris and Shi-Tomasi algorithms.
- Use webcam streaming for Haar cascade face detection.
- Undo and redo image-processing steps.
- Reset the current image back to the original upload.
- Download the processed image as a PNG file.
- Validate uploaded image data and enforce an 8 MB request limit.

## Tech Stack

- Python
- Flask
- Flask-CORS
- OpenCV
- NumPy
- Pillow
- HTML
- CSS
- JavaScript

Pinned Python package versions are listed in `requirements.txt`.

## Project Structure

```text
.
|-- app.py
|-- index.html
|-- script.js
|-- style.css
|-- requirements.txt
|-- README.md
`-- README_tr.md
```

## Getting Started

### Prerequisites

- Python installed locally.
- A browser with JavaScript enabled.
- A webcam, only if you want to use the face-detection stream.

The dependency file currently documents the Python version used by the project environment and pins the required packages.

### Installation

Clone the repository:

```bash
git clone https://github.com/suna-slgl/image-processing-website-with-python-flask-javascript.git
cd image-processing-website-with-python-flask-javascript
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the application:

```bash
python app.py
```

Open the application in your browser:

```text
http://localhost:5000
```

## Usage

1. Upload an image using the upload panel.
2. Choose one of the available processing operations.
3. Compare the original and processed versions from the preview controls.
4. Use undo, redo, or reset as needed.
5. Download the final processed image.

For face detection, use the camera action in the tool panel. The browser and operating system may ask for camera permission before the video stream becomes available.

## API Overview

Most image-processing endpoints accept a JSON payload containing a Base64-encoded image:

```json
{
  "image": "data:image/png;base64,..."
}
```

Successful responses return a message and a Base64-encoded PNG:

```json
{
  "message": "Operation completed",
  "image": "..."
}
```

Available endpoints:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Serves the web interface. |
| `POST` | `/blur` | Applies Gaussian blur. |
| `POST` | `/sharpness` | Applies a sharpening kernel. |
| `POST` | `/gamma-filter` | Applies gamma correction. Accepts an optional `gamma` value. |
| `POST` | `/adaptive-thresholding` | Applies adaptive thresholding. |
| `POST` | `/otsu-thresholding` | Applies Otsu thresholding. |
| `POST` | `/canny` | Runs Canny edge detection. |
| `POST` | `/sobel` | Runs Sobel edge detection. |
| `POST` | `/laplacian` | Runs Laplacian edge detection. |
| `POST` | `/harris-corner` | Runs Harris corner detection. |
| `POST` | `/shi-tomasi-corner` | Runs Shi-Tomasi corner detection. |
| `GET` | `/video-feed` | Streams webcam frames with face-detection overlays. |

## Validation and Limits

- Requests must use JSON for image-processing endpoints.
- The `image` field must contain valid Base64 image data.
- Uploads are limited to 8 MB.
- Unsupported or invalid image data returns a client error response.
- Processing failures return a JSON error message.

## Development Notes

The frontend is intentionally framework-free. Static assets are served directly by Flask from the project root, and image operations are implemented in `app.py` with OpenCV, NumPy, and Pillow.

When adding a new operation, follow the existing pattern:

1. Add a Flask route in `app.py`.
2. Reuse `process_image` for validation, transformation, encoding, and error handling.
3. Add a matching JavaScript function in `script.js`.
4. Add the corresponding control to `index.html`.

## License

No license file is currently included in this repository. Add one before distributing or reusing the project in environments where license terms must be explicit.
