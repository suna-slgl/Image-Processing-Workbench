const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

let originalImage = "";
let editedImage = "";
let originalFileName = "";
let faceDetectionActive = false;
let isProcessing = false;
let imageHistory = [];
let historyIndex = -1;

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const cameraFeed = document.getElementById("cameraFeed");
const uploadDropzone = document.getElementById("uploadDropzone");
const emptyState = document.getElementById("emptyState");
const previewSurface = document.getElementById("previewSurface");
const previewTitle = document.getElementById("previewTitle");
const loadingOverlay = document.getElementById("loadingOverlay");
const gammaValue = document.getElementById("gammaValue");
const gammaOutput = document.getElementById("gammaOutput");
const faceDetectionButton = document.getElementById("faceDetectionButton");
const showOriginalButton = document.getElementById("showOriginalButton");
const showEditedButton = document.getElementById("showEditedButton");
const undoButton = document.getElementById("undoButton");
const redoButton = document.getElementById("redoButton");

function notify(message, type = "neutral") {
  if (type === "error") {
    alert(message);
  }
}

function updateHistoryButtons() {
  undoButton.disabled = isProcessing || historyIndex <= 0;
  redoButton.disabled = isProcessing || historyIndex >= imageHistory.length - 1;
}

function setProcessing(processing) {
  isProcessing = processing;
  loadingOverlay.hidden = !processing;
  document.querySelectorAll(".button, .segment-button").forEach((button) => {
    button.disabled = processing;
  });

  if (!processing) {
    updateHistoryButtons();
  }
}

function pushHistory(imageData) {
  if (!imageData || imageHistory[historyIndex] === imageData) {
    updateHistoryButtons();
    return;
  }

  imageHistory = imageHistory.slice(0, historyIndex + 1);
  imageHistory.push(imageData);
  historyIndex = imageHistory.length - 1;
  updateHistoryButtons();
}

function restoreHistoryState(index) {
  if (index < 0 || index >= imageHistory.length || isProcessing) {
    return;
  }

  historyIndex = index;
  editedImage = imageHistory[historyIndex];
  showImage(editedImage);
  updateHistoryButtons();
}

function toggleMenu() {
  return true;
}

function uploadImage() {
  if (!isProcessing) {
    imageInput.click();
  }
}

function handleImageUpload(event) {
  handleSelectedFile(event.target.files[0]);
}

function handleSelectedFile(file) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    notify("Lütfen geçerli bir resim dosyası seçin.", "error");
    imageInput.value = "";
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    notify("Yüklenen resim çok büyük. En fazla 8 MB yükleyebilirsiniz.", "error");
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    originalImage = reader.result;
    editedImage = reader.result;
    originalFileName = file.name;
    imageHistory = [];
    historyIndex = -1;
    showImage(editedImage);
    pushHistory(editedImage);
  };
  reader.onerror = () => {
    notify("Resim okunurken bir hata oluştu.", "error");
  };
  reader.readAsDataURL(file);
}

function showImage(imageData) {
  cameraFeed.hidden = true;
  cameraFeed.removeAttribute("src");
  imagePreview.src = imageData;
  imagePreview.hidden = false;
  emptyState.hidden = true;
  previewSurface.classList.remove("empty");
  previewTitle.textContent = originalFileName || "Önizleme";
  faceDetectionActive = false;
  faceDetectionButton.textContent = "Yüz tanımlamayı aç";
  setCompareMode("edited");
}

function requireImage() {
  if (!editedImage) {
    notify("Lütfen önce bir resim yükleyin.", "error");
    return false;
  }

  return true;
}

async function applyFilter(endpoint, operationName, extraPayload = {}) {
  if (!requireImage() || isProcessing) {
    return;
  }

  setProcessing(true);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: editedImage,
        ...extraPayload,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "İşlem tamamlanamadı.");
    }

    editedImage = `data:image/png;base64,${result.image}`;
    showImage(editedImage);
    pushHistory(editedImage);
  } catch (error) {
    notify(error.message || "İşlem sırasında bir hata oluştu.", "error");
  } finally {
    setProcessing(false);
  }
}

function runAdaptiveThresholding() {
  applyFilter("/adaptive-thresholding", "Adaptive Thresholding");
}

function runOtsuThresholding() {
  applyFilter("/otsu-thresholding", "Otsu Thresholding");
}

function runBlur() {
  applyFilter("/blur", "Bulanıklaştırma");
}

function runSharpness() {
  applyFilter("/sharpness", "Keskinleştirme");
}

function runGamma() {
  applyFilter("/gamma-filter", "Gamma filtreleme", {
    gamma: Number(gammaValue.value),
  });
}

function runCanny() {
  applyFilter("/canny", "Canny kenar tespiti");
}

function runSobel() {
  applyFilter("/sobel", "Sobel kenar tespiti");
}

function runLaplacian() {
  applyFilter("/laplacian", "Laplacian kenar tespiti");
}

function runHarris() {
  applyFilter("/harris-corner", "Harris köşe tespiti");
}

function runShiTomasi() {
  applyFilter("/shi-tomasi-corner", "Shi-Tomasi köşe tespiti");
}

function toggleFaceDetection() {
  faceDetectionActive = !faceDetectionActive;

  if (faceDetectionActive) {
    imagePreview.hidden = true;
    emptyState.hidden = true;
    previewSurface.classList.remove("empty");
    cameraFeed.src = "/video-feed";
    cameraFeed.hidden = false;
    previewTitle.textContent = "Kamera";
    faceDetectionButton.textContent = "Yüz tanımlamayı kapat";
    return;
  }

  cameraFeed.hidden = true;
  cameraFeed.removeAttribute("src");
  faceDetectionButton.textContent = "Yüz tanımlamayı aç";

  if (editedImage) {
    imagePreview.hidden = false;
    previewTitle.textContent = originalFileName || "Önizleme";
  } else {
    emptyState.hidden = false;
    previewSurface.classList.add("empty");
    previewTitle.textContent = "Henüz resim yok";
  }
}

function setCompareMode(mode) {
  showOriginalButton.classList.toggle("active", mode === "original");
  showEditedButton.classList.toggle("active", mode === "edited");
}

function showOriginal() {
  if (!originalImage) {
    notify("Karşılaştırmak için önce bir resim yükleyin.", "error");
    return;
  }

  imagePreview.src = originalImage;
  setCompareMode("original");
}

function showEdited() {
  if (!editedImage) {
    notify("Karşılaştırmak için önce bir resim yükleyin.", "error");
    return;
  }

  imagePreview.src = editedImage;
  setCompareMode("edited");
}

function undoImage() {
  if (historyIndex <= 0) {
    return;
  }

  restoreHistoryState(historyIndex - 1);
}

function redoImage() {
  if (historyIndex >= imageHistory.length - 1) {
    return;
  }

  restoreHistoryState(historyIndex + 1);
}

function resetImage() {
  if (!originalImage) {
    notify("Sıfırlamak için önce bir resim yükleyin.", "error");
    return;
  }

  editedImage = originalImage;
  showImage(editedImage);
  pushHistory(editedImage);
}

function downloadImage() {
  if (!editedImage) {
    notify("İndirmek için önce bir resim yükleyin.", "error");
    return;
  }

  const link = document.createElement("a");
  link.href = editedImage;
  link.download = "processed-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function preventDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  uploadDropzone.addEventListener(eventName, (event) => {
    preventDefault(event);
    uploadDropzone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadDropzone.addEventListener(eventName, (event) => {
    preventDefault(event);
    uploadDropzone.classList.remove("drag-over");
  });
});

uploadDropzone.addEventListener("drop", (event) => {
  handleSelectedFile(event.dataTransfer.files[0]);
});

gammaValue.addEventListener("input", () => {
  gammaOutput.textContent = gammaValue.value;
});

window.addEventListener("keydown", (event) => {
  const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey;
  const isRedo =
    ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") ||
    ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && event.shiftKey);

  if (isUndo) {
    event.preventDefault();
    undoImage();
  }

  if (isRedo) {
    event.preventDefault();
    redoImage();
  }
});

updateHistoryButtons();
