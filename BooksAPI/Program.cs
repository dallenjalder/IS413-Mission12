using BooksAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Allow the React frontend (Vite default ports) to call the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register controllers
builder.Services.AddControllers();

// Connect to the Bookstore SQLite database using EF Core
builder.Services.AddDbContext<BookstoreContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Bookstore")));

var app = builder.Build();

// Apply CORS before routing so the frontend can access the API
app.UseCors("AllowReactApp");

app.UseAuthorization();
app.MapControllers();

app.Run();
