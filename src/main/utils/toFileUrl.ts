/**
 * Converts a raw filesystem path (as returned by the native file picker) into
 * a properly-formed file:// URL. Needed specifically for Windows paths like
 * "C:\Users\ethan\Music\tone.mp3" - naively doing `file://${path}` produces
 * an invalid URL (backslashes aren't valid path separators in a URI, and a
 * Windows absolute path needs a leading slash before the drive letter to
 * form a correct three-slash file:// URL). This also percent-encodes spaces
 * and other special characters, which raw interpolation would leave broken.
 */
export const toFileUrl = (rawPath: string): string => {
  let normalized = rawPath.replace(/\\/g, "/");
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }
  return "file://" + encodeURI(normalized);
};
