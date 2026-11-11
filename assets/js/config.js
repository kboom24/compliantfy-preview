/* Compliantfy front-end config.
 * apiBase: where the scanner API lives, e.g. "https://scanner.compliantfy.example" (no trailing slash).
 * Empty = no hosted scanner: the scan screen plays back labeled EXAMPLE data (demo mode).
 * For testing you can also pass ?api=https://host:port on scan.html / report.html (http/https only). */
window.CF_CONFIG = window.CF_CONFIG || { apiBase: '' };
