
import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

let books = [
    {
        id: 1,
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Fiction",
        quantity: 5,
        available: 5
    },
    {
        id: 2,
        title: "Atomic Habits",
        author: "James Clear",
        category: "Self Help",
        quantity: 4,
        available: 4
    },
    {
        id: 3,
        title: "Wings of Fire",
        author: "A.P.J. Abdul Kalam",
        category: "Biography",
        quantity: 3,
        available: 3
    }
];

function findBook(id) {
    return books.find(book => book.id === id);
}

function getValidId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function isValidQuantity(value) {
    return Number.isInteger(value) && value >= 0;
}

app.post('/api/books', (req, res) => {
    const { id, title, author, category, quantity } = req.body;
    const available = req.body.available ?? quantity;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Valid book ID is required"
        });
    }

    if (
        typeof title !== 'string' || !title.trim() ||
        typeof author !== 'string' || !author.trim() ||
        typeof category !== 'string' || !category.trim()
    ) {
        return res.status(400).json({
            message: "Valid title, author and category are required"
        });
    }

    if (
        !isValidQuantity(quantity) ||
        !isValidQuantity(available) ||
        available > quantity
    ) {
        return res.status(400).json({
            message: "Invalid quantity or available copies"
        });
    }

    if (findBook(id)) {
        return res.status(409).json({
            message: "Book with this ID already exists"
        });
    }

    const newBook = {
        id,
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        quantity,
        available
    };

    books.push(newBook);

    res.status(201).json({
        message: "Book added successfully",
        book: newBook
    });
});

app.get('/api/books', (req, res) => {
    res.status(200).json({
        totalBooks: books.length,
        books
    });
});

app.get('/api/books/search', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const title = String(req.query.title || '').trim().toLowerCase();
    const author = String(req.query.author || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim().toLowerCase();

    if (!q && !title && !author && !category) {
        return res.status(400).json({
            message: "Enter a search query"
        });
    }

    const result = books.filter(book => {
        const matchesQuery = !q ||
            book.title.toLowerCase().includes(q) ||
            book.author.toLowerCase().includes(q) ||
            book.category.toLowerCase().includes(q);

        const matchesTitle = !title ||
            book.title.toLowerCase().includes(title);

        const matchesAuthor = !author ||
            book.author.toLowerCase().includes(author);

        const matchesCategory = !category ||
            book.category.toLowerCase().includes(category);

        return matchesQuery &&
            matchesTitle &&
            matchesAuthor &&
            matchesCategory;
    });

    res.status(200).json({
        totalResults: result.length,
        books: result
    });
});

app.get('/api/books/:id', (req, res) => {
    const id = getValidId(req.params.id);

    if (id === null) {
        return res.status(400).json({
            message: "Invalid book ID"
        });
    }

    const book = findBook(id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    res.status(200).json(book);
});

app.put('/api/books/:id', (req, res) => {
    const id = getValidId(req.params.id);

    if (id === null) {
        return res.status(400).json({
            message: "Invalid book ID"
        });
    }

    const book = findBook(id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    if (
        req.body.id !== undefined &&
        Number(req.body.id) !== book.id
    ) {
        return res.status(400).json({
            message: "Book ID cannot be changed"
        });
    }

    if (req.body.available !== undefined) {
        return res.status(400).json({
            message: "Use issue or return endpoints to change available copies"
        });
    }

    const { title, author, category, quantity } = req.body;

    const fields = ['title', 'author', 'category', 'quantity'];

    if (!fields.some(field => req.body[field] !== undefined)) {
        return res.status(400).json({
            message: "Provide at least one field to update"
        });
    }

    for (const field of ['title', 'author', 'category']) {
        if (req.body[field] !== undefined) {
            if (
                typeof req.body[field] !== 'string' ||
                !req.body[field].trim()
            ) {
                return res.status(400).json({
                    message: `Invalid ${field}`
                });
            }
        }
    }

    const issuedCopies = book.quantity - book.available;

    if (quantity !== undefined) {
        if (
            !isValidQuantity(quantity) ||
            quantity < issuedCopies
        ) {
            return res.status(400).json({
                message: "Quantity cannot be less than issued copies"
            });
        }

        book.quantity = quantity;
        book.available = quantity - issuedCopies;
    }

    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (category !== undefined) book.category = category.trim();

    res.status(200).json({
        message: "Book updated successfully",
        book
    });
});

app.delete('/api/books/:id', (req, res) => {
    const id = getValidId(req.params.id);

    if (id === null) {
        return res.status(400).json({
            message: "Invalid book ID"
        });
    }

    const book = findBook(id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    if (book.available < book.quantity) {
        return res.status(409).json({
            message: "Cannot delete book while copies are issued"
        });
    }

    books = books.filter(book => book.id !== id);

    res.status(200).json({
        message: "Book deleted successfully"
    });
});

app.post('/api/books/:id/issue', (req, res) => {
    const id = getValidId(req.params.id);

    if (id === null) {
        return res.status(400).json({
            message: "Invalid book ID"
        });
    }

    const book = findBook(id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    const copies = req.body.copies ?? 1;

    if (!Number.isInteger(copies) || copies <= 0) {
        return res.status(400).json({
            message: "Copies must be a positive integer"
        });
    }

    if (book.available < copies) {
        return res.status(400).json({
            message: "Not enough copies available",
            available: book.available
        });
    }

    book.available -= copies;

    res.status(200).json({
        message: "Book issued successfully",
        issuedCopies: copies,
        book
    });
});

app.post('/api/books/:id/return', (req, res) => {
    const id = getValidId(req.params.id);

    if (id === null) {
        return res.status(400).json({
            message: "Invalid book ID"
        });
    }

    const book = findBook(id);

    if (!book) {
        return res.status(404).json({
            message: "Book not found"
        });
    }

    const copies = req.body.copies ?? 1;

    if (!Number.isInteger(copies) || copies <= 0) {
        return res.status(400).json({
            message: "Copies must be a positive integer"
        });
    }

    const issuedCopies = book.quantity - book.available;

    if (copies > issuedCopies) {
        return res.status(400).json({
            message: "Cannot return more copies than issued",
            issuedCopies
        });
    }

    book.available += copies;

    res.status(200).json({
        message: "Book returned successfully",
        returnedCopies: copies,
        book
    });
});

app.listen(PORT, () => {
    console.log(`Library server running at http://localhost:${PORT}`);
});
