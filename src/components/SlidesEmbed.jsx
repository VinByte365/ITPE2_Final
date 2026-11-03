// src/components/SlidesEmbed.jsx
function toSlidesEmbedUrl(value) {
  if (!value) return '';
  try {
    const match = value.match(/\/presentation\/d\/([^/]+)/);
    if (match?.[1]) {
      return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
    }
    return value;
  } catch {
    return value;
  }
}

export default function SlidesEmbed({ url, fileUrl, fileName, title }) {
  const isGoogleSlides = url && url.includes('docs.google.com/presentation');
  const isPdf = (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
    (fileUrl && fileUrl.toLowerCase().includes('.pdf'));

  if (url && isGoogleSlides) {
    return (
      <div className="slides-embed">
        <iframe
          src={toSlidesEmbedUrl(url)}
          title={title || 'Slides'}
          allowFullScreen
        />
        <p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open in Google Slides
          </a>
        </p>
      </div>
    );
  }

  if (fileUrl && isPdf) {
    return (
      <div className="slides-embed">
        <iframe
          src={fileUrl}
          title={title || 'PDF'}
        />
        <p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            Open PDF
          </a>
        </p>
      </div>
    );
  }

  if (fileUrl) {
    // .pptx or other file -> download
    return (
      <div className="slides-embed">
        <p>
          <a href={fileUrl} download={fileName || true} target="_blank" rel="noopener noreferrer">
            Download {fileName || 'file'}
          </a>
        </p>
      </div>
    );
  }

  if (url) {
    return (
      <div className="slides-embed">
        <p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {title || url}
          </a>
        </p>
      </div>
    );
  }

  return null;
}