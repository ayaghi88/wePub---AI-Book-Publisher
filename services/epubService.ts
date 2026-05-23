
import JSZip from 'jszip';
import { BookState } from '../types';

export const generateEpub = async (book: BookState): Promise<Blob> => {
  const zip = new JSZip();

  // 1. mimetype (MUST BE FIRST, NO COMPRESSION)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // 3. Styles
  const css = `
    body { font-family: "Georgia", serif; line-height: 1.5; margin: 5%; }
    h1 { text-align: center; color: #333; margin-top: 2em; }
    p { margin-bottom: 1em; text-indent: 1em; }
    .title-page { text-align: center; margin-top: 20%; }
    .author { font-style: italic; font-size: 1.2em; }
  `;
  zip.file('OEBPS/styles.css', css);

  // 4. Chapters
  book.chapters.forEach((chapter, index) => {
    const fileName = `chapter_${index + 1}.xhtml`;
    const content = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${chapter.title}</h1>
  ${chapter.content}
</body>
</html>`;
    zip.file(`OEBPS/${fileName}`, content);
  });

  // 5. Title Page
  const titlePage = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>Title Page</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="title-page">
    <h1>${book.metadata.title}</h1>
    <div class="author">By ${book.metadata.author}</div>
    <div class="publisher">${book.metadata.publisher}</div>
  </div>
</body>
</html>`;
  zip.file('OEBPS/title.xhtml', titlePage);

  // 6. TOC (NCX)
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${book.metadata.title}</text></docTitle>
  <navMap>
    <navPoint id="title-page" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="title.xhtml"/>
    </navPoint>
    ${book.chapters.map((ch, i) => `
    <navPoint id="navPoint-${i + 1}" playOrder="${i + 2}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="chapter_${i + 1}.xhtml"/>
    </navPoint>`).join('')}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncx);

  // 7. Content OPF
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${book.metadata.title}</dc:title>
    <dc:creator>${book.metadata.author}</dc:creator>
    <dc:language>${book.metadata.language || 'en'}</dc:language>
    <dc:publisher>${book.metadata.publisher}</dc:publisher>
    <dc:rights>${book.metadata.rights}</dc:rights>
    <dc:description>${book.metadata.description}</dc:description>
    <dc:identifier id="bookid">urn:uuid:12345</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    ${book.chapters.map((ch, i) => `
    <item id="chapter-${i + 1}" href="chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('')}
  </manifest>
  <spine toc="ncx">
    <itemref idref="title"/>
    ${book.chapters.map((ch, i) => `
    <itemref idref="chapter-${i + 1}"/>`).join('')}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  return await zip.generateAsync({ type: 'blob' });
};
