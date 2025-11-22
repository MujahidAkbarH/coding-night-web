        // Theme Toggle Functionality (only in settings modal)
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

        const currentUser = getCurrentUser();

        // Get full user data from users array
        function getFullUserData() {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            return users.find(u => u.id === currentUser.id) || currentUser;
        }

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
            // Fallback to localStorage - fetch any user by userId
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === userId);
            if (user) {
                return user;
            }
            // If not found in users array, try to get from currentUser if it matches
            if (currentUser && currentUser.id === userId) {
                return currentUser;
            }
            return null;
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
            loadPosts();
            return posts.filter(p => p && p.userId === userId);
        }

        // Update teaser profile pic
        const teaserProfilePic = document.getElementById('teaserProfilePic');
        if (teaserProfilePic && currentUser) {
            const profileInitial = currentUser.profileInitial || currentUser.name.charAt(0).toUpperCase();
            teaserProfilePic.textContent = profileInitial;
        }

        // Create Post Card - Redirect to create-post.html
        const createPostCard = document.getElementById('createPostCard');
        if (createPostCard) {
            createPostCard.addEventListener('click', () => {
                window.location.href = 'create-post.html';
            });
        }

        // Posts data structure
        let posts = [];

        /**
         * Load Posts from LocalStorage
         * Fetches all posts from localStorage and ensures they are valid
         * This function is called before any rendering or sorting
         */
        function loadPosts() {
            try {
                // Parse posts from localStorage
                const storedPosts = localStorage.getItem('posts');
                posts = storedPosts ? JSON.parse(storedPosts) : [];
                
                // Ensure posts is an array
                if (!Array.isArray(posts)) {
                    posts = [];
                }
                
                // Validate and clean posts array - remove any invalid entries
                posts = posts.filter(post => {
                    // Ensure each post is a valid object with required fields
                    return post && 
                           typeof post === 'object' && 
                           post.id && 
                           post.timestamp && 
                           post.userId && 
                           post.username;
                });
                
                // Initialize posts with sample data if empty
                if (posts.length === 0 && currentUser) {
                    posts = [
                        {
                            id: Date.now().toString(),
                            userId: currentUser.id,
                            username: currentUser.name,
                            text: 'Welcome to Social Connect! Share your thoughts and connect with others.',
                            imageUrl: '',
                            timestamp: new Date().toISOString(),
                            likes: 0,
                            likedBy: []
                        }
                    ];
                    localStorage.setItem('posts', JSON.stringify(posts));
                }
                
                // Ensure all posts have required properties with defaults
                posts = posts.map(post => ({
                    ...post,
                    likes: typeof post.likes === 'number' ? post.likes : 0,
                    likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
                    imageUrl: post.imageUrl || '',
                    text: post.text || '',
                    comments: Array.isArray(post.comments) ? post.comments : []
                }));
                
            } catch (error) {
                console.error('Error loading posts:', error);
                posts = [];
            }
        }

        /**
         * Initialize and Load Posts on Page Load
         * This ensures posts are fetched from localStorage immediately when the page loads
         * This is critical for displaying posts redirected from the Create Post page
         */
        // Load posts from localStorage on page load
        loadPosts();

        /**
         * Render Posts Function
         * Fetches posts from localStorage and dynamically renders them to the feed
         * 
         * @param {Array|null} filteredPosts - Optional filtered posts array. If null, uses all posts.
         */
        /**
         * Render Posts and User Cards Function
         * Renders both posts and user cards (for search results)
         * 
         * @param {Array} postsToRender - Array of posts to render
         * @param {Array} usersToRender - Array of users to render as cards
         */
        function renderPostsAndUsers(postsToRender = null, usersToRender = []) {
            const postsContainer = document.getElementById('posts-container');
            if (!postsContainer) {
                console.error('Posts container not found');
                return;
            }
            
            // Clear container first
            postsContainer.innerHTML = '';
            
            // Show empty state if no posts and no users
            if ((!postsToRender || postsToRender.length === 0) && (!usersToRender || usersToRender.length === 0)) {
                postsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">No posts or users found</div>
                    </div>
                `;
                return;
            }
            
            // Render posts first (don't clear container since we already cleared it)
            if (postsToRender && postsToRender.length > 0) {
                renderPostsToContainer(postsToRender, postsContainer, false);
            }
            
            // Render user cards after posts
            if (usersToRender && usersToRender.length > 0) {
                usersToRender.forEach(user => {
                    const userCard = renderUserCard(user);
                    if (userCard) {
                        postsContainer.appendChild(userCard);
                    }
                });
            }
        }

        /**
         * Render Posts To Container Function
         * Renders posts to a specific container (used by renderPostsAndUsers)
         * 
         * @param {Array} postsToRender - Array of posts to render
         * @param {HTMLElement} container - Container to render to
         * @param {boolean} clearContainer - Whether to clear container first
         */
        function renderPostsToContainer(postsToRender, container, clearContainer = true) {
            if (clearContainer) {
                container.innerHTML = '';
            }
            
            if (!postsToRender || postsToRender.length === 0) {
                if (clearContainer) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-text">No posts found</div>
                        </div>
                    `;
                }
                return;
            }
            
            // Validate posts
            const validPosts = postsToRender.filter(post => {
                return post && 
                       typeof post === 'object' && 
                       post.id && 
                       post.timestamp && 
                       post.userId && 
                       post.username;
            });
            
            if (validPosts.length === 0) {
                if (clearContainer) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-text">No valid posts found</div>
                        </div>
                    `;
                }
                return;
            }
            
            // Render each post
            validPosts.forEach((post) => {
                const isOwnPost = post.userId === currentUser.id;
                const isLiked = post.likedBy && post.likedBy.includes(currentUser.id);
                const date = new Date(post.timestamp);
                const timeAgo = getTimeAgo(date);
                const postProfileInitial = post.profileInitial || post.username.charAt(0).toUpperCase();
                
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                postCard.setAttribute('data-post-id', post.id);
                
                postCard.innerHTML = `
                    <div class="post-header">
                        <div class="profile-pic profile-pic-clickable" data-user-id="${post.userId}" data-username="${escapeHtml(post.username)}" title="View ${escapeHtml(post.username)}'s profile">
                            ${postProfileInitial}
                        </div>
                        <div class="post-user-info">
                            <div class="post-username">${escapeHtml(post.username)}</div>
                            <div class="post-timestamp">${timeAgo}</div>
                        </div>
                    </div>
                    <div class="post-content">${escapeHtml(post.text)}</div>
                    ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
                    <div class="post-actions">
                        <button class="action-button like-button ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                            ❤️ <span>${post.likes || 0}</span>
                        </button>
                        ${isOwnPost ? `<button class="action-button delete delete-button" data-post-id="${post.id}">🗑️ Delete</button>` : ''}
                    </div>
                    <div class="comments-section" data-post-id="${post.id}">
                        <div class="comments-title">Comments</div>
                        <div class="comment-input-container">
                            <input type="text" class="comment-input" placeholder="Write a comment..." data-post-id="${post.id}">
                            <button class="comment-post-button" data-post-id="${post.id}">Post</button>
                        </div>
                        <div class="comments-list" id="comments-list-${post.id}">
                            ${renderComments(post.comments || [])}
                        </div>
                    </div>
                `;
                
                container.appendChild(postCard);
            });
        }

        /**
         * Render User Card Function
         * Creates a user card element for search results
         * 
         * @param {Object} user - User object to render
         * @returns {HTMLElement} User card element
         */
        function renderUserCard(user) {
            if (!user || !user.id) return null;
            
            // Get user's post count
            const userPosts = posts.filter(p => p && p.userId === user.id);
            const postCount = userPosts.length;
            
            // Get profile initial
            const userName = user.name || user.username || 'User';
            const profileInitial = user.profileInitial || userName.charAt(0).toUpperCase();
            
            // Create user card element
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.setAttribute('data-user-id', user.id);
            
            userCard.innerHTML = `
                <div class="user-card-header">
                    <div class="user-card-pic">${profileInitial}</div>
                    <div class="user-card-info">
                        <div class="user-card-name">${escapeHtml(userName)}</div>
                        <div class="user-card-stats">${postCount} ${postCount === 1 ? 'post' : 'posts'}</div>
                    </div>
                </div>
                ${postCount === 0 ? '<div class="user-card-message">This user has not made any post yet</div>' : ''}
            `;
            
            // Add click event to open profile modal
            userCard.addEventListener('click', () => {
                openProfileModalForUser(user.id);
            });
            
            return userCard;
        }

        /**
         * Render Posts Function
         * Dynamically creates HTML elements for each post and appends to container
         * NEVER modifies the posts array - only renders what is passed in
         * 
         * @param {Array} postsToRender - Array of posts to render (already sorted/filtered)
         */
        function renderPosts(postsToRender = null) {
            // Step 1: Get the posts container element by ID
            const postsContainer = document.getElementById('posts-container');
            
            // Check if container exists
            if (!postsContainer) {
                console.error('Posts container not found');
                return;
            }
            
            // Step 2: Determine which posts to render
            // If postsToRender is provided, use it; otherwise use all posts
            let postsArray = postsToRender;
            if (postsArray === null || postsArray === undefined) {
                // Fallback: load and use all posts
                loadPosts();
                postsArray = posts;
            }
            
            // Step 3: Ensure postsArray is an array
            if (!Array.isArray(postsArray)) {
                console.error('Posts to render is not an array:', typeof postsArray);
                postsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-text">Error loading posts</div>
                    </div>
                `;
                return;
            }
            
            // Step 4: Clear the container before rendering to avoid duplicate posts
            // This ensures fresh rendering every time, preventing duplicates
            postsContainer.innerHTML = '';
            
            // Step 5: Handle empty state - show message if no posts exist
            if (postsArray.length === 0) {
                postsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">No posts found</div>
                    </div>
                `;
                return;
            }
            
            // Step 6: Validate each post before rendering
            // Filter out any invalid posts
            const validPosts = postsArray.filter(post => {
                return post && 
                       typeof post === 'object' && 
                       post.id && 
                       post.timestamp && 
                       post.userId && 
                       post.username;
            });
            
            // If all posts were invalid, show empty state
            if (validPosts.length === 0) {
                postsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">No valid posts found</div>
                    </div>
                `;
                return;
            }
            
            // Step 7: Dynamically create HTML elements for each post
            // Posts are already sorted/filtered - do NOT re-sort here
            validPosts.forEach((post) => {
                // Check if current user owns this post (for delete button)
                const isOwnPost = post.userId === currentUser.id;
                
                // Check if current user has liked this post
                const isLiked = post.likedBy && post.likedBy.includes(currentUser.id);
                
                // Calculate relative time (e.g., "5 minutes ago")
                const date = new Date(post.timestamp);
                const timeAgo = getTimeAgo(date);
                
                // Step 7: Create post card element using ES6+ template literals
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                postCard.setAttribute('data-post-id', post.id);
                
                // Get profile initial (use stored initial if available)
                const postProfileInitial = post.profileInitial || post.username.charAt(0).toUpperCase();
                
                // Build the HTML content for the post card
                postCard.innerHTML = `
                    <div class="post-header">
                        <div class="profile-pic profile-pic-clickable" data-user-id="${post.userId}" data-username="${escapeHtml(post.username)}" title="View ${escapeHtml(post.username)}'s profile">
                            ${postProfileInitial}
                        </div>
                        <div class="post-user-info">
                            <div class="post-username">${escapeHtml(post.username)}</div>
                            <div class="post-timestamp">${timeAgo}</div>
                        </div>
                    </div>
                    <div class="post-content">${escapeHtml(post.text)}</div>
                    ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
                    <div class="post-actions">
                        <button class="action-button like-button ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                            ❤️ <span>${post.likes || 0}</span>
                        </button>
                        ${isOwnPost ? `<button class="action-button delete delete-button" data-post-id="${post.id}">🗑️ Delete</button>` : ''}
                    </div>
                    <div class="comments-section" data-post-id="${post.id}">
                        <div class="comments-title">Comments</div>
                        <div class="comment-input-container">
                            <input type="text" class="comment-input" placeholder="Write a comment..." data-post-id="${post.id}">
                            <button class="comment-post-button" data-post-id="${post.id}">Post</button>
                        </div>
                        <div class="comments-list" id="comments-list-${post.id}">
                            ${renderComments(post.comments || [])}
                        </div>
                    </div>
                `;
                
                // Step 8: Append the post card to the container
                postsContainer.appendChild(postCard);
            });
            
            // Step 9: Event listeners are attached via event delegation (see initialization below)
            // This is more efficient and handles dynamically added posts
        }

        /**
         * Render Comments Function
         * Renders comments for a post
         * 
         * @param {Array} comments - Array of comment objects
         * @returns {string} HTML string for comments
         */
        function renderComments(comments) {
            if (!comments || comments.length === 0) {
                return '<div class="comments-empty">No comments yet</div>';
            }
            
            return comments.map(comment => {
                const commentInitial = (comment.username || 'U').charAt(0).toUpperCase();
                const commentTime = getTimeAgo(new Date(comment.timestamp));
                
                return `
                    <div class="comment-item">
                        <div class="comment-pic">${commentInitial}</div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-username">${escapeHtml(comment.username || 'Unknown')}</span>
                                <span class="comment-time">${commentTime}</span>
                            </div>
                            <div class="comment-text">${escapeHtml(comment.text || '')}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        /**
         * Initialize Event Delegation for Post Actions
         * Sets up event delegation to handle clicks on dynamically created buttons
         * This is more efficient than attaching listeners to each button individually
         * Event delegation works for all posts, including newly added ones
         */
        function initializeEventDelegation() {
            const postsContainer = document.getElementById('posts-container');
            
            // Check if container exists before adding listener
            if (!postsContainer) {
                console.error('Posts container not found');
                return;
            }
            
            // Use event delegation to handle all post actions (like, delete, profile pic, comments)
            // This works for dynamically added posts without re-attaching listeners
            // The event bubbles up from the clicked element to the container
            postsContainer.addEventListener('click', (e) => {
                // Handle profile pic clicks
                if (e.target.closest('.profile-pic-clickable')) {
                    const profilePic = e.target.closest('.profile-pic-clickable');
                    const userId = profilePic.dataset.userId;
                    if (userId) {
                        openProfileModalForUser(userId);
                    }
                }
                
                // Handle like button clicks
                // closest() finds the nearest ancestor with the class, or the element itself
                if (e.target.closest('.like-button')) {
                    const button = e.target.closest('.like-button');
                    const postId = button.dataset.postId;
                    if (postId) {
                        toggleLike(postId);
                    }
                }
                
                // Handle delete button clicks
                if (e.target.closest('.delete-button')) {
                    const button = e.target.closest('.delete-button');
                    const postId = button.dataset.postId;
                    if (postId) {
                        handleDeletePost(postId);
                    }
                }
                
                // Handle comment post button clicks
                if (e.target.closest('.comment-post-button')) {
                    const button = e.target.closest('.comment-post-button');
                    const postId = button.dataset.postId;
                    if (postId) {
                        handleAddComment(postId);
                    }
                }
            });
            
            // Handle Enter key in comment inputs
            postsContainer.addEventListener('keypress', (e) => {
                if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
                    const postId = e.target.dataset.postId;
                    if (postId) {
                        handleAddComment(postId);
                    }
                }
            });
        }
        
        // Initialize event delegation once when script loads
        // This ensures it's set up before any posts are rendered
        initializeEventDelegation();

        /**
         * Toggle Like Function
         * Toggles the like status of a post and maintains sort/filter state
         * 
         * @param {string} postId - The unique ID of the post to like/unlike
         */
        /**
         * Toggle Like Function
         * Toggles the like status of a post and maintains sort/filter state
         * Updates like count immediately and affects sorting by most liked
         * 
         * @param {string} postId - The unique ID of the post to like/unlike
         */
        function toggleLike(postId) {
            try {
                // Step 1: Reload posts to ensure we have the latest data
                loadPosts();
                
                // Step 2: Validate posts array
                if (!Array.isArray(posts)) {
                    console.error('Posts is not an array');
                    return;
                }
                
                // Step 3: Find the post in the array
                const post = posts.find(p => p && p.id === postId);
                if (!post) {
                    console.warn('Post not found:', postId);
                    return;
                }

                // Step 4: Initialize likedBy array if it doesn't exist
                if (!Array.isArray(post.likedBy)) {
                    post.likedBy = [];
                }
                
                // Step 5: Initialize likes count if it doesn't exist
                if (typeof post.likes !== 'number') {
                    post.likes = 0;
                }

                // Step 6: Toggle like status
                const index = post.likedBy.indexOf(currentUser.id);
                if (index > -1) {
                    // Unlike: remove user from likedBy array
                    post.likedBy.splice(index, 1);
                    post.likes = Math.max(0, post.likes - 1);
                } else {
                    // Like: add user to likedBy array
                    post.likedBy.push(currentUser.id);
                    post.likes = post.likes + 1;
                }

                // Step 7: Update the post in the posts array
                const postIndex = posts.findIndex(p => p && p.id === postId);
                if (postIndex !== -1) {
                    posts[postIndex] = post;
                }

                // Step 8: Update localStorage with the updated posts
                localStorage.setItem('posts', JSON.stringify(posts));
                
                // Step 9: Re-render with current sort and filter applied
                // This maintains sort/filter state after liking
                // If sorting by "most liked", the post will automatically move to correct position
                // sortAndRenderPosts() will reload posts, apply filter, and re-sort
                sortAndRenderPosts();
                
            } catch (error) {
                console.error('Error in toggleLike:', error);
            }
        }

        /**
         * Delete Post Function
         * Removes a post from localStorage and immediately removes it from the DOM
         * Maintains current sort and filter state after deletion
         * 
         * @param {string} postId - The unique ID of the post to delete
         */
        /**
         * Delete Post Function
         * Removes a post from localStorage and immediately removes it from the DOM
         * Maintains current sort and filter state after deletion
         * Delete buttons continue to work after sorting/filtering due to event delegation
         * 
         * @param {string} postId - The unique ID of the post to delete
         */
        function deletePost(postId) {
            try {
                // Step 1: Reload posts from localStorage to ensure we have the latest data
                loadPosts();
                
                // Step 2: Validate posts array
                if (!Array.isArray(posts)) {
                    console.error('Posts is not an array');
                    return;
                }
                
                // Step 3: Find the post in the array
                const postIndex = posts.findIndex(p => p && p.id === postId);
                
                // Step 4: If post exists, remove it from the array
                if (postIndex !== -1) {
                    // Remove post from array using ES6+ filter method
                    // Keep all posts where id does NOT match the postId to delete
                    posts = posts.filter(p => p && p.id !== postId);
                    
                    // Step 5: Update localStorage with the modified posts array
                    localStorage.setItem('posts', JSON.stringify(posts));
                    
                    // Step 6: Immediately remove the post from the DOM
                    // Find the post card element by data attribute
                    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
                    if (postCard) {
                        // Add fade-out animation before removing
                        postCard.style.transition = 'opacity 0.3s ease';
                        postCard.style.opacity = '0';
                        
                        // Remove from DOM after animation
                        setTimeout(() => {
                            postCard.remove();
                            
                            // Step 7: Re-render posts with current sort and filter applied
                            // This ensures sorting/filtering state is maintained after deletion
                            // Delete buttons will continue to work because of event delegation
                            sortAndRenderPosts();
                        }, 300);
                    } else {
                        // If DOM element not found, just re-render with sort/filter
                        sortAndRenderPosts();
                    }
                } else {
                    console.warn('Post not found for deletion:', postId);
                    // Still re-render to ensure display is correct
                    sortAndRenderPosts();
                }
            } catch (error) {
                console.error('Error in deletePost:', error);
                // Fallback: reload and re-render
                loadPosts();
                sortAndRenderPosts();
            }
        }
        
        /**
         * Handle Delete Post with Confirmation
         * Shows confirmation dialog before deleting
         * 
         * @param {string} postId - The unique ID of the post to delete
         */
        function handleDeletePost(postId) {
            // Show confirmation dialog
            if (confirm('Are you sure you want to delete this post?')) {
                deletePost(postId);
            }
        }

        /**
         * Handle Add Comment Function
         * Adds a comment to a post and updates the UI
         * 
         * @param {string} postId - The unique ID of the post to comment on
         */
        async function handleAddComment(postId) {
            try {
                // Get comment input
                const commentInput = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
                if (!commentInput) return;
                
                const commentText = commentInput.value.trim();
                if (!commentText) return;
                
                // Disable button during submission
                const commentButton = document.querySelector(`.comment-post-button[data-post-id="${postId}"]`);
                if (commentButton) {
                    commentButton.disabled = true;
                    commentButton.textContent = 'Posting...';
                }
                
                // Reload posts to ensure we have the latest data
                loadPosts();
                
                // Find the post
                const postIndex = posts.findIndex(p => p && p.id === postId);
                if (postIndex === -1) {
                    console.error('Post not found');
                    return;
                }
                
                const post = posts[postIndex];
                
                // Initialize comments array if it doesn't exist
                if (!Array.isArray(post.comments)) {
                    post.comments = [];
                }
                
                // Create new comment
                const newComment = {
                    id: Date.now().toString(),
                    userId: currentUser.id,
                    username: currentUser.name || currentUser.username || 'Unknown',
                    text: commentText,
                    timestamp: new Date().toISOString()
                };
                
                // Add comment to post
                post.comments.push(newComment);
                posts[postIndex] = post;
                
                // Save to Firebase if available
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    try {
                        const db = firebase.firestore();
                        await db.collection('posts').doc(postId).update({
                            comments: firebase.firestore.FieldValue.arrayUnion(newComment)
                        });
                    } catch (error) {
                        console.error('Error saving comment to Firestore:', error);
                    }
                }
                
                // Save to localStorage
                localStorage.setItem('posts', JSON.stringify(posts));
                
                // Update UI - add comment to the list
                const commentsList = document.getElementById(`comments-list-${postId}`);
                if (commentsList) {
                    const commentHTML = `
                        <div class="comment-item">
                            <div class="comment-pic">${(currentUser.name || currentUser.username || 'U').charAt(0).toUpperCase()}</div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-username">${escapeHtml(currentUser.name || currentUser.username || 'Unknown')}</span>
                                    <span class="comment-time">Just now</span>
                                </div>
                                <div class="comment-text">${escapeHtml(commentText)}</div>
                            </div>
                        </div>
                    `;
                    
                    // Remove empty state if exists
                    const emptyState = commentsList.querySelector('.comments-empty');
                    if (emptyState) {
                        emptyState.remove();
                    }
                    
                    commentsList.insertAdjacentHTML('beforeend', commentHTML);
                }
                
                // Clear input
                commentInput.value = '';
                
                // Re-enable button
                if (commentButton) {
                    commentButton.disabled = false;
                    commentButton.textContent = 'Post';
                }
                
            } catch (error) {
                console.error('Error adding comment:', error);
                // Re-enable button on error
                const commentButton = document.querySelector(`.comment-post-button[data-post-id="${postId}"]`);
                if (commentButton) {
                    commentButton.disabled = false;
                    commentButton.textContent = 'Post';
                }
            }
        }

        /**
         * Sorting and Filtering State Management
         * Tracks current sort order and filter keyword
         */
        let currentSort = 'latest'; // Default: newest to oldest
        let currentFilterKeyword = ''; // Current keyword filter
        
        /**
         * Initialize Sorting Buttons
         * Attaches event listeners to sort buttons using ES6+ syntax
         * Ensures buttons are initialized after DOM is ready
         */
        function initializeSortButtons() {
            const sortButtons = document.querySelectorAll('.sort-button');
            
            // Check if sort buttons exist
            if (sortButtons.length === 0) {
                console.warn('Sort buttons not found');
                return;
            }
            
            // Attach event listeners to sort buttons
            sortButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Remove active class from all buttons
                    sortButtons.forEach(b => b.classList.remove('active'));
                    
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    // Update current sort order from data attribute
                    const sortType = button.getAttribute('data-sort');
                    if (sortType && ['latest', 'oldest', 'liked'].includes(sortType)) {
                        currentSort = sortType;
                        
                        // Re-render posts with new sort order
                        // This updates the display immediately without page reload
                        // sortAndRenderPosts() will:
                        // 1. Load posts from localStorage
                        // 2. Apply filter (if any)
                        // 3. Apply sort order
                        // 4. Render to DOM
                        sortAndRenderPosts();
                    } else {
                        console.warn('Invalid sort type:', sortType);
                        // Default to latest if invalid
                        currentSort = 'latest';
                        sortAndRenderPosts();
                    }
                });
            });
        }
        
        // Initialize sort buttons when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeSortButtons);
        } else {
            // DOM is already loaded
            initializeSortButtons();
        }
        
        /**
         * Sort and Render Posts Function
         * Applies current sort order and filter, then renders posts
         * Updates displayed posts immediately without page reload
         */
        /**
         * Sort and Render Posts Function
         * Applies current sort order and filter, then renders posts
         * Updates displayed posts immediately without page reload
         * Handles all edge cases to prevent posts from disappearing
         */
        /**
         * Sort and Render Posts Function
         * Applies current sort order and filter, then renders posts
         * NEVER loses or hides posts - ensures all valid posts are displayed
         * 
         * This function:
         * 1. Loads posts from localStorage
         * 2. Applies filter (if any)
         * 3. Applies sort order
         * 4. Renders posts to DOM
         */
        function sortAndRenderPosts() {
            try {
                // Step 1: Reload posts from localStorage to ensure we have the latest data
                // This is critical for showing updated like counts
                loadPosts();
                
                // Step 2: Validate posts array - ensure it's an array with valid posts
                if (!Array.isArray(posts)) {
                    console.error('Posts is not an array, resetting to empty array');
                    posts = [];
                }
                
                // Step 3: Start with all posts (create a copy to avoid mutating original)
                // Filter out any invalid posts before processing
                let postsToDisplay = posts.filter(post => {
                    return post && 
                           typeof post === 'object' && 
                           post.id && 
                           post.timestamp;
                });
                
                // Step 4: Apply keyword filter if one is set
                let matchingUsers = [];
                if (currentFilterKeyword && typeof currentFilterKeyword === 'string' && currentFilterKeyword.trim() !== '') {
                    const keyword = currentFilterKeyword.toLowerCase().trim();
                    
                    // Filter posts by post text and username
                    postsToDisplay = postsToDisplay.filter(post => {
                        // Ensure post is valid object
                        if (!post || typeof post !== 'object') {
                            return false;
                        }
                        
                        // Filter by post text, username, or any other searchable field
                        const postText = (post.text || '').toLowerCase();
                        const username = (post.username || '').toLowerCase();
                        
                        // Return true if keyword matches any searchable field
                        return postText.includes(keyword) || username.includes(keyword);
                    });
                    
                    // Also search for users by name
                    try {
                        const users = JSON.parse(localStorage.getItem('users') || '[]');
                        matchingUsers = users.filter(user => {
                            if (!user || typeof user !== 'object') return false;
                            const userName = (user.name || user.username || '').toLowerCase();
                            return userName.includes(keyword);
                        });
                        
                        // Remove users that already have matching posts (to avoid duplicates)
                        const usersWithPosts = new Set(postsToDisplay.map(p => p.userId));
                        matchingUsers = matchingUsers.filter(user => !usersWithPosts.has(user.id));
                    } catch (error) {
                        console.error('Error searching users:', error);
                        matchingUsers = [];
                    }
                }
                
                // Step 5: Apply sorting based on current sort order
                // Ensure currentSort has a valid value (default to 'latest')
                const sortType = (currentSort && ['latest', 'oldest', 'liked'].includes(currentSort)) ? currentSort : 'latest';
                
                // Sort the posts array
                postsToDisplay.sort((a, b) => {
                    switch (sortType) {
                        case 'latest':
                            // Sort by date: newest to oldest (DESC)
                            const dateA_latest = new Date(a.timestamp);
                            const dateB_latest = new Date(b.timestamp);
                            // If dates are invalid, put them at the end
                            if (isNaN(dateA_latest.getTime()) && isNaN(dateB_latest.getTime())) return 0;
                            if (isNaN(dateA_latest.getTime())) return 1;
                            if (isNaN(dateB_latest.getTime())) return -1;
                            return dateB_latest.getTime() - dateA_latest.getTime(); // DESC (newest first)
                            
                        case 'oldest':
                            // Sort by date: oldest to newest (ASC)
                            const dateA_oldest = new Date(a.timestamp);
                            const dateB_oldest = new Date(b.timestamp);
                            // If dates are invalid, put them at the end
                            if (isNaN(dateA_oldest.getTime()) && isNaN(dateB_oldest.getTime())) return 0;
                            if (isNaN(dateA_oldest.getTime())) return 1;
                            if (isNaN(dateB_oldest.getTime())) return -1;
                            return dateA_oldest.getTime() - dateB_oldest.getTime(); // ASC (oldest first)
                            
                        case 'liked':
                            // Sort by number of likes: most liked first (DESC)
                            const likesA = Number(a.likes) || 0;
                            const likesB = Number(b.likes) || 0;
                            
                            // If likes are equal, use date as secondary sort (newest first)
                            if (likesB === likesA) {
                                const dateA_liked = new Date(a.timestamp);
                                const dateB_liked = new Date(b.timestamp);
                                if (isNaN(dateA_liked.getTime()) && isNaN(dateB_liked.getTime())) return 0;
                                if (isNaN(dateA_liked.getTime())) return 1;
                                if (isNaN(dateB_liked.getTime())) return -1;
                                return dateB_liked.getTime() - dateA_liked.getTime(); // Secondary: newest first
                            }
                            
                            return likesB - likesA; // DESC (most liked first)
                            
                        default:
                            // Default to latest
                            const dateA_default = new Date(a.timestamp);
                            const dateB_default = new Date(b.timestamp);
                            if (isNaN(dateA_default.getTime()) && isNaN(dateB_default.getTime())) return 0;
                            if (isNaN(dateA_default.getTime())) return 1;
                            if (isNaN(dateB_default.getTime())) return -1;
                            return dateB_default.getTime() - dateA_default.getTime();
                    }
                });
                
                // Step 6: Render the sorted and filtered posts and user cards
                // This updates the display immediately without page reload
                // postsToDisplay is guaranteed to be an array (may be empty, but still an array)
                renderPostsAndUsers(postsToDisplay, matchingUsers);
                
            } catch (error) {
                console.error('Error in sortAndRenderPosts:', error);
                // Fallback: load and render all posts without sorting/filtering
                try {
                    loadPosts();
                    renderPosts(posts);
                } catch (fallbackError) {
                    console.error('Fallback render also failed:', fallbackError);
                    // Last resort: show empty state
                    const postsContainer = document.getElementById('posts-container');
                    if (postsContainer) {
                        postsContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon">⚠️</div>
                                <div class="empty-state-text">Error loading posts. Please refresh the page.</div>
                            </div>
                        `;
                    }
                }
            }
        }
        
        /**
         * Filter Posts by Keyword
         * Filters posts based on a search keyword and updates display immediately
         * 
         * @param {string} keyword - The keyword to filter posts by
         */
        function filterPostsByKeyword(keyword) {
            // Update current filter keyword
            currentFilterKeyword = keyword;
            
            // Re-render posts with filter applied
            sortAndRenderPosts();
        }

        /**
         * Search/Filter Functionality
         * Handles search input and filters posts by keyword
         * Updates displayed posts immediately without page reload
         * 
         * @param {string} query - The search query/keyword
         */
        /**
         * Search/Filter Functionality
         * Handles search input and filters posts by keyword
         * Updates displayed posts immediately without page reload
         * Works together with sorting
         * 
         * @param {string} query - The search query/keyword
         */
        function handleSearch(query) {
            try {
                // Step 1: Update the filter keyword
                // If query is empty, clear the filter
                if (!query || typeof query !== 'string' || query.trim() === '') {
                    currentFilterKeyword = '';
                } else {
                    // Store the original query (case-sensitive for display)
                    // Case-insensitive matching happens in sortAndRenderPosts
                    currentFilterKeyword = query.trim();
                }
                
                // Step 2: Re-render posts with filter and sort applied
                // This uses the unified sortAndRenderPosts function
                // Filtering and sorting work together
                sortAndRenderPosts();
                
            } catch (error) {
                console.error('Error in handleSearch:', error);
                // Fallback: clear filter and show all posts
                currentFilterKeyword = '';
                sortAndRenderPosts();
            }
        }

        /**
         * Initialize Search/Filter Inputs
         * Connects search inputs to filter functionality
         * Ensures real-time filtering as user types
         */
        function initializeSearchInputs() {
            const searchInput = document.getElementById('searchInput');
            const searchInputMobile = document.getElementById('searchInputMobile');
            
            // Initialize desktop search input
            if (searchInput) {
                // Attach input event listener for real-time filtering
                // Using 'once: false' ensures it works for multiple inputs
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    
                    // Sync with mobile input if it exists (get fresh reference)
                    const mobileInput = document.getElementById('searchInputMobile');
                    if (mobileInput) {
                        mobileInput.value = e.target.value;
                    }
                    
                    // Apply filter immediately (real-time)
                    // Pass query as-is; case-insensitive matching happens in sortAndRenderPosts
                    handleSearch(query);
                });
            }

            // Initialize mobile search input
            if (searchInputMobile) {
                // Attach input event listener for real-time filtering
                searchInputMobile.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    
                    // Sync with desktop input if it exists (get fresh reference)
                    const desktopInput = document.getElementById('searchInput');
                    if (desktopInput) {
                        desktopInput.value = e.target.value;
                    }
                    
                    // Apply filter immediately (real-time)
                    // Pass query as-is; case-insensitive matching happens in sortAndRenderPosts
                    handleSearch(query);
                });
            }
        }
        
        // Initialize search inputs when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeSearchInputs);
        } else {
            // DOM is already loaded
            initializeSearchInputs();
        }

        // Modal Functionality
        const profileModal = document.getElementById('profileModal');
        const settingsModal = document.getElementById('settingsModal');
        const headerProfileIcon = document.getElementById('headerProfileIcon');
        const headerProfileIconMobile = document.getElementById('headerProfileIconMobile');
        const settingsButton = document.getElementById('settingsButton');
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

        // Open profile modal for a specific user (called when clicking profile pic on post)
        async function openProfileModalForUser(targetUserId) {
            if (!targetUserId) return;
            await openProfileModal(targetUserId);
        }

        // Open profile modal - accepts optional userId parameter
        // If no userId provided, shows current user's profile
        async function openProfileModal(targetUserId = null) {
            // Reload posts to ensure we have the latest data
            loadPosts();
            
            // Determine which user's profile to show
            let userIdToShow;
            if (targetUserId) {
                // Show specific user's profile
                userIdToShow = targetUserId;
            } else {
                // Show current user's profile (default behavior)
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                    userIdToShow = firebase.auth().currentUser.uid;
                } else {
                    userIdToShow = currentUser.id;
                }
            }
            
            // Get user data (supports both Firebase and localStorage)
            let fullUser = await getUserProfileDataFirebase(userIdToShow);
            
            // If Firebase didn't return user, try localStorage
            if (!fullUser) {
                if (targetUserId) {
                    // Try to get from localStorage
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    fullUser = users.find(u => u.id === targetUserId);
                    // If still not found, try to get from posts (for username at least)
                    if (!fullUser) {
                        const post = posts.find(p => p.userId === targetUserId);
                        if (post) {
                            fullUser = {
                                id: targetUserId,
                                name: post.username,
                                email: '',
                                profileInitial: post.profileInitial || post.username.charAt(0).toUpperCase()
                            };
                        }
                    }
                } else {
                    fullUser = getFullUserData();
                }
            }
            
            if (!fullUser) {
                console.error('User not found');
                return;
            }
            
            // Check if viewing own profile (supports both Firebase and localStorage)
            let isOwnProfile;
            let userId;
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                // Use Firebase
                const firebaseUser = firebase.auth().currentUser;
                userId = firebaseUser.uid;
                isOwnProfile = fullUser.id === firebaseUser.uid || fullUser.uid === firebaseUser.uid || userIdToShow === firebaseUser.uid;
            } else {
                // Use localStorage
                userId = currentUser.id;
                isOwnProfile = currentUser.id === fullUser.id || userIdToShow === currentUser.id;
            }
            
            // Fetch user posts (supports both Firebase and localStorage)
            // Use userIdToShow to get posts for the target user, not the logged-in user
            let userPosts;
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                // Use Firebase
                userPosts = await getUserPostsFirebase(userIdToShow);
            } else {
                // Use localStorage
                userPosts = posts.filter(p => p && p.userId === userIdToShow);
            }
            
            const totalLikes = userPosts.reduce((sum, p) => sum + (Number(p.likes) || 0), 0);

            // Get profile picture initial (use stored initial or first letter of name/username)
            const userName = fullUser.name || fullUser.username || 'User';
            const profileInitial = fullUser.profileInitial || userName.charAt(0).toUpperCase();

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
                const emailDisplay = fullUser.email || 'Not provided';
                
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
                <div class="profile-name">${escapeHtml(userName)}</div>
                <div class="profile-email">${escapeHtml(fullUser.email || (isOwnProfile ? currentUser.email : '') || 'Not provided')}</div>
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
            
            // Update teaser profile pic
            const teaserProfilePic = document.getElementById('teaserProfilePic');
            if (teaserProfilePic) {
                teaserProfilePic.textContent = profileInitial;
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
        // Header profile icons open the logged-in user's profile (no userId parameter)
        if (headerProfileIcon) {
            headerProfileIcon.addEventListener('click', () => {
                openProfileModal(); // No parameter = shows logged-in user's profile
            });
        }
        if (headerProfileIconMobile) {
            headerProfileIconMobile.addEventListener('click', () => {
                openProfileModal(); // No parameter = shows logged-in user's profile
            });
        }
        if (settingsButton) settingsButton.addEventListener('click', openSettingsModal);
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
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

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

        // Reload posts when page becomes visible (handles browser back button)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                loadPosts();
                sortAndRenderPosts();
            }
        });

        // Reload posts when window gains focus (handles tab switching)
        window.addEventListener('focus', () => {
            loadPosts();
            sortAndRenderPosts();
        });

        // Initial render
        sortAndRenderPosts();