
        // Theme Toggle Functionality
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;

        // Check for saved theme preference or default to light mode
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // Login Form Validation and Submission
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');

        // Validation functions
        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
                return 'Email is required';
            }
            if (!emailRegex.test(email)) {
                return 'Please enter a valid email address';
            }
            return '';
        }

        function validatePassword(password) {
            if (!password || password.length < 1) {
                return 'Password is required';
            }
            return '';
        }

        // Real-time validation
        emailInput.addEventListener('blur', () => {
            const error = validateEmail(emailInput.value);
            if (error) {
                emailError.textContent = error;
                emailError.style.display = 'block';
                emailInput.classList.add('error');
            } else {
                emailError.style.display = 'none';
                emailInput.classList.remove('error');
            }
        });

        passwordInput.addEventListener('blur', () => {
            const error = validatePassword(passwordInput.value);
            if (error) {
                passwordError.textContent = error;
                passwordError.style.display = 'block';
                passwordInput.classList.add('error');
            } else {
                passwordError.style.display = 'none';
                passwordInput.classList.remove('error');
            }
        });

        // Form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Clear previous errors
            emailError.style.display = 'none';
            passwordError.style.display = 'none';
            emailInput.classList.remove('error');
            passwordInput.classList.remove('error');

            // Validate all fields
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            const emailErr = validateEmail(email);
            const passwordErr = validatePassword(password);

            let hasError = false;

            if (emailErr) {
                emailError.textContent = emailErr;
                emailError.style.display = 'block';
                emailInput.classList.add('error');
                hasError = true;
            }

            if (passwordErr) {
                passwordError.textContent = passwordErr;
                passwordError.style.display = 'block';
                passwordInput.classList.add('error');
                hasError = true;
            }

            if (hasError) {
                return;
            }

            // TODO: Check credentials in localStorage
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find user with matching email and password
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                passwordError.textContent = 'Invalid email or password';
                passwordError.style.display = 'block';
                passwordInput.classList.add('error');
                return;
            }

            // Store current user session
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));

            // Show success message
            const button = loginForm.querySelector('.login-button');
            const originalText = button.querySelector('span').textContent;
            button.querySelector('span').textContent = 'Success! Redirecting...';
            button.style.background = 'rgba(76, 175, 80, 0.3)';

            // TODO: Redirect to feed.html after successful login
            setTimeout(() => {
                window.location.href = 'feed.html';
            }, 1000);
        });
