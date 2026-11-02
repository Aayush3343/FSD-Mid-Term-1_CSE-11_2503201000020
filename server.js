
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



// TASK 1: ADD A NEW BOOK


app.post('/api/books', (req, res) => {

    const { id, title, author, category, quantity } = req.body;
    const available = req.body.available ?? quantity;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Valid book ID is required"
        });
    }

    if (!title || !author || !category) {
        return res.status(400).json({
            message: "Title, author and category are required"
        });
    }

    if (!isValidQuantity(quantity) ||
        !isValidQuantity(available) ||
        available > quantity) {

        return res.status(400).json({
            message: "Invalid quantity or available copies"
        });
    }

    // Check whether ID already exists
    if (findBook(id)) {
        return res.status(409).json({
            message: "Book with this ID already exists"
        });
    }

    const newBook = {
        id,
        title,
        author,
        category,
        quantity,
        available
    };

    books.push(newBook);

    res.status(201).json({
        message: "Book added successfully",
        book: newBook
    });
});



//TASK 2: VIEW ALL BOOKS


app.get('/api/books', (req, res) => {

    res.status(200).json({
        totalBooks: books.length,
        books: books
    });
});



// TASK 3


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

    res.json(book);
});


// TASK 4: 


app.put('/api/books/:id', (req, res) => {

    // Find book using ID from URL
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

    const { title, author, category, quantity } = req.body;

    // Do not allow book ID to change
    if (req.body.id !== undefined &&
        Number(req.body.id) !== book.id) {

        return res.status(400).json({
            message: "Book ID cannot be changed"
        });
    }

    // Available copies are managed through issue/return
    if (req.body.available !== undefined) {
        return res.status(400).json({
            message: "Use issue or return endpoints to change available copies"
        });
    }

    // Check whether at least one detail is provided
    const fields = ['title', 'author', 'category', 'quantity'];

    if (!fields.some(field => req.body[field] !== undefined)) {
        return res.status(400).json({
            message: "Provide at least one field to update"
        });
    }

    // Validate text fields
    for (const field of ['title', 'author', 'category']) {
        if (req.body[field] !== undefined) {
            if (typeof req.body[field] !== 'string' ||
                !req.body[field].trim()) {

                return res.status(400).json({
                    message: `Invalid ${field}`
                });
            }
        }
    }

    // Preserve the number of already-issued copies
    const issuedCopies = book.quantity - book.available;

    if (quantity !== undefined) {

        if (!isValidQuantity(quantity) ||
            quantity < issuedCopies) {

            return res.status(400).json({
                message: "Quantity cannot be less than issued copies"
            });
        }

        book.quantity = quantity;
        book.available = quantity - issuedCopies;
    }

    // Update other details
    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (category !== undefined) book.category = category.trim();

    res.json({
        message: "Book updated successfully",
        book: book
    });
});







app.listen(PORT, () => {
    console.log(`Library server running at http://localhost:${PORT}`);
});
