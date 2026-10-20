/**
 * Target DOM element IDs that can be visually edited when in Admin Mode.
 */
const editableElementIds = [
    'edit-logo', 'edit-title', 'edit-subtitle', 'edit-date', 'edit-time', 'edit-about',
    'edit-p1-img', 'edit-p1-name', 'edit-p1-title', 'edit-p1-company',
    'edit-p2-img', 'edit-p2-name', 'edit-p2-title', 'edit-p2-company',
    'edit-p3-img', 'edit-p3-name', 'edit-p3-title', 'edit-p3-company'
];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';

    // Activate only when ?admin=true is present in the browser query string
    if (!isAdmin) return;

    // Reveal floating admin control toolbar
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.classList.remove('hidden');

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
        } else {
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
                eventDetails[id] = el.tagName === 'IMG' ? el.src : el.innerHTML.trim();
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