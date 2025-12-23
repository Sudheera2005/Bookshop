class ImageUploader {
    constructor() {
        this.selectedFiles = [];
        this.maxFiles = 2;
        this.maxSize = 5 * 1024 * 1024; // 5MB

        this.initializeElements();
        this.attachEventListeners();
        this.loadGallery();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.previewContainer = document.getElementById('previewContainer');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.galleryGrid = document.getElementById('galleryGrid');
    }

    attachEventListeners() {
        // Browse button click
        this.browseBtn.addEventListener('click', () => this.fileInput.click());

        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Upload button click
        this.uploadBtn.addEventListener('click', () => this.uploadFiles());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        // Clear previous selection if we're at max files
        if (this.selectedFiles.length >= this.maxFiles) {
            this.selectedFiles = [];
            this.clearPreviews();
        }

        files.forEach(file => {
            if (this.selectedFiles.length < this.maxFiles) {
                if (this.validateFile(file)) {
                    this.selectedFiles.push(file);
                    this.createPreview(file);
                }
            }
        });

        this.updateUploadButton();
    }

    validateFile(file) {
        // Check file type
        if (!file.type.match('image.*')) {
            this.showStatus('Please select only image files.', 'error');
            return false;
        }

        // Check file size
        if (file.size > this.maxSize) {
            this.showStatus(`File ${file.name} is too large. Maximum size is 5MB.`, 'error');
            return false;
        }

        return true;
    }

    createPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewBox = document.createElement('div');
            previewBox.className = 'preview-box';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            img.alt = 'Preview';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => this.removePreview(previewBox, file);
            
            previewBox.appendChild(img);
            previewBox.appendChild(removeBtn);
            this.previewContainer.appendChild(previewBox);
        };
        
        reader.readAsDataURL(file);
    }

    removePreview(previewBox, file) {
        // Remove file from selected files
        this.selectedFiles = this.selectedFiles.filter(f => f !== file);
        
        // Remove preview element
        previewBox.remove();
        
        this.updateUploadButton();
    }

    clearPreviews() {
        this.previewContainer.innerHTML = '';
    }

    updateUploadButton() {
        this.uploadBtn.disabled = this.selectedFiles.length === 0;
        this.uploadBtn.textContent = this.selectedFiles.length > 0 
            ? `Upload ${this.selectedFiles.length} Image(s)` 
            : 'Upload Images';
    }

    async uploadFiles() {
        if (this.selectedFiles.length === 0) return;

        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = 'Uploading...';

        try {
            const uploadPromises = this.selectedFiles.map(file => this.uploadToFirebase(file));
            const results = await Promise.all(uploadPromises);

            // Send URLs to PHP backend
            await this.saveToDatabase(results);

            this.showStatus('Images uploaded successfully!', 'success');
            this.clearSelection();
            this.loadGallery(); // Refresh gallery

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus('Error uploading images. Please try again.', 'error');
        }

        this.uploadBtn.disabled = false;
        this.uploadBtn.textContent = 'Upload Images';
    }

    async uploadToFirebase(file) {
        const timestamp = Date.now();
        const fileName = `book_gallery/${timestamp}_${file.name}`;
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(fileName);

        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();

        return {
            url: downloadURL,
            path: fileName,
            name: file.name
        };
    }

    async saveToDatabase(imageData) {
        const formData = new FormData();
        
        imageData.forEach((image, index) => {
            formData.append(`images[${index}][url]`, image.url);
            formData.append(`images[${index}][path]`, image.path);
            formData.append(`images[${index}][name]`, image.name);
        });

        try {
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Database error');
            }

            return result;
        } catch (error) {
            console.error('Database save error:', error);
            throw error;
        }
    }

    async loadGallery() {
        try {
            const response = await fetch('gallery.php');
            const images = await response.json();

            this.displayGallery(images);
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.galleryGrid.innerHTML = '<div class="loading">Error loading images</div>';
        }
    }

    displayGallery(images) {
        if (!images || images.length === 0) {
            this.galleryGrid.innerHTML = '<div class="loading">No images uploaded yet</div>';
            return;
        }

        this.galleryGrid.innerHTML = images.map(image => `
            <div class="gallery-item">
                <img src="${image.image_url}" alt="Book photo" class="gallery-image" loading="lazy">
            </div>
        `).join('');
    }

    clearSelection() {
        this.selectedFiles = [];
        this.clearPreviews();
        this.fileInput.value = '';
        this.updateUploadButton();
    }

    showStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = `upload-status ${type}`;
        
        setTimeout(() => {
            this.uploadStatus.style.display = 'none';
        }, 5000);
    }
}

// Initialize the uploader when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageUploader();
});