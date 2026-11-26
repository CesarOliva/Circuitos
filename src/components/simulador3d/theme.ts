// The site's theme, read from <html data-theme>; the 3D views build their materials and lights from it.
export function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

// Calls `onChange` whenever the theme switches. Returns the function that stops watching.
export function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
