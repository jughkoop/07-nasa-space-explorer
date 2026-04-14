// NASA API key for accessing the APOD API
const apiKey = 'f1YVEevmAaEkEqygXBN7n8Xv3McPe6mnX5GE3C93';
const apodBaseUrl = 'https://api.nasa.gov/planetary/apod';
const maxApiRetries = 2;
const retryDelayMs = 700;

// Find our HTML elements on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesBtn');
const surpriseButton = document.getElementById('surpriseBtn');
const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('statusMessage');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('closeModalBtn');
let lastFocusedElement = null;

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Add click event to the "Get Space Images" button
getImagesButton.addEventListener('click', fetchSpaceImages);

// Add click event to the "Surprise Me" button
surpriseButton.addEventListener('click', fetchRandomSpaceImage);

// Add click event to the close button
closeBtn.addEventListener('click', closeModal);

// Close modal when clicking outside of the modal content
modal.addEventListener('click', (event) => {
  // Only close if clicking on the modal background, not the content
  if (event.target === modal) {
    closeModal();
  }
});

// Let keyboard users close the dialog with Escape
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});

// Function to fetch images from NASA's APOD API
async function fetchSpaceImages() {
  // Fetch and display every image in the selected date range
  await loadSpaceImages(false);
}

// Function to fetch one random image from the selected date range
async function fetchRandomSpaceImage() {
  // Fetch data and display one random image card
  await loadSpaceImages(true);
}

// Shared function that fetches APOD data and decides how to display it
async function loadSpaceImages(showRandomImage) {
  // Get the selected start and end dates from the input fields
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Validate date inputs before making a request
  if (!startDate || !endDate) {
    setStatus('Please select both a start date and end date.');
    return;
  }

  if (startDate > endDate) {
    setStatus('Start date must be the same as or earlier than end date.');
    return;
  }

  // Show a loading message while fetching images
  gallery.innerHTML = `<div class="placeholder"><div class="placeholder-icon">⏳</div><p>Loading your space images...</p></div>`;
  setStatus('Loading images from NASA...');
  gallery.setAttribute('aria-busy', 'true');

  // Disable both buttons during the request
  getImagesButton.disabled = true;
  surpriseButton.disabled = true;

  try {
    // Fetch APOD data using retry logic for temporary API/network failures
    const apiData = await fetchApodData(startDate, endDate);
    const images = Array.isArray(apiData) ? apiData : [apiData].filter(Boolean);

    // Keep only valid image entries
    const validImages = images.filter((image) => image.media_type === 'image' && image.url && image.title);

    // Show a message when the API has no image entries in this date range
    if (validImages.length === 0) {
      gallery.innerHTML = `<div class="placeholder"><div class="placeholder-icon">🛰️</div><p>No images found in this date range. Try different dates.</p></div>`;
      setStatus('No images found in this date range.');
      return;
    }

    // Display all images or one random image based on button choice
    if (showRandomImage) {
      const randomIndex = Math.floor(Math.random() * validImages.length);
      const randomImage = validImages[randomIndex];
      displayGallery([randomImage]);
      setStatus('Showing 1 random image result.');
    } else {
      displayGallery(validImages);
      setStatus(`Showing ${validImages.length} image results.`);
    }
  } catch (error) {
    // Show an error message if something goes wrong
    console.error('Error:', error);
    gallery.innerHTML = `<div class="placeholder"><p>${getFriendlyErrorMessage(error)}</p></div>`;
    setStatus(getFriendlyErrorMessage(error));
  } finally {
    // Re-enable buttons after the request is complete
    getImagesButton.disabled = false;
    surpriseButton.disabled = false;
    gallery.setAttribute('aria-busy', 'false');
  }
}

// Fetch APOD data and retry for temporary failures (rate limits/server/network)
async function fetchApodData(startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    api_key: apiKey,
  });

  const apiUrl = `${apodBaseUrl}?${params.toString()}`;
  let lastError = new Error('Failed to fetch images from NASA API.');

  for (let attempt = 0; attempt <= maxApiRetries; attempt++) {
    try {
      const response = await fetch(apiUrl);
      const responseData = await safelyParseJson(response);

      if (!response.ok) {
        const apiMessage = responseData?.msg || responseData?.error?.message || `NASA API returned status ${response.status}.`;
        const apiError = new Error(apiMessage);
        apiError.status = response.status;
        throw apiError;
      }

      return responseData;
    } catch (error) {
      lastError = error;
      const isNetworkError = error instanceof TypeError;
      const isRetriableStatus = error.status === 429 || error.status >= 500;
      const shouldRetry = attempt < maxApiRetries && (isNetworkError || isRetriableStatus);

      if (!shouldRetry) {
        break;
      }

      await wait(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}

// Parse API responses safely, even if the response body is empty or not JSON
async function safelyParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Pause briefly between retries to give the API time to recover
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Convert technical API errors into simple, student-friendly messages
function getFriendlyErrorMessage(error) {
  const message = (error.message || '').toLowerCase();

  if (error.status === 429 || message.includes('rate limit')) {
    return 'NASA API rate limit reached. Please wait a minute and try again.';
  }

  if (error.status === 400) {
    return 'NASA could not process that date range. Try different dates.';
  }

  if (error.status === 403) {
    return 'NASA API access was denied. Please try again later.';
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Network error while contacting NASA. Check your connection and try again.';
  }

  return 'Error loading images. Please try again.';
}

// Function to display images in the gallery
function displayGallery(images) {
  // Clear the gallery and create an empty string to build our HTML
  let galleryHTML = '';
  let imageIndex = 0;

  // Loop through each image from the API
  images.forEach((image) => {
    // Check if the item is an image (not a video) and has a valid URL and title
    if (image.media_type === 'image' && image.url && image.title) {
      // Create an HTML card for each image with title and date
      galleryHTML += `
        <button class="gallery-item" type="button" data-index="${imageIndex}" aria-label="Open details for ${image.title}">
          <img src="${image.url}" alt="${image.title}" loading="lazy" decoding="async" />
          <p><strong>${image.title}</strong></p>
          <p class="gallery-date">${image.date}</p>
        </button>
      `;
      // Increment counter only for images (not videos)
      imageIndex++;
    }
  });

  // Update the gallery with the new HTML
  gallery.innerHTML = galleryHTML;

  // Store images data globally for safe access
  window.galleryImages = images.filter(image => image.media_type === 'image' && image.url && image.title);

  // Add click event listeners to all gallery items
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach((item) => {
    item.addEventListener('click', openModal);
  });
}

// Function to open the modal and display image details
function openModal(event) {
  // Get the gallery item that was clicked
  const item = event.currentTarget;

  // Get the index of the clicked item
  const index = parseInt(item.dataset.index);

  // Get the image data from the global array
  const image = window.galleryImages[index];

  // Set the modal content with the image data
  document.getElementById('modalImage').src = image.url;
  document.getElementById('modalImage').alt = image.title;
  document.getElementById('modalTitle').textContent = image.title;
  document.getElementById('modalDate').textContent = image.date;
  document.getElementById('modalExplanation').textContent = image.explanation;

  // Show the modal by adding the active class
  lastFocusedElement = document.activeElement;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  closeBtn.focus();
}

// Function to close the modal
function closeModal() {
  // Hide the modal by removing the active class
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  // Return keyboard focus to the card that opened the dialog
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

// Helper function to update screen-reader friendly status text
function setStatus(message) {
  statusMessage.textContent = message;
}
