const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-upload');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#7c3aed';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '#d1d1d1';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  fileInput.files = e.dataTransfer.files;
  dropZone.style.borderColor = '#d1d1d1';
  alert(`${fileInput.files[0].name} ready to upload!`);
});

document.getElementById('upload-btn').addEventListener('click', () => {
  if (fileInput.files.length === 0) {
    alert('Please select a file first!');
  } else {
    alert(`Uploading ${fileInput.files[0].name}...`);
  }
});
