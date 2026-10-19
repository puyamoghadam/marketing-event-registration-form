/**
 * Loads dynamic field configurations and saved event CMS details from Google Apps Script.
 */
async function loadDataFromGoogle() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        
        // Render custom form fields if defined in FormConfig tab
        if (data.fields && data.fields.length > 0) {
            buildForm(data.fields);
        } else {
            // Safe fallback fields if FormConfig tab is empty
            buildForm([
                { id: 'firstName', label: 'First Name', type: 'text', required: true, width: 'half' },
                { id: 'lastName', label: 'Last Name', type: 'text', required: true, width: 'half' },
                { id: 'email', label: 'Work Email', type: 'email', required: true, width: 'full' }
            ]);
        }

        // Apply saved marketing copy and presenter images if available
        if (data.eventDetails) {
            const keys = Object.keys(data.eventDetails);
            keys.forEach(id => {
                const el = document.getElementById(id);
                if (el && data.eventDetails[id]) {
                    if (el.tagName === 'IMG') {
                        el.src = data.eventDetails[id];
                    } else {
                        el.innerHTML = data.eventDetails[id];
                    }
                }
            });
        }
    } catch (error) {
        console.warn("Using fallback form configuration:", error);
        buildForm([
            { id: 'firstName', label: 'First Name', type: 'text', required: true, width: 'half' },
            { id: 'lastName', label: 'Last Name', type: 'text', required: true, width: 'half' },
            { id: 'email', label: 'Work Email', type: 'email', required: true, width: 'full' }
        ]);
    }
}

/**
 * Generates responsive form inputs dynamically.
 * @param {Array} fields 
 */
function buildForm(fields) {
    let htmlContent = '';
    let halfRowOpen = false;

    fields.forEach((field, index) => {
        const isRequired = String(field.required).toLowerCase() === 'true';
        const widthClass = field.width === 'half' ? 'w-full sm:w-1/2' : 'w-full';
        const requiredAsterisk = isRequired ? '<span class="text-red-500">*</span>' : '';
        
        const inputElement = `
            <div class="${widthClass}">
                <label for="${field.id}" class="block text-sm font-medium text-gray-700 mb-1">${field.label} ${requiredAsterisk}</label>
                <input type="${field.type}" id="${field.id}" name="${field.id}" ${isRequired ? 'required' : ''} class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-gray-50 focus:bg-white transition-shadow">
            </div>
        `;

        if (field.width === 'half') {
            if (!halfRowOpen) {
                htmlContent += '<div class="flex flex-col sm:flex-row gap-4">';
                halfRowOpen = true;
            }
            htmlContent += inputElement;
            if (!fields[index + 1] || fields[index + 1].width !== 'half') {
                htmlContent += '</div>';
                halfRowOpen = false;
            }
        } else {
            htmlContent += inputElement;
        }
    });

    const container = document.getElementById('dynamic-fields-container');
    const loader = document.getElementById('form-loader');
    const form = document.getElementById('registrationForm');

    if (container) container.innerHTML = htmlContent;
    if (loader) loader.classList.add('hidden');
    if (form) form.classList.remove('hidden');
}

/**
 * Intercepts form submission and posts values directly to the Google Sheet.
 */
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromGoogle();

    const registrationForm = document.getElementById('registrationForm');
    if (!registrationForm) return;

    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnContent = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span> Submitting...</span>';
        submitBtn.disabled = true;
        
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        if (errorMessage) errorMessage.classList.add('hidden');

        const formData = new FormData(this);
        formData.append('timestamp', new Date().toISOString());
        const searchParams = new URLSearchParams(formData);

        try {
            await fetch(scriptURL, { 
                method: 'POST', 
                mode: 'no-cors', 
                body: searchParams 
            });
            this.style.display = 'none';
            if (successMessage) successMessage.classList.remove('hidden');
        } catch (error) {
            console.error("Submission failed:", error);
            if (errorMessage) errorMessage.classList.remove('hidden');
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
        }
    });
});