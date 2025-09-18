const fs = require("fs");
const path = require("path");

// Path to the file with encoding issues
const filePath = path.join(__dirname, "src/components/ResetPasswordPage.jsx");

// Read the file content as a string
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  // Clean the content by removing any BOM or invalid characters
  // This regex removes common problematic characters at the beginning of files
  const cleanedContent = data.replace(/^\uFEFF|\uFFFD|\u00EF\u00BB\u00BF/g, "");

  // Write the cleaned content back to the file with UTF-8 encoding
  fs.writeFile(filePath, cleanedContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("File encoding fixed successfully!");
  });
});
