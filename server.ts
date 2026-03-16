import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Fuse from 'fuse.js';

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MASTER_PDF_PATH = path.join(UPLOADS_DIR, 'master.pdf');
const INDEX_JSON_PATH = path.join(UPLOADS_DIR, 'index.json');

async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, 'master.pdf'); // Overwrite the master PDF
  },
});
const upload = multer({ storage });

// API Routes
app.use(express.json());

// 1. Upload and Index Master PDF
app.post('/api/admin/upload', upload.single('certificate'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const dataBuffer = await fs.readFile(MASTER_PDF_PATH);
    
    // Custom pagerender to separate pages with a unique delimiter
    const PAGE_DELIMITER = '---PAGE_BREAK---';
    function render_page(pageData: any) {
      return pageData.getTextContent().then(function(textContent: any) {
        let text = '';
        for (let item of textContent.items) {
          text += item.str + ' ';
        }
        return text + PAGE_DELIMITER;
      });
    }

    const options = {
      pagerender: render_page,
    };

    const data = await pdfParse(dataBuffer, options);
    
    // Split text by our delimiter
    const pagesText = data.text.split(PAGE_DELIMITER);
    
    // Build index: array of { page: number, text: string }
    // Note: page is 1-indexed
    const index = [];
    for (let i = 0; i < pagesText.length; i++) {
      const text = pagesText[i].trim();
      if (text) {
        index.push({
          page: i + 1,
          text: text,
        });
      }
    }

    await fs.writeFile(INDEX_JSON_PATH, JSON.stringify(index, null, 2));

    res.json({ message: 'File uploaded and indexed successfully', totalPages: index.length });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// 2. Search for Certificate
app.post('/api/certificates/search', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const indexData = await fs.readFile(INDEX_JSON_PATH, 'utf-8');
    const index = JSON.parse(indexData);

    // Use Fuse.js for fuzzy searching
    const fuse = new Fuse(index, {
      keys: ['text'],
      includeScore: true,
      threshold: 0.3, // Adjust threshold for fuzziness (0 is exact, 1 is anything)
      ignoreLocation: true,
    });

    const results = fuse.search(name);

    if (results.length > 0) {
      // Return the best match
      const bestMatch = results[0].item as { page: number; text: string };
      res.json({ found: true, page: bestMatch.page });
    } else {
      res.json({ found: false, message: 'Certificate not found. Please check the spelling of your name.' });
    }
  } catch (error) {
    console.error('Error searching index:', error);
    // If index.json doesn't exist, it means no PDF has been uploaded yet
    res.status(500).json({ error: 'Failed to search. Has the master PDF been uploaded?' });
  }
});

// 3. Download Specific Certificate Page
app.get('/api/certificates/download/:page', async (req, res) => {
  const pageNum = parseInt(req.params.page, 10);
  const name = req.query.name as string || 'Certificate';

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }

  try {
    const masterPdfBytes = await fs.readFile(MASTER_PDF_PATH);
    const masterPdfDoc = await PDFDocument.load(masterPdfBytes);

    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();

    // Copy the specific page (0-indexed in pdf-lib)
    const [copiedPage] = await newPdfDoc.copyPages(masterPdfDoc, [pageNum - 1]);
    newPdfDoc.addPage(copiedPage);

    // Serialize the new PDF to bytes
    const pdfBytes = await newPdfDoc.save();

    // Send the PDF to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${encodeURIComponent(name)}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
