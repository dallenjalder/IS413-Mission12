using BooksAPI.Data;
using BooksAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BooksAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly BookstoreContext _context;

        // Inject the database context
        public BooksController(BookstoreContext context)
        {
            _context = context;
        }

        // GET: api/books?page=1&pageSize=5&sortOrder=asc&category=Fiction
        // Returns a paginated, sorted, and optionally filtered list of books
        [HttpGet]
        public async Task<ActionResult> GetBooks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string? category = null)
        {
            // Start with the full books query
            IQueryable<Book> query = _context.Books;

            // Filter by category if one was provided (empty string means "all")
            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(b => b.Category == category);
            }

            // Sort by title ascending or descending
            query = sortOrder == "desc"
                ? query.OrderByDescending(b => b.Title)
                : query.OrderBy(b => b.Title);

            // Get total count (after filtering) for pagination math in the frontend
            int totalCount = await query.CountAsync();

            // Apply pagination: skip records before this page, take only this page's records
            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Return both the books and total count so the frontend can build page links
            return Ok(new { books, totalCount });
        }

        // GET: api/books/categories
        // Returns all distinct category values for the filter sidebar
        [HttpGet("categories")]
        public async Task<ActionResult> GetCategories()
        {
            var categories = await _context.Books
                .Select(b => b.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }

        // POST: api/books
        // Adds a new book to the database
        [HttpPost]
        public async Task<ActionResult<Book>> AddBook([FromBody] Book book)
        {
            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBooks), new { id = book.BookID }, book);
        }

        // PUT: api/books/{id}
        // Updates an existing book in the database
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateBook(int id, [FromBody] Book book)
        {
            if (id != book.BookID)
            {
                return BadRequest("Book ID in URL does not match the book object.");
            }

            _context.Entry(book).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Books.AnyAsync(b => b.BookID == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/books/{id}
        // Removes a book from the database
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteBook(int id)
        {
            var book = await _context.Books.FindAsync(id);

            if (book == null)
            {
                return NotFound();
            }

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
using BooksAPI.Data;
using BooksAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BooksAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly BookstoreContext _context;

        // Inject the database context
        public BooksController(BookstoreContext context)
        {
            _context = context;
        }

        // GET: api/books?page=1&pageSize=5&sortOrder=asc&category=Fiction
        // Returns a paginated, sorted, and optionally filtered list of books
        [HttpGet]
        public async Task<ActionResult> GetBooks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string? category = null)
        {
            // Start with the full books query
            IQueryable<Book> query = _context.Books;

            // Filter by category if one was provided (empty string means "all")
            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(b => b.Category == category);
            }

            // Sort by title ascending or descending
            query = sortOrder == "desc"
                ? query.OrderByDescending(b => b.Title)
                : query.OrderBy(b => b.Title);

            // Get total count (after filtering) for pagination math in the frontend
            int totalCount = await query.CountAsync();

            // Apply pagination: skip records before this page, take only this page's records
            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Return both the books and total count so the frontend can build page links
            return Ok(new { books, totalCount });
        }

        // GET: api/books/categories
        // Returns all distinct category values for the filter sidebar
        [HttpGet("categories")]
        public async Task<ActionResult> GetCategories()
        {
            var categories = await _context.Books
                .Select(b => b.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }
    }
}
