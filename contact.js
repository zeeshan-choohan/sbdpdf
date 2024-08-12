function loadHTMLComponents() {
            const includeElements = document.querySelectorAll('[data-include]');
            includeElements.forEach(el => {
                const file = el.getAttribute('data-include');
                fetch(file)
                    .then(response => {
                        if (response.ok) return response.text();
                        throw new Error('Network response was not ok.');
                    })
                    .then(data => {
                        el.innerHTML = data;
                    })
                    .catch(error => {
                        console.error('There was a problem with the fetch operation:', error);
                    });
            });
        }

        document.addEventListener('DOMContentLoaded', loadHTMLComponents);

        // Form submit
        document.getElementById('contactForm').addEventListener('submit', function(event) {
            event.preventDefault();
            
            document.getElementById('contactForm').reset();

            const responseMessage = document.getElementById('responseMessage');
            responseMessage.textContent = 'We have received your request and will respond soon.';
            responseMessage.classList.add('alert', 'alert-success');

            // Remove message after 10 seconds
            setTimeout(() => {
                responseMessage.textContent = '';
                responseMessage.classList.remove('alert', 'alert-success');
            }, 10000);
        });