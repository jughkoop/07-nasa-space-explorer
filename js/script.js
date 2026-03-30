// NASA API key for accessing the APOD API
const apiKey = 'f1YVEevmAaEkEqygXBN7n8Xv3McPe6mnX5GE3C93';

// Find our HTML elements on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close-btn');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Add click event to the "Get Space Images" button
button.addEventListener('click', fetchSpaceImages);

// Add click event to the close button
closeBtn.addEventListener('click', closeModal);

// Close modal when clicking outside of the modal content
modal.addEventListener('click', (event) => {
  // Only close if clicking on the modal background, not the content
  if (event.target === modal) {
    closeModal();
  }
});

// Function to fetch images from NASA's APOD API
async function fetchSpaceImages() {
  // Get the selected start and end dates from the input fields
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Show a loading message while fetching images
  gallery.innerHTML = `<div class="placeholder"><div class="placeholder-icon">⏳</div><p>Loading your space images...</p></div>`;

  // Build the API URL with the date range and API key
  const apiUrl = `https://api.nasa.gov/planetary/apod?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;

  try {
    // Fetch the data from NASA's APOD API
    const response = await fetch(apiUrl);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error('Failed to fetch images from NASA API');
    }

    // Convert the response to JSON format
    const images = await response.json();

    // Display the images in the gallery
    displayGallery(images);
  } catch (error) {
    // Show an error message if something goes wrong
    console.error('Error:', error);
    gallery.innerHTML = `<div class="placeholder"><p>Error loading images. Please try again.</p></div>`;
  }
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
        <div class="gallery-item" data-index="${imageIndex}">
          <img src="${image.url}" alt="${image.title}" />
          <p><strong>${image.title}</strong></p>
          <p style="font-size: 12px; color: #999;">${image.date}</p>
        </div>
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
  modal.classList.add('active');
}

// Function to close the modal
function closeModal() {
  // Hide the modal by removing the active class
  modal.classList.remove('active');
}
