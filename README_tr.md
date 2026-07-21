# Image Processing Workbench

Image Processing Workbench, tarayıcı üzerinden yüklenen görsellere yaygın bilgisayarlı görü işlemlerini uygulamak için geliştirilmiş Flask tabanlı bir web uygulamasıdır. Hafif bir Python API'si ile sade HTML, CSS ve JavaScript arayüzünü birleştirir; bu sayede proje yerelde kolayca çalıştırılabilir ve gerektiğinde rahatça genişletilebilir.

Uygulama; thresholding, kenar tespiti, keskinleştirme, bulanıklaştırma, gamma düzeltme, köşe tespiti ve web kamerası üzerinden yüz tespiti gibi görüntü işleme tekniklerini öğrenmek, denemek ve hızlıca görsel olarak test etmek için uygundur.

## Özellikler

- Tarayıcıdan dosya seçerek veya sürükle-bırak ile görsel yükleme.
- Orijinal ve işlenmiş görselleri aynı çalışma alanında önizleme.
- Bulanıklaştırma, keskinleştirme ve gamma düzeltme uygulama.
- Adaptive ve Otsu thresholding çalıştırma.
- Canny, Sobel ve Laplacian filtreleriyle kenar tespiti yapma.
- Harris ve Shi-Tomasi algoritmalarıyla köşe tespiti yapma.
- Haar cascade ile web kamerası üzerinden yüz tespiti yapma.
- Görüntü işleme adımlarını geri alma ve ileri alma.
- Mevcut görseli ilk yüklenen orijinal haline sıfırlama.
- İşlenmiş görseli PNG olarak indirme.
- Yüklenen görsel verisini doğrulama ve 8 MB istek sınırı uygulama.

## Teknoloji Yığını

- Python
- Flask
- Flask-CORS
- OpenCV
- NumPy
- Pillow
- HTML
- CSS
- JavaScript

Sabitlenmiş Python paket sürümleri `requirements.txt` dosyasında listelenmiştir.

## Proje Yapısı

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

## Başlarken

### Gereksinimler

- Yerelde kurulu Python.
- JavaScript etkinleştirilmiş bir tarayıcı.
- Yüz tespiti akışını kullanmak istiyorsanız bir web kamerası.

Bağımlılık dosyası, proje ortamında kullanılan Python sürümünü belirtir ve gerekli paketleri sabit sürümleriyle listeler.

### Kurulum

Depoyu klonlayın:

```bash
git clone https://github.com/suna-slgl/image-processing-website-with-python-flask-javascript.git
cd image-processing-website-with-python-flask-javascript
```

Sanal ortam oluşturun ve etkinleştirin:

```bash
python -m venv .venv
```

Windows için:

```bash
.venv\Scripts\activate
```

macOS veya Linux için:

```bash
source .venv/bin/activate
```

Bağımlılıkları yükleyin:

```bash
pip install -r requirements.txt
```

Uygulamayı çalıştırın:

```bash
python app.py
```

Uygulamayı tarayıcıda açın:

```text
http://localhost:5000
```

## Kullanım

1. Yükleme panelinden bir görsel yükleyin.
2. Kullanılabilir görüntü işleme işlemlerinden birini seçin.
3. Önizleme kontrolleriyle orijinal ve işlenmiş görseli karşılaştırın.
4. Gerekirse geri al, ileri al veya sıfırla işlemlerini kullanın.
5. Son işlenmiş görseli indirin.

Yüz tespiti için araç panelindeki kamera aksiyonunu kullanın. Video akışı başlamadan önce tarayıcı ve işletim sistemi kamera izni isteyebilir.

## API Özeti

Görüntü işleme uç noktalarının çoğu Base64 olarak kodlanmış görsel içeren bir JSON gövdesi kabul eder:

```json
{
  "image": "data:image/png;base64,..."
}
```

Başarılı yanıtlar bir mesaj ve Base64 olarak kodlanmış PNG döndürür:

```json
{
  "message": "İşlem tamamlandı",
  "image": "..."
}
```

Kullanılabilir uç noktalar:

| Metot | Uç nokta | Açıklama |
| --- | --- | --- |
| `GET` | `/` | Web arayüzünü sunar. |
| `POST` | `/blur` | Gaussian blur uygular. |
| `POST` | `/sharpness` | Keskinleştirme kerneli uygular. |
| `POST` | `/gamma-filter` | Gamma düzeltme uygular. İsteğe bağlı `gamma` değeri kabul eder. |
| `POST` | `/adaptive-thresholding` | Adaptive thresholding uygular. |
| `POST` | `/otsu-thresholding` | Otsu thresholding uygular. |
| `POST` | `/canny` | Canny kenar tespiti çalıştırır. |
| `POST` | `/sobel` | Sobel kenar tespiti çalıştırır. |
| `POST` | `/laplacian` | Laplacian kenar tespiti çalıştırır. |
| `POST` | `/harris-corner` | Harris köşe tespiti çalıştırır. |
| `POST` | `/shi-tomasi-corner` | Shi-Tomasi köşe tespiti çalıştırır. |
| `GET` | `/video-feed` | Yüz tespiti işaretlemeleriyle web kamerası karelerini yayınlar. |

## Doğrulama ve Sınırlar

- Görüntü işleme uç noktaları için istekler JSON formatında olmalıdır.
- `image` alanı geçerli Base64 görsel verisi içermelidir.
- Yüklemeler 8 MB ile sınırlıdır.
- Desteklenmeyen veya geçersiz görsel verisi istemci hatası yanıtı döndürür.
- İşleme hataları JSON formatında hata mesajı döndürür.

## Geliştirme Notları

Ön yüz bilinçli olarak framework kullanılmadan geliştirilmiştir. Statik dosyalar Flask tarafından doğrudan proje kökünden sunulur; görüntü işleme operasyonları ise `app.py` içinde OpenCV, NumPy ve Pillow ile uygulanır.

Yeni bir işlem eklerken mevcut deseni izleyin:

1. `app.py` içinde bir Flask route ekleyin.
2. Doğrulama, dönüştürme, kodlama ve hata yönetimi için `process_image` fonksiyonunu yeniden kullanın.
3. `script.js` içinde karşılık gelen JavaScript fonksiyonunu ekleyin.
4. `index.html` içine ilgili kontrolü ekleyin.

## Lisans

Bu depoda şu anda lisans dosyası bulunmuyor. Projeyi lisans koşullarının açıkça belirtilmesi gereken ortamlarda dağıtmadan veya yeniden kullanmadan önce bir lisans ekleyin.
