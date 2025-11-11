export async function fetchImageAsFile(
  url: string,
  filename?: string
): Promise<File> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to fetch image from ${url}`);
  }

  const blob = await response.blob();
  const extension = deriveExtension(blob.type);
  const safeName = filename || `avatar.${extension}`;

  return new File([blob], safeName, { type: blob.type });
}

function deriveExtension(mime: string) {
  if (!mime.includes('/')) return 'png';
  return mime.split('/')[1] || 'png';
}

