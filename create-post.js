
        // Theme Toggle Functionality (same as feed.html)
        const html = document.documentElement;
        const darkModeToggle = document.getElementById('darkModeToggle');

        // Check for saved theme preference or default to light mode
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            darkModeToggle.classList.add('active');
        }

        function toggleTheme() {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            darkModeToggle.classList.toggle('active');
        }

        darkModeToggle.addEventListener('click', toggleTheme);

        // Get current user
        function getCurrentUser() {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) {
                // Redirect to login if no user
                window.location.href = 'login.html';
                return null;
            }
            return JSON.parse(userStr);
        }

        // Get full user data from users array
        function getFullUserData() {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const currentUser = getCurrentUser();
            if (!currentUser) return null;
            return users.find(u => u.id === currentUser.id) || currentUser;
        }

        const currentUser = getCurrentUser();

        // Firebase Compatibility Functions
        // These functions work with both Firebase and localStorage
        async function getCurrentUserFirebase() {
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                return firebase.auth().currentUser;
            }
            // Fallback to localStorage
            return getCurrentUser();
        }

        async function getUserProfileDataFirebase(userId) {
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const db = firebase.firestore();
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        return { id: userDoc.id, ...userDoc.data() };
                    }
                } catch (error) {
                    console.error('Error fetching user from Firestore:', error);
                }
            }
            // Fallback to localStorage
            return getFullUserData();
        }

        async function getUserPostsFirebase(userId) {
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const db = firebase.firestore();
                    const postsSnapshot = await db.collection('posts')
                        .where('userId', '==', userId)
                        .orderBy('timestamp', 'desc')
                        .get();
                    
                    return postsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                } catch (error) {
                    console.error('Error fetching posts from Firestore:', error);
                }
            }
            // Fallback to localStorage
            let posts = [];
            try {
                const storedPosts = localStorage.getItem('posts');
                posts = storedPosts ? JSON.parse(storedPosts) : [];
                if (!Array.isArray(posts)) posts = [];
            } catch (error) {
                console.error('Error loading posts:', error);
                posts = [];
            }
            return posts.filter(p => p && p.userId === userId);
        }

        // Load posts function for localStorage
        function loadPosts() {
            try {
                const storedPosts = localStorage.getItem('posts');
                return storedPosts ? JSON.parse(storedPosts) : [];
            } catch (error) {
                console.error('Error loading posts:', error);
                return [];
            }
        }
        if (!currentUser) {
            // Will redirect to login
        }

        // Emoji Picker
        const emojiTrigger = document.getElementById('emojiTrigger');
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiGrid = document.getElementById('emojiGrid');
        const postText = document.getElementById('postText');

        // Common emojis
        const emojis = ['😊', '😄', '😃', '😁', '😆', '😅', '😂', '🤣', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'];

        // Populate emoji grid
        emojis.forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.addEventListener('click', () => {
                const cursorPos = postText.selectionStart;
                const textBefore = postText.value.substring(0, cursorPos);
                const textAfter = postText.value.substring(cursorPos);
                postText.value = textBefore + emoji + textAfter;
                postText.focus();
                postText.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
                emojiPicker.classList.remove('active');
            });
            emojiGrid.appendChild(emojiItem);
        });

        // Toggle emoji picker
        emojiTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            emojiPicker.classList.toggle('active');
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && !emojiTrigger.contains(e.target)) {
                emojiPicker.classList.remove('active');
            }
        });

        // Form Validation and Submission
        const createPostForm = document.getElementById('createPostForm');
        const postTextInput = document.getElementById('postText');
        const imageUrlInput = document.getElementById('imageUrl');
        const postButton = document.getElementById('postButton');
        const postTextError = document.getElementById('postTextError');
        const imageUrlError = document.getElementById('imageUrlError');

        function validatePostText(text) {
            if (!text || text.trim().length === 0) {
                return 'Post text is required';
            }
            if (text.trim().length > 1000) {
                return 'Post text must be less than 1000 characters';
            }
            return '';
        }

        function validateImageUrl(url) {
            if (!url || url.trim() === '') {
                return ''; // Optional field
            }
            try {
                new URL(url);
                return '';
            } catch {
                return 'Please enter a valid URL';
            }
        }

        // Real-time validation
        postTextInput.addEventListener('blur', () => {
            const error = validatePostText(postTextInput.value);
            if (error) {
                postTextError.textContent = error;
                postTextError.style.display = 'block';
                postTextInput.classList.add('error');
            } else {
                postTextError.style.display = 'none';
                postTextInput.classList.remove('error');
            }
        });

        imageUrlInput.addEventListener('blur', () => {
            const error = validateImageUrl(imageUrlInput.value);
            if (error) {
                imageUrlError.textContent = error;
                imageUrlError.style.display = 'block';
                imageUrlInput.classList.add('error');
            } else {
                imageUrlError.style.display = 'none';
                imageUrlInput.classList.remove('error');
            }
        });

        // Form submission
        createPostForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Clear previous errors
            postTextError.style.display = 'none';
            imageUrlError.style.display = 'none';
            postTextInput.classList.remove('error');
            imageUrlInput.classList.remove('error');

            // Validate all fields
            const text = postTextInput.value.trim();
            const imageUrl = imageUrlInput.value.trim();

            const textErr = validatePostText(text);
            const imageErr = validateImageUrl(imageUrl);

            let hasError = false;

            if (textErr) {
                postTextError.textContent = textErr;
                postTextError.style.display = 'block';
                postTextInput.classList.add('error');
                hasError = true;
            }

            if (imageErr) {
                imageUrlError.textContent = imageErr;
                imageUrlError.style.display = 'block';
                imageUrlInput.classList.add('error');
                hasError = true;
            }

            if (hasError) {
                return;
            }

            // Disable button during submission
            postButton.disabled = true;
            postButton.querySelector('span').textContent = 'Posting...';

            // Get full user data for DOB and gender
            const fullUser = getFullUserData() || currentUser;

            // Create new post object
            const newPost = {
                id: Date.now().toString(),
                userId: currentUser.id,
                username: currentUser.name,
                text: text,
                imageUrl: imageUrl || '',
                timestamp: new Date().toISOString(),
                likes: 0,
                likedBy: []
            };

            // Get existing posts from localStorage
            let posts = JSON.parse(localStorage.getItem('posts') || '[]');
            
            // Add new post to the beginning (latest first)
            posts.unshift(newPost);
            
            // Save to localStorage
            localStorage.setItem('posts', JSON.stringify(posts));

            // Show success message
            postButton.querySelector('span').textContent = 'Posted! Redirecting...';
            postButton.style.background = 'var(--button-hover)';

            // Redirect to feed.html after a short delay
            setTimeout(() => {
                window.location.href = 'feed.html';
            }, 1000);
        });

        // Modal Functionality
        const profileModal = document.getElementById('profileModal');
        const settingsModal = document.getElementById('settingsModal');
        const profileButton = document.getElementById('profileButton');
        const settingsButton = document.getElementById('settingsButton');
        const profileButtonMobile = document.getElementById('profileButtonMobile');
        const settingsButtonMobile = document.getElementById('settingsButtonMobile');
        const closeProfileModal = document.getElementById('closeProfileModal');
        const closeSettingsModal = document.getElementById('closeSettingsModal');

        // Render user posts in profile modal with read more functionality
        function renderUserPostsInProfile(userPosts, userId) {
            if (!userPosts || userPosts.length === 0) {
                return `
                    <div class="profile-posts-section">
                        <div class="profile-posts-title">Posts</div>
                        <div class="profile-posts-empty">No posts yet</div>
                    </div>
                `;
            }

            // Sort posts by timestamp (newest first)
            const sortedPosts = [...userPosts].sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateB.getTime() - dateA.getTime();
            });

            const postsHTML = sortedPosts.map((post, index) => {
                const postInitial = post.username ? post.username.charAt(0).toUpperCase() : 'U';
                const timeAgo = getTimeAgo(new Date(post.timestamp));
                const postText = post.text || '';
                const isLongPost = postText.length > 200;
                const postId = `profile-post-${post.id}-${index}`;
                
                // Check if current user has liked this post
                const isLiked = post.likedBy && post.likedBy.includes(currentUser.id);
                
                return `
                    <div class="profile-post-card" data-post-id="${post.id}">
                        <div class="profile-post-header">
                            <div class="profile-post-pic">${postInitial}</div>
                            <div class="profile-post-username">${escapeHtml(post.username || 'Unknown')}</div>
                            <div class="profile-post-timestamp">${timeAgo}</div>
                        </div>
                        <div class="profile-post-content ${isLongPost ? 'collapsed' : ''}" id="${postId}-content">
                            ${escapeHtml(postText)}
                        </div>
                        ${isLongPost ? `<button class="read-more-btn" onclick="toggleReadMore('${postId}')">Read more...</button>` : ''}
                        ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="Post image" class="profile-post-image" onerror="this.style.display='none'">` : ''}
                        <div class="profile-post-actions">
                            <div class="profile-post-like ${isLiked ? 'liked' : ''}">
                                ❤️ <span>${post.likes || 0}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="profile-posts-section">
                    <div class="profile-posts-title">Posts (${sortedPosts.length})</div>
                    ${postsHTML}
                </div>
            `;
        }

        // Toggle read more functionality
        function toggleReadMore(postId) {
            const contentEl = document.getElementById(`${postId}-content`);
            const btn = contentEl.nextElementSibling;
            
            if (!contentEl || !btn) return;
            
            if (contentEl.classList.contains('collapsed')) {
                contentEl.classList.remove('collapsed');
                contentEl.classList.add('expanded');
                btn.textContent = 'Read less...';
            } else {
                contentEl.classList.remove('expanded');
                contentEl.classList.add('collapsed');
                btn.textContent = 'Read more...';
            }
        }

        // Make toggleReadMore globally accessible
        window.toggleReadMore = toggleReadMore;

        async function openProfileModal() {
            // Reload posts to ensure we have the latest data
            const posts = loadPosts();
            
            // Get user data (supports both Firebase and localStorage)
            let fullUser;
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                // Use Firebase
                const firebaseUser = firebase.auth().currentUser;
                fullUser = await getUserProfileDataFirebase(firebaseUser.uid);
            } else {
                // Use localStorage
                fullUser = getFullUserData();
            }
            
            if (!fullUser) return;
            
            // Check if viewing own profile (supports both Firebase and localStorage)
            let isOwnProfile;
            let userId;
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                // Use Firebase
                const firebaseUser = firebase.auth().currentUser;
                userId = firebaseUser.uid;
                isOwnProfile = fullUser.id === firebaseUser.uid || fullUser.uid === firebaseUser.uid;
            } else {
                // Use localStorage
                userId = fullUser.id;
                isOwnProfile = currentUser.id === fullUser.id;
            }
            
            // Fetch user posts (supports both Firebase and localStorage)
            let userPosts;
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                // Use Firebase
                userPosts = await getUserPostsFirebase(userId);
            } else {
                // Use localStorage
                userPosts = posts.filter(p => p && p.userId === userId);
            }
            
            const totalLikes = userPosts.reduce((sum, p) => sum + (Number(p.likes) || 0), 0);

            // Get profile picture initial (use stored initial or first letter of name)
            const profileInitial = fullUser.profileInitial || fullUser.name.charAt(0).toUpperCase();

            // Bio section
            const bio = fullUser.bio || '';
            let bioSection = '';
            if (isOwnProfile) {
                bioSection = `
                    <div class="profile-section">
                        <div class="profile-section-title">Bio</div>
                        <textarea id="profileBioTextarea" class="profile-bio-textarea" placeholder="Tell us about yourself...">${escapeHtml(bio)}</textarea>
                        <button class="save-bio-button" id="saveBioButton">Save Bio</button>
                    </div>
                `;
            } else {
                bioSection = `
                    <div class="profile-section">
                        <div class="profile-section-title">Bio</div>
                        <div class="profile-bio">${bio ? escapeHtml(bio) : '<span style="opacity: 0.5;">No bio yet</span>'}</div>
                    </div>
                `;
            }

            // About section
            let aboutSection = '';
            if (isOwnProfile) {
                // Editable fields for own profile
                const dobValue = fullUser.dob || '';
                const genderValue = fullUser.gender || '';
                const emailValue = fullUser.email || currentUser.email || '';
                
                aboutSection = `
                    <div class="profile-section">
                        <div class="profile-section-title">About</div>
                        <div class="profile-about-item">
                            <span class="profile-about-label">Gender:</span>
                            <select id="profileGenderSelect" class="profile-about-select">
                                <option value="">Select...</option>
                                <option value="Male" ${genderValue === 'Male' ? 'selected' : ''}>Male</option>
                                <option value="Female" ${genderValue === 'Female' ? 'selected' : ''}>Female</option>
                                <option value="Other" ${genderValue === 'Other' ? 'selected' : ''}>Other</option>
                                <option value="Prefer not to say" ${genderValue === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                            </select>
                        </div>
                        <div class="profile-about-item">
                            <span class="profile-about-label">Date of Birth:</span>
                            <input type="date" id="profileDobInput" class="profile-about-input" value="${dobValue}">
                        </div>
                        <div class="profile-about-item">
                            <span class="profile-about-label">Email:</span>
                            <span class="profile-about-value">${escapeHtml(emailValue)}</span>
                        </div>
                        <button class="save-bio-button" id="saveAboutButton" style="margin-top: 15px;">Save Changes</button>
                    </div>
                `;
            } else {
                // Read-only fields for other user's profile
                let dobDisplay = '';
                if (fullUser.dob) {
                    const dob = new Date(fullUser.dob);
                    dobDisplay = dob.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                } else {
                    dobDisplay = 'Not provided';
                }
                
                const genderDisplay = fullUser.gender || 'Not provided';
                const emailDisplay = fullUser.email || currentUser.email || 'Not provided';
                
                aboutSection = `
                    <div class="profile-section">
                        <div class="profile-section-title">About</div>
                        <div class="profile-about-item">
                            <span class="profile-about-label">Gender:</span>
                            <span class="profile-about-value">${escapeHtml(genderDisplay)}</span>
                        </div>
                        <div class="profile-about-item">
                            <span class="profile-about-label">Date of Birth:</span>
                            <span class="profile-about-value">${escapeHtml(dobDisplay)}</span>
                        </div>
                        <div class="profile-about-item">
                            <span class="profile-about-label">Email:</span>
                            <span class="profile-about-value">${escapeHtml(emailDisplay)}</span>
                        </div>
                    </div>
                `;
            }

            // Change profile picture button (only for own profile)
            const changePicButton = isOwnProfile ? `
                <button class="change-pic-button" id="changePicButton">Change Profile Picture</button>
            ` : '';

            document.getElementById('profileContent').innerHTML = `
                <div class="profile-pic-large" id="profilePicLarge">${profileInitial}</div>
                ${changePicButton}
                <div class="profile-name">${escapeHtml(fullUser.name)}</div>
                <div class="profile-email">${escapeHtml(fullUser.email || currentUser.email || '')}</div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <div class="stat-value">${userPosts.length}</div>
                        <div class="stat-label">Posts</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalLikes}</div>
                        <div class="stat-label">Likes</div>
                    </div>
                </div>
                ${bioSection}
                ${aboutSection}
                ${renderUserPostsInProfile(userPosts, fullUser.id)}
            `;
            
            // Attach event listeners for editable fields
            if (isOwnProfile) {
                // Save bio button
                const saveBioButton = document.getElementById('saveBioButton');
                if (saveBioButton) {
                    saveBioButton.addEventListener('click', saveBio);
                }

                // Save about button
                const saveAboutButton = document.getElementById('saveAboutButton');
                if (saveAboutButton) {
                    saveAboutButton.addEventListener('click', saveAbout);
                }

                // Change profile picture button
                const changePicButtonEl = document.getElementById('changePicButton');
                if (changePicButtonEl) {
                    changePicButtonEl.addEventListener('click', changeProfilePicture);
                }
            }
            
            profileModal.classList.add('active');
        }

        function closeProfileModalFunc() {
            profileModal.classList.remove('active');
        }

        // Save bio function - supports Firebase and localStorage
        async function saveBio() {
            const bioTextarea = document.getElementById('profileBioTextarea');
            if (!bioTextarea) return;

            const bio = bioTextarea.value.trim();
            
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && firebase.firestore) {
                try {
                    const db = firebase.firestore();
                    const user = firebase.auth().currentUser;
                    await db.collection('users').doc(user.uid).update({ bio: bio });
                } catch (error) {
                    console.error('Error saving bio to Firestore:', error);
                    // Fallback to localStorage
                }
            }
            
            // Update user data in localStorage (always update as fallback)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex !== -1) {
                users[userIndex].bio = bio;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // Update currentUser in localStorage
            const updatedCurrentUser = { ...currentUser, bio: bio };
            localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            
            // Show success feedback
            const saveButton = document.getElementById('saveBioButton');
            if (saveButton) {
                const originalText = saveButton.textContent;
                saveButton.textContent = 'Saved!';
                saveButton.style.background = 'var(--button-hover)';
                setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.style.background = '';
                }, 1500);
            }
        }

        // Save about section (gender, DOB) - supports Firebase and localStorage
        async function saveAbout() {
            const genderSelect = document.getElementById('profileGenderSelect');
            const dobInput = document.getElementById('profileDobInput');
            
            if (!genderSelect || !dobInput) return;

            const gender = genderSelect.value;
            const dob = dobInput.value;
            
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && firebase.firestore) {
                try {
                    const db = firebase.firestore();
                    const user = firebase.auth().currentUser;
                    const updateData = {};
                    if (gender) updateData.gender = gender;
                    if (dob) updateData.dob = dob;
                    
                    await db.collection('users').doc(user.uid).update(updateData);
                } catch (error) {
                    console.error('Error saving to Firestore:', error);
                    // Fallback to localStorage
                }
            }
            
            // Update user data in localStorage (always update as fallback)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex !== -1) {
                if (gender) users[userIndex].gender = gender;
                if (dob) users[userIndex].dob = dob;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // Update currentUser in localStorage
            const updatedCurrentUser = { ...currentUser };
            if (gender) updatedCurrentUser.gender = gender;
            if (dob) updatedCurrentUser.dob = dob;
            localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            
            // Show success feedback
            const saveButton = document.getElementById('saveAboutButton');
            if (saveButton) {
                const originalText = saveButton.textContent;
                saveButton.textContent = 'Saved!';
                saveButton.style.background = 'var(--button-hover)';
                setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.style.background = '';
                }, 1500);
            }
        }

        // Change profile picture function (updates initial)
        function changeProfilePicture() {
            const newInitial = prompt('Enter a new initial (single character):');
            if (!newInitial || newInitial.length !== 1) {
                if (newInitial !== null) {
                    alert('Please enter exactly one character.');
                }
                return;
            }

            const profileInitial = newInitial.toUpperCase();
            
            // Update user data in localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex !== -1) {
                users[userIndex].profileInitial = profileInitial;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // Update currentUser in localStorage
            const updatedCurrentUser = { ...currentUser, profileInitial: profileInitial };
            localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            
            // Update the profile picture display
            const profilePicLarge = document.getElementById('profilePicLarge');
            if (profilePicLarge) {
                profilePicLarge.textContent = profileInitial;
            }
        }

        function openSettingsModal() {
            settingsModal.classList.add('active');
        }

        function closeSettingsModalFunc() {
            settingsModal.classList.remove('active');
        }

        // Helper function to clear current user and redirect to login
        function logout() {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }

        // Helper function to switch account (same as logout but semantically different)
        function switchAccount() {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }

        // Attach event listeners to both desktop and mobile buttons
        if (profileButton) profileButton.addEventListener('click', openProfileModal);
        if (settingsButton) settingsButton.addEventListener('click', openSettingsModal);
        if (profileButtonMobile) profileButtonMobile.addEventListener('click', openProfileModal);
        if (settingsButtonMobile) settingsButtonMobile.addEventListener('click', openSettingsModal);
        if (closeProfileModal) closeProfileModal.addEventListener('click', closeProfileModalFunc);
        if (closeSettingsModal) closeSettingsModal.addEventListener('click', closeSettingsModalFunc);

        // Logout and Switch Account buttons
        const logoutButton = document.getElementById('logoutButton');
        const switchAccountButton = document.getElementById('switchAccountButton');
        if (logoutButton) logoutButton.addEventListener('click', logout);
        if (switchAccountButton) switchAccountButton.addEventListener('click', switchAccount);

        // Close modals when clicking outside
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closeProfileModalFunc();
            }
        });

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModalFunc();
            }
        });

        // Utility Functions
        function getTimeAgo(date) {
            const now = new Date();
            const diff = now - date;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            return 'Just now';
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
