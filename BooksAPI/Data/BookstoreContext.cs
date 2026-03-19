using BooksAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BooksAPI.Data
{
    // EF Core DbContext -- connects the app to the Bookstore SQLite database
    public class BookstoreContext : DbContext
    {
        public BookstoreContext(DbContextOptions<BookstoreContext> options) : base(options) { }

        // Maps to the Books table
        public DbSet<Book> Books { get; set; }
    }
}
