/**
 * Target DOM element IDs that can be visually edited when in Admin Mode.
 */
const editableElementIds = [
    'edit-logo', 'edit-title', 'edit-subtitle', 'edit-date', 'edit-time', 'edit-about',
    'edit-p1-img', 'edit-p1-name', 'edit-p1-title', 'edit-p1-company',
    'edit-p2-img', 'edit-p2-name', 'edit-p2-title', 'edit-p2-company',
    'edit-p3-img', 'edit-p3-name', 'edit-p3-title', 'edit-p3-company',
    'edit-banner'
];

/**
 * Optimizes an uploaded image file into a compressed JPEG data URL for sheets persistence
 */
function readFileAsOptimizedDataUrl(file, maxWidth = 1600, quality = 0.78) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function setBannerBackground(url) {
    const banner = document.getElementById('edit-banner');
    if (!banner) return;
    if (url && url.trim() !== '') {
        banner.style.backgroundImage = 'url("' + url + '")';
        banner.dataset.bgUrl = url;
    } else {
        banner.style.backgroundImage = '';
        delete banner.dataset.bgUrl;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';

    // Activate only when ?admin=true is present in the browser query string
    if (!isAdmin) return;

    // Reveal floating admin control toolbar
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.classList.remove('hidden');

    // Reveal hero banner upload buttons
    const adminBannerControls = document.getElementById('admin-banner-controls');
    if (adminBannerControls) adminBannerControls.classList.remove('hidden');

    const bannerEl = document.getElementById('edit-banner');
    if (bannerEl) {
        bannerEl.classList.add('outline-dashed', 'outline-2', 'outline-amber-400');
    }

    const bannerFileInput = document.getElementById('hero-banner-file-input');
    const bannerUploadBtn = document.getElementById('admin-banner-upload-btn');
    const bannerUrlBtn = document.getElementById('admin-banner-url-btn');

    if (bannerUploadBtn && bannerFileInput) {
        bannerUploadBtn.addEventListener('click', () => bannerFileInput.click());
        bannerFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                bannerUploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
                const optimizedData = await readFileAsOptimizedDataUrl(file);
                setBannerBackground(optimizedData);
            } catch (err) {
                console.error("Banner upload error:", err);
            } finally {
                bannerUploadBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload Banner Image';
            }
        });
    }

    if (bannerUrlBtn) {
        bannerUrlBtn.addEventListener('click', () => {
            const current = (bannerEl && bannerEl.dataset.bgUrl) ? bannerEl.dataset.bgUrl : '';
            const newUrl = prompt("Enter the image URL for the hero banner:", current);
            if (newUrl !== null) {
                setBannerBackground(newUrl.trim());
            }
        });
    }

    editableElementIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.tagName === 'IMG') {
            el.classList.add('editable-image-target');
            el.title = "Click to update image URL";
            el.addEventListener('click', () => {
                const currentSrc = el.getAttribute('src') || '';
                const newUrl = prompt("Enter the new image URL:", currentSrc);
                if (newUrl && newUrl.trim() !== '') {
                    el.src = newUrl.trim();
                }
            });
        } else if (id !== 'edit-banner') {
            el.contentEditable = 'true';
            el.classList.add('editable-text-target');
        }
    });

    const saveBtn = document.getElementById('save-layout-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
        const originalContent = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>Saving...</span>';
        saveBtn.disabled = true;

        // Collect all updated content
        const eventDetails = {};
        editableElementIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'edit-banner') {
                    eventDetails[id] = el.dataset.bgUrl || '';
                } else if (el.tagName === 'IMG') {
                    eventDetails[id] = el.src;
                } else {
                    eventDetails[id] = el.innerHTML.trim();
                }
            }
        });

        const formData = new URLSearchParams();
        formData.append('action', 'saveEventDetails');
        formData.append('data', JSON.stringify(eventDetails));

        try {
            await fetch(scriptURL, { 
                method: 'POST', 
                mode: 'no-cors', 
                body: formData 
            });
            
            saveBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i><span>Saved to Google Sheet!</span>';
            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.disabled = false;
            }, 3000);
        } catch (err) {
            console.error("Save error:", err);
            saveBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-2"></i><span>Failed to Save</span>';
            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.disabled = false;
            }, 3000);
        }
    });
});