import os
import base64
from binascii import Error as Base64Error
from io import BytesIO

import cv2
import numpy as np
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
CORS(app)


@app.route("/")
def index():
    return send_from_directory(app.root_path, "index.html")


@app.route("/style.css")
def stylesheet():
    return send_from_directory(app.root_path, "style.css")


@app.route("/script.js")
def script():
    script_path = os.path.join(app.root_path, "script.js")
    if not os.path.exists(script_path):
        return Response("", mimetype="application/javascript")

    return send_from_directory(app.root_path, "script.js")


@app.route("/favicon.ico")
def favicon():
    return Response(status=204)


class ImageValidationError(ValueError):
    pass


@app.errorhandler(413)
def request_entity_too_large(_error):
    return jsonify({"message": "Yüklenen resim çok büyük. En fazla 8 MB yükleyebilirsiniz."}), 413


def get_image_from_request():
    if not request.is_json:
        raise ImageValidationError("İstek JSON formatında olmalıdır.")

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ImageValidationError("Geçerli bir JSON gövdesi gönderilmelidir.")

    data = payload.get("image")
    if not isinstance(data, str) or not data.strip():
        raise ImageValidationError("Resim yüklenmedi.")

    try:
        encoded_image = data.split(",", 1)[1] if "," in data else data
        image_data = base64.b64decode(encoded_image, validate=True)
    except (IndexError, Base64Error, ValueError) as exc:
        raise ImageValidationError("Geçersiz Base64 resim verisi gönderildi.") from exc

    try:
        with Image.open(BytesIO(image_data)) as image:
            image.load()
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            return np.array(image)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ImageValidationError("Gönderilen veri geçerli bir resim dosyası değil.") from exc


def to_gray(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    return image


def encode_png(image):
    if image.dtype != np.uint8:
        image = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)
        image = image.astype(np.uint8)

    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    success, buffer = cv2.imencode(".png", image)
    if not success:
        raise RuntimeError("İşlenmiş resim PNG formatına dönüştürülemedi.")

    return base64.b64encode(buffer.tobytes()).decode("utf-8")


def process_image(transform, success_message):
    try:
        image = get_image_from_request()
        processed_image = transform(image)
        return jsonify({"message": success_message, "image": encode_png(processed_image)})
    except ImageValidationError as exc:
        return jsonify({"message": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Görüntü işleme sırasında hata oluştu")
        return jsonify({"message": f"Bir hata oluştu: {str(exc)}"}), 500


@app.route("/adaptive-thresholding", methods=["POST"])
def adaptive_thresholding_route():
    def transform(image):
        gray_image = to_gray(image)
        return cv2.adaptiveThreshold(
            gray_image,
            255,
            cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY,
            11,
            2,
        )

    return process_image(transform, "Adaptive Thresholding tamamlandı")


@app.route("/blur", methods=["POST"])
def blur_image():
    def transform(image):
        return cv2.GaussianBlur(to_gray(image), (15, 15), 0)

    return process_image(transform, "Bulanıklaştırma tamamlandı")


@app.route("/sharpness", methods=["POST"])
def sharpness_image():
    def transform(image):
        kernel = np.array(
            [
                [-1, -1, -1],
                [-1, 9, -1],
                [-1, -1, -1],
            ]
        )
        return cv2.filter2D(to_gray(image), -1, kernel)

    return process_image(transform, "Keskinleştirme tamamlandı")


@app.route("/gamma-filter", methods=["POST"])
def gamma_filter():
    def transform(image):
        payload = request.get_json(silent=True) or {}
        gamma = payload.get("gamma", 1.5)

        try:
            gamma = float(gamma)
        except (TypeError, ValueError) as exc:
            raise ImageValidationError("Gamma değeri sayısal olmalıdır.") from exc

        if gamma <= 0:
            raise ImageValidationError("Gamma değeri 0'dan büyük olmalıdır.")

        gray_image = to_gray(image)
        return np.array(255 * (gray_image / 255) ** gamma, dtype=np.uint8)

    return process_image(transform, "Gamma filtreleme tamamlandı")


@app.route("/canny", methods=["POST"])
def canny_filter():
    def transform(image):
        return cv2.Canny(to_gray(image), 100, 200)

    return process_image(transform, "Canny kenar tespiti tamamlandı")


@app.route("/sobel", methods=["POST"])
def sobel_filter():
    def transform(image):
        gray_image = to_gray(image)
        sobel_x = cv2.Sobel(gray_image, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray_image, cv2.CV_64F, 0, 1, ksize=3)
        return cv2.magnitude(sobel_x, sobel_y)

    return process_image(transform, "Sobel kenar tespiti tamamlandı")


@app.route("/laplacian", methods=["POST"])
def laplacian_filter():
    def transform(image):
        laplacian = cv2.Laplacian(to_gray(image), cv2.CV_64F)
        return cv2.convertScaleAbs(laplacian)

    return process_image(transform, "Laplacian kenar tespiti tamamlandı")


@app.route("/shi-tomasi-corner", methods=["POST"])
def shi_tomasi_corner_detection():
    def transform(image):
        gray_image = to_gray(image)
        corners = cv2.goodFeaturesToTrack(gray_image, 100, 0.01, 10)

        if corners is None:
            raise ImageValidationError("Köşe tespiti için yeterli özellik bulunamadı.")

        output = cv2.cvtColor(gray_image, cv2.COLOR_GRAY2RGB) if len(image.shape) == 2 else image.copy()
        for corner in np.int32(corners):
            x, y = corner.ravel()
            cv2.circle(output, (x, y), 3, (255, 0, 0), -1)
        return output

    return process_image(transform, "Shi-Tomasi köşe tespiti tamamlandı")


@app.route("/harris-corner", methods=["POST"])
def harris_corner_detection():
    def transform(image):
        gray_image = to_gray(image)
        dst = cv2.cornerHarris(gray_image, 2, 3, 0.04)
        dst = cv2.dilate(dst, None)

        output = cv2.cvtColor(gray_image, cv2.COLOR_GRAY2RGB) if len(image.shape) == 2 else image.copy()
        output[dst > 0.01 * dst.max()] = [255, 0, 0]
        return output

    return process_image(transform, "Harris köşe tespiti tamamlandı")


@app.route("/otsu-thresholding", methods=["POST"])
def otsu_thresholding():
    def transform(image):
        _, otsu_thresholded_image = cv2.threshold(
            to_gray(image),
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU,
        )
        return otsu_thresholded_image

    return process_image(transform, "Otsu Thresholding tamamlandı")


@app.route("/video-feed")
def video_feed():
    def generate_frames():
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        camera = cv2.VideoCapture(0)

        try:
            while True:
                success, frame = camera.read()
                if not success:
                    break

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30),
                )

                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)

                success, buffer = cv2.imencode(".jpg", frame)
                if not success:
                    continue

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
                )
        finally:
            camera.release()

    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
