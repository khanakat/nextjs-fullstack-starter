const fs = require("fs");
const path = require("path");

// Simple icon generator for PWA
const generateIcon = (size) => {
  const canvas = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.22)}" fill="#000000"/>
    <path d="M${Math.floor(size * 0.25)} ${Math.floor(size * 0.5)}L${Math.floor(size * 0.42)} ${Math.floor(size * 0.67)}L${Math.floor(size * 0.75)} ${Math.floor(size * 0.33)}" stroke="white" stroke-width="${Math.floor(size * 0.04)}" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  return canvas;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "..", "public", "icons");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
sizes.forEach((size) => {
  const iconContent = generateIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), iconContent);
  console.log(`Generated ${filename}`);
});

// Generate special icons
const specialIcons = [
  { name: "analytics-96x96.svg", content: generateIcon(96) },
  { name: "workflow-96x96.svg", content: generateIcon(96) },
  { name: "collaborate-96x96.svg", content: generateIcon(96) },
];

specialIcons.forEach(({ name, content }) => {
  fs.writeFileSync(path.join(iconsDir, name), content);
  console.log(`Generated ${name}`);
});

console.log("All PWA icons generated successfully!");
