const API_URL =
"https://script.google.com/macros/s/AKfycbwHTz9S_WRMzBd30oJtZ0CZqXwS0QdNhrpPJoB6JJdBF_VNax7xMKmaY0VwRRBwipvv/exec";

async function getProducts(){

const res =
await fetch(API_URL);

return await res.json();

}