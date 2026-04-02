using BooksAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CORS policy -- allows the React frontend to call the API.
// For local development, any localhost origin is allowed.
// IMPORTANT: When deploying to Azure, add your Azure Static Web App URL below
// (without a trailing slash!) so the deployed frontend can reach the API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "http://localhost:4173",   // Vite preview
                "http://localhost:3000",   // fallback dev port
                "https://bookstore-frontend-dallen.azurestaticapps.net" // Azure Static Web App
              )
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
