/**
 * Shared input cap for the browser UI and the CLI.
 * Checked against File.size / fs.stat before the bytes are read.
 * 100 MiB is the current input cap. Decoded values and formatted JSON can use
 * several times the input size; browser decoding still runs on the main thread.
 */
const MAX_INPUT_BYTES = 100 * 1024 * 1024;

function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KiB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

/**
 * @param {number} size
 * @returns {string | null}
 */
function fileTooLargeMessage(size) {
  if (size > MAX_INPUT_BYTES) {
    const maxMiB = MAX_INPUT_BYTES / (1024 * 1024);
    return `File is too large (${formatBytes(size)}). Maximum size is ${maxMiB} MiB.`;
  }
  return null;
}

module.exports = { MAX_INPUT_BYTES, fileTooLargeMessage };
