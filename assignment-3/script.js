
let currentBooks = [];

const ROLL_NUMBER = '27100245';

const catalogPage = document.getElementById('catalog-page');
const searchPage = document.getElementById('search-page');
const navTabs = document.querySelectorAll('.nav-tab');
const addBookForm = document.getElementById('add-book-form');
const booksGrid = document.getElementById('books-grid');
const bookCount = document.getElementById('book-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadBooks(); 
}

function setupEventListeners() {
    // Navigation tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page));
    });

    // Add book form
    addBookForm.addEventListener('submit', handleAddBook);

    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Also trigger search on input change for better UX
    searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <p>Enter a search term to find books in your collection</p>
                </div>
            `;
        }
    });
}

function switchPage(page) {
    // Update active tab
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === page);
    });

    // Show/hide pages
    catalogPage.classList.toggle('active', page === 'catalog');
    searchPage.classList.toggle('active', page === 'search');

    // Load books when switching to catalog to ensure fresh data
    if (page === 'catalog') {
        loadBooks();
    }
}

async function loadBooks() {
    const loadingElement = document.getElementById('books-loading');

    try {
        if (loadingElement) loadingElement.style.display = 'block';

        console.log('Loading books from backend...');
        const response = await fetch('/api/books');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 1. Read the full payload
        const payload = await response.json();

        // 2. Safely extract the array at payload.result.books
        const booksArray = 
            payload &&
            payload.result &&
            Array.isArray(payload.result.books)
            ? payload.result.books
            : [];

        // 3. Update state and UI
        currentBooks = booksArray;
        console.log(`Loaded ${booksArray.length} books:`, booksArray);

        displayBooks(booksArray);
        updateBookCount(booksArray.length);

    } catch (error) {
        console.error('Error loading books:', error);
        displayError('Failed to load books. Please try again.');
        currentBooks = [];
        updateBookCount(0);

    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}


function displayBooks(books) {
    if (!booksGrid) {
        console.error('Books grid element not found');
        return;
    }

    if (books.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-book-open"></i>
                <p>No books in your collection yet. Add your first book!</p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = books.map(book => `
        <div class="book-card">
            <img src="${book.coverImageUrl}" alt="${escapeHtml(book.title)}" class="book-image" 
                 onerror="this.src='1.jpg'">
            <div class="book-info">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-author">by ${escapeHtml(book.author)}</div>
                <div class="book-price">$${parseFloat(book.price).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

function updateBookCount(count) {
    if (bookCount) {
        bookCount.textContent = `${count} book${count !== 1 ? 's' : ''}`;
    }
}

async function handleAddBook(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    
    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Book...';

        const formData = new FormData(e.target);
        const bookData = {
            title: formData.get('title').trim(),
            author: formData.get('author').trim(),
            coverImageUrl: formData.get('coverImageUrl').trim(),
            price: parseFloat(formData.get('price'))
        };

        console.log('Adding book with data:', bookData);

        // Validate the data
        if (!bookData.title || !bookData.author || !bookData.coverImageUrl || isNaN(bookData.price)) {
            throw new Error('Please fill in all fields correctly');
        }

        const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Book added successfully:', result);

        // Show success message
        showSuccessMessage('Book added successfully!');
        
        // Reset form
        e.target.reset();
        
        // **KEY FIX: Reload books immediately to update the bottom section**
        console.log('Reloading books to show newly added book...');
        await loadBooks();
        
        // **OPTIONAL: Add a small delay to ensure the UI updates smoothly**
        setTimeout(() => {
            console.log('Books should now be updated in the UI');
        }, 100);
        
    } catch (error) {
        console.error('Error adding book:', error);
        showErrorMessage(error.message || 'Failed to add book. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        searchResults.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-search"></i>
                <p>Enter a search term to find books in your collection</p>
            </div>
        `;
        return;
    }

    try {
        // Show loading state
        searchResults.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Searching books...
            </div>
        `;

        console.log(`Searching for: "${query}"`);
        const response = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const books = await response.json();
        const searchBooks = Array.isArray(books) ? books : [];
        console.log(`Search returned ${searchBooks.length} books:`, searchBooks);
        
        if (searchBooks.length === 0) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No books found matching "${escapeHtml(query)}"</p>
                    <p style="margin-top: 8px; font-size: 14px; color: var(--text-light);">
                        Try searching with different keywords
                    </p>
                </div>
            `;
        } else {
            searchResults.innerHTML = `
                <div class="search-header" style="margin-bottom: 24px; text-align: center;">
                    <h3 style="color: var(--text-primary); margin-bottom: 8px;">
                        Found ${searchBooks.length} book${searchBooks.length !== 1 ? 's' : ''} 
                        matching "${escapeHtml(query)}"
                    </h3>
                </div>
                <div class="books-grid">
                    ${searchBooks.map(book => `
                        <div class="book-card">
                            <img src="${book.coverImageUrl}" alt="${escapeHtml(book.title)}" class="book-image"
                                 onerror="this.src='1.jpg'">
                            <div class="book-info">
                                <div class="book-title">${escapeHtml(book.title)}</div>
                                <div class="book-author">by ${escapeHtml(book.author)}</div>
                                <div class="book-price">$${parseFloat(book.price).toFixed(2)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching books:', error);
        searchResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to search books. Please try again.</p>
                <p style="margin-top: 8px; font-size: 14px; color: var(--text-light);">
                    ${error.message}
                </p>
            </div>
        `;
    }
}

function showSuccessMessage(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;

    const form = document.querySelector('.book-form');
    if (form && form.parentNode) {
        form.parentNode.insertBefore(successDiv, form);
    }

    // Remove message after 4 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 4000);
}

function showErrorMessage(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;

    const form = document.querySelector('.book-form');
    if (form && form.parentNode) {
        form.parentNode.insertBefore(errorDiv, form);
    }

    // Remove message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function displayError(message) {
    if (booksGrid) {
        booksGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

