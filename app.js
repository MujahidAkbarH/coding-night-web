
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

        // Signup Form Validation and Submission
        const signupForm = document.getElementById('signupForm');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');

        // Validation functions
        function validateName(name) {
            if (!name || name.trim().length < 2) {
                return 'Name must be at least 2 characters long';
            }
            if (name.trim().length > 50) {
                return 'Name must be less than 50 characters';
            }
            return '';
        }

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
            if (!password || password.length < 6) {
                return 'Password must be at least 6 characters long';
            }
            if (password.length > 100) {
                return 'Password must be less than 100 characters';
            }
            return '';
        }

        // Real-time validation
        nameInput.addEventListener('blur', () => {
            const error = validateName(nameInput.value);
            if (error) {
                nameError.textContent = error;
                nameError.style.display = 'block';
                nameInput.classList.add('error');
            } else {
                nameError.style.display = 'none';
                nameInput.classList.remove('error');
            }
        });

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
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Clear previous errors
            nameError.style.display = 'none';
            emailError.style.display = 'none';
            passwordError.style.display = 'none';
            nameInput.classList.remove('error');
            emailInput.classList.remove('error');
            passwordInput.classList.remove('error');

            // Validate all fields
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            const nameErr = validateName(name);
            const emailErr = validateEmail(email);
            const passwordErr = validatePassword(password);

            let hasError = false;

            if (nameErr) {
                nameError.textContent = nameErr;
                nameError.style.display = 'block';
                nameInput.classList.add('error');
                hasError = true;
            }

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

            // Check if user already exists
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const userExists = existingUsers.some(user => user.email === email);

            if (userExists) {
                emailError.textContent = 'An account with this email already exists';
                emailError.style.display = 'block';
                emailInput.classList.add('error');
                return;
            }

            // Create user object
            const newUser = {
                id: Date.now().toString(),
                name: name,
                email: email,
                password: password, // In production, this should be hashed
                createdAt: new Date().toISOString()
            };

            // Store user in localStorage
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));

            // Store current user session
            localStorage.setItem('currentUser', JSON.stringify({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }));

            // Show success message (optional)
            const button = signupForm.querySelector('.signup-button');
            const originalText = button.querySelector('span').textContent;
            button.querySelector('span').textContent = 'Success! Redirecting...';
            button.style.background = 'rgba(76, 175, 80, 0.3)';

            // Redirect to feed.html after a short delay
            setTimeout(() => {
                window.location.href = 'feed.html';
            }, 1000);
        });
        flatpickr("#dob", {
    dateFormat: "Y-m-d",
    altInput: true,           // optional: shows nicer formatted date
    altFormat: "F j, Y",
    theme: "material_blue",   // match your style
    wrap: true,               // if using a container element
});

