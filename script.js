const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

let originalImage = "";
let editedImage = "";
let faceDetectionActive = false;

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const cameraFeed = document.getElementById("cameraFeed");

function toggleMenu(menuId) {
  document.querySelectorAll(".dropdown-content").forEach((menu) => {
    if (menu.id !== menuId) {
      menu.classList.remove("show");
    }
  });

  const selectedMenu = document.getElementById(menuId);
  if (selectedMenu) {
    selectedMenu.classList.toggle("show");
  }
}

function closeMenus(event) {
  if (!event.target.matches(".dropbtn")) {
    document.querySelectorAll(".dropdown-content").forEach((menu) => {
      menu.classList.remove("show");
    });
  }
}

function uploadImage() {
  imageInput.click();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Lütfen geçerli bir resim dosyası seçin.");
    imageInput.value = "";
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    alert("Yüklenen resim çok büyük. En fazla 8 MB yükleyebilirsiniz.");
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    originalImage = reader.result;
    editedImage = reader.result;
    showImage(editedImage);
  };
  reader.onerror = () => {
    alert("Resim okunurken bir hata oluştu.");
  };
  reader.readAsDataURL(file);
}

function showImage(imageData) {
  cameraFeed.hidden = true;
  cameraFeed.removeAttribute("src");
  imagePreview.src = imageData;
  imagePreview.hidden = false;
  faceDetectionActive = false;
}

function requireImage() {
  if (!editedImage) {
    alert("Lütfen önce bir resim yükleyin.");
    return false;
  }

  return true;
}

async function applyFilter(endpoint, extraPayload = {}) {
  if (!requireImage()) {
    return;
  }

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
  } catch (error) {
    alert(error.message || "İşlem sırasında bir hata oluştu.");
  }
}

function runAdaptiveThresholding() {
  applyFilter("/adaptive-thresholding");
}

function runOtsuThresholding() {
  applyFilter("/otsu-thresholding");
}

function runBlur() {
  applyFilter("/blur");
}

function runSharpness() {
  applyFilter("/sharpness");
}

function runGamma() {
  applyFilter("/gamma-filter");
}

function runCanny() {
  applyFilter("/canny");
}

function runSobel() {
  applyFilter("/sobel");
}

function runLaplacian() {
  applyFilter("/laplacian");
}

function runHarris() {
  applyFilter("/harris-corner");
}

function runShiTomasi() {
  applyFilter("/shi-tomasi-corner");
}

function toggleFaceDetection() {
  faceDetectionActive = !faceDetectionActive;

  if (faceDetectionActive) {
    imagePreview.hidden = true;
    cameraFeed.src = "/video-feed";
    cameraFeed.hidden = false;
    return;
  }

  cameraFeed.hidden = true;
  cameraFeed.removeAttribute("src");

  if (editedImage) {
    imagePreview.hidden = false;
  }
}

function showOriginal() {
  if (originalImage) {
    imagePreview.src = originalImage;
  }
}

function showEdited() {
  if (editedImage) {
    imagePreview.src = editedImage;
  }
}

function resetImage() {
  if (!originalImage) {
    alert("Sıfırlamak için önce bir resim yükleyin.");
    return;
  }

  editedImage = originalImage;
  showImage(editedImage);
}

function downloadImage() {
  if (!editedImage) {
    alert("İndirmek için önce bir resim yükleyin.");
    return;
  }

  const link = document.createElement("a");
  link.href = editedImage;
  link.download = "processed-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.addEventListener("click", closeMenus);
