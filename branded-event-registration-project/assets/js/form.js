/**
 * Loads dynamic form fields and CMS marketing content from Google Apps Script.
 */
async function loadDataFromGoogle() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        
        // 1. Build dynamic form fields if supplied in FormConfig tab
        if (data.fields && data.fields.length > 0) {
            buildForm(data.fields);
        } else {
            // Safe fallback schema
            buildForm([
                { id: 'firstName', label: 'First Name', type: 'text', required: true, width: 'half' },
                { id: 'lastName', label: 'Last Name', type: 'text', required: true, width: 'half' },
                { id: 'email', label: 'Work Email', type: 'email', required: true, width: 'full' }
            ]);
        }

        // 2. Hydrate updated event copy & presenter pictures from EventConfig tab
        if (data.eventDetails) {
            Object.keys(data.eventDetails).forEach(id => {
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
        console.warn("Could not load dynamic configuration; using default schema:", error);
        buildForm([
            { id: 'firstName', label: 'First Name', type: 'text', required: true, width: 'half' },
            { id: 'lastName', label: 'Last Name', type: 'text', required: true, width: 'half' },
            { id: 'email', label: 'Work Email', type: 'email', required: true, width: 'full' }
        ]);
    }
}

/**
 * Assembles HTML input fields based on column configurations.
 * @param {Array<Object>} fields 
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
                <input 
                    type="${field.type || 'text'}" 
                    id="${field.id}" 
                    name="${field.id}" 
                    ${isRequired ? 'required' : ''} 
                    placeholder="${field.label}"
                    class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-gray-50 focus:bg-white transition-all shadow-sm"
                >
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

    const fieldsContainer = document.getElementById('dynamic-fields-container');
    const formLoader = document.getElementById('form-loader');
    const registrationForm = document.getElementById('registrationForm');

    if (fieldsContainer) fieldsContainer.innerHTML = htmlContent;
    if (formLoader) formLoader.classList.add('hidden');
    if (registrationForm) registrationForm.classList.remove('hidden');
}

/**
 * Intercepts form submission and posts values directly to the connected Google Sheet.
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

        const errorBanner = document.getElementById('error-message');
        const successBanner = document.getElementById('success-message');
        if (errorBanner) errorBanner.classList.add('hidden');

        // Compile fields and attach ISO timestamp
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
            if (successBanner) successBanner.classList.remove('hidden');
        } catch (error) {
            console.error("Submission failed:", error);
            if (errorBanner) errorBanner.classList.remove('hidden');
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
        }
    });
});