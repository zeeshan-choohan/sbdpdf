window.onload = function() {
    document.querySelectorAll('.scribdUrl').forEach(input => input.value = '');
};

// Set up form submission and clear input field
document.querySelectorAll('form[id^="downloadForm"]').forEach(form => {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const urlInput = form.querySelector('.scribdUrl');
        if (!urlInput) {
            console.error('URL input field not found.');
            return;
        }

        const url = urlInput.value.trim();
        if (!url) {
            console.error('URL is empty.');
            return;
        }

        const lang = form.id.split('-')[1] || 'en';
        const requestUrl = lang === 'en' ? '/download' : `/${lang}/download`;

        const progressDiv = document.getElementById(`progress-${lang}`);
        const progressValue = document.getElementById(`progressValue-${lang}`);
        const progressBar = document.getElementById(`progressBar-${lang}`);
        const resultDiv = document.getElementById(`result-${lang}`);

        progressDiv.style.display = 'block';
        progressValue.textContent = '0%';
        progressBar.value = 0;
        resultDiv.textContent = '';

        try {
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body.getReader();
            const contentLength = response.headers.get('Content-Length');
            let receivedLength = 0;
            let chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                receivedLength += value.length;

                if (contentLength) {
                    const percent = (receivedLength / contentLength) * 100;
                    progressValue.textContent = `${percent.toFixed(2)}%`;
                    progressBar.value = percent;
                }
            }

            const blob = new Blob(chunks);
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'downloadedfile';

            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            progressValue.textContent = '100%';
            progressBar.value = 100;
            resultDiv.textContent = 'Download complete!';

            // Clear the input field after download
            form.reset();

        } catch (error) {
            console.error('Error:', error);
            resultDiv.textContent = 'An error occurred during download.';
        } finally {
            progressDiv.style.display = 'none';
        }
    });
});

// Clear input field on delete button click
document.querySelectorAll('#deleteEntry').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.scribdUrl').forEach(input => input.value = '');
    });
});