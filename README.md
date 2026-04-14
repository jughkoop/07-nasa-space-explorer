# NASA Space Explorer

NASA Space Explorer is a web app that lets users browse NASA Astronomy Picture of the Day (APOD) images by date range.

Users can:
- Choose a start date and end date
- Fetch all images in that range
- Pick a random image with the Surprise Me button
- Open a modal to view larger images and detailed explanations

The app uses real data from NASA's APOD API: https://api.nasa.gov/

## Technologies Used

- HTML5 for semantic page structure
- CSS3 for responsive layout and styling
- JavaScript (ES6+) for app logic and DOM updates
- Fetch API for making HTTP requests to NASA APOD

## What I Learned

This project helped me learn how to get and use data from an API in a real app.

Key things I practiced:
- Building a request URL with query parameters (start date, end date, API key)
- Using async/await to handle asynchronous API calls
- Converting API responses to JSON and validating returned data
- Displaying fetched data dynamically in the DOM
- Handling loading states, empty results, and error states

## Challenge I Solved: Rate Limits

One challenge was that the NASA API can sometimes return temporary errors (especially when rate limits are reached).

To solve this, I improved the request flow by:
- Adding retry logic for temporary failures (like 429 and server errors)
- Using short delays between retries (backoff)
- Showing clear, user-friendly error messages
- Keeping the UI responsive by disabling buttons during requests and restoring them after

This made the app more reliable and gave users better feedback when the API is busy.
