export default async function fetchFunction(url, data, method) {
  try {
    if (method?.toLowerCase() === "post") {
      const response = await fetch(`${url}`, {
        method: "POST", // Specify the method as POST
        headers: {
          "Content-Type": "application/json", // Set the content type to JSON
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    }
  } catch (err) {
    return false;
  }
}
