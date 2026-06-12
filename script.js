// Local Storage Keys
const WISHES_KEY = 'urWish_wishes';
const LIKES_KEY = 'urWish_likes';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadWishes();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    const form = document.getElementById('wishForm');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    form.addEventListener('submit', handleAddWish);
    clearBtn.addEventListener('click', handleClearAll);
    downloadBtn.addEventListener('click', handleDownload);
}

// Add a new wish
function handleAddWish(e) {
    e.preventDefault();

    const nameInput = document.getElementById('nameInput');
    const wishInput = document.getElementById('wishInput');

    const name = nameInput.value.trim();
    const wish = wishInput.value.trim();

    if (name && wish) {
        const newWish = {
            id: Date.now(),
            name,
            wish,
            timestamp: new Date().toLocaleString(),
            likes: 0
        };

        // Get existing wishes
        let wishes = JSON.parse(localStorage.getItem(WISHES_KEY)) || [];
        
        // Add new wish to the beginning
        wishes.unshift(newWish);

        // Save to localStorage
        localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));

        // Clear form
        nameInput.value = '';
        wishInput.value = '';
        nameInput.focus();

        // Reload display
        loadWishes();

        // Show success message
        showNotification('Wish sent successfully! 🎉');
    }
}

// Load and display wishes
function loadWishes() {
    const wishes = JSON.parse(localStorage.getItem(WISHES_KEY)) || [];
    const container = document.getElementById('wishContainer');

    // Clear container
    container.innerHTML = '';

    if (wishes.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <p>🎉 Welcome to Ur Wish! 🎉</p>
                <p>Be the first to share a birthday wish!</p>
            </div>
        `;
    } else {
        wishes.forEach(wish => {
            const wishElement = createWishElement(wish);
            container.appendChild(wishElement);
        });
    }

    // Update stats
    updateStats(wishes);
}

// Create wish element
function createWishElement(wish) {
    const wishItem = document.createElement('div');
    wishItem.className = 'wish-item';
    wishItem.id = `wish-${wish.id}`;

    const likeCount = wish.likes || 0;
    const isLiked = isWishLiked(wish.id);

    wishItem.innerHTML = `
        <div class="wish-header">
            <span class="wish-name">👤 ${escapeHtml(wish.name)}</span>
            <span class="wish-time">⏰ ${wish.timestamp}</span>
        </div>
        <div class="wish-text">${escapeHtml(wish.wish)}</div>
        <div class="wish-actions">
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-wish-id="${wish.id}" title="Like this wish">
                ❤️ <span class="like-count">${likeCount}</span>
            </button>
            <button class="delete-btn" data-wish-id="${wish.id}" title="Delete this wish">
                🗑️ Delete
            </button>
        </div>
    `;

    // Add event listeners
    const likeBtn = wishItem.querySelector('.like-btn');
    const deleteBtn = wishItem.querySelector('.delete-btn');

    likeBtn.addEventListener('click', () => handleLike(wish.id, likeBtn));
    deleteBtn.addEventListener('click', () => handleDelete(wish.id));

    return wishItem;
}

// Handle like button
function handleLike(wishId, button) {
    const wishes = JSON.parse(localStorage.getItem(WISHES_KEY)) || [];
    const wish = wishes.find(w => w.id === wishId);

    if (wish) {
        if (isWishLiked(wishId)) {
            // Unlike
            removeLike(wishId);
            wish.likes = (wish.likes || 1) - 1;
            button.classList.remove('liked');
        } else {
            // Like
            addLike(wishId);
            wish.likes = (wish.likes || 0) + 1;
            button.classList.add('liked');
        }

        // Update like count display
        const likeCount = button.querySelector('.like-count');
        likeCount.textContent = wish.likes;

        // Save changes
        localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
        updateStats(wishes);

        // Add animation
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
}

// Track likes in localStorage
function addLike(wishId) {
    let likes = JSON.parse(localStorage.getItem(LIKES_KEY)) || [];
    if (!likes.includes(wishId)) {
        likes.push(wishId);
        localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    }
}

function removeLike(wishId) {
    let likes = JSON.parse(localStorage.getItem(LIKES_KEY)) || [];
    likes = likes.filter(id => id !== wishId);
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
}

function isWishLiked(wishId) {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY)) || [];
    return likes.includes(wishId);
}

// Handle delete
function handleDelete(wishId) {
    if (confirm('Are you sure you want to delete this wish?')) {
        let wishes = JSON.parse(localStorage.getItem(WISHES_KEY)) || [];
        wishes = wishes.filter(w => w.id !== wishId);
        localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));

        // Remove from likes
        removeLike(wishId);

        loadWishes();
        showNotification('Wish deleted! 🗑️');
    }
}

// Handle clear all
function handleClearAll() {
    if (confirm('Are you sure you want to delete ALL wishes? This cannot be undone!')) {
        localStorage.removeItem(WISHES_KEY);
        localStorage.removeItem(LIKES_KEY);
        loadWishes();
        showNotification('All wishes cleared! 🧹');
    }
}

// Handle download
function handleDownload() {
    const wishes = JSON.parse(localStorage.getItem(WISHES_KEY)) || [];

    if (wishes.length === 0) {
        alert('No wishes to download!');
        return;
    }

    let csvContent = 'Name,Wish,Date/Time,Likes\n';

    wishes.forEach(wish => {
        const row = [
            `"${wish.name.replace(/"/g, '""')}"`,
            `"${wish.wish.replace(/"/g, '""')}"`,
            `"${wish.timestamp}"`,
            wish.likes || 0
        ].join(',');
        csvContent += row + '\n';
    });

    // Also create a JSON version for better formatting
    const jsonContent = JSON.stringify(wishes, null, 2);

    // Download CSV
    downloadFile(csvContent, 'wishes.csv', 'text/csv');

    showNotification('Wishes downloaded! 📥');
}

// Download file utility
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update stats
function updateStats(wishes) {
    const wishCount = wishes.length;
    const totalLikes = wishes.reduce((sum, wish) => sum + (wish.likes || 0), 0);

    document.getElementById('wishCount').textContent = wishCount;
    document.getElementById('loveCount').textContent = totalLikes;
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        font-weight: bold;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(300px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(300px);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Escape HTML special characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
