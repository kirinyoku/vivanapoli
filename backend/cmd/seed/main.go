package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/kirinyoku/vivanapoli/backend/internal/config"
	"github.com/kirinyoku/vivanapoli/backend/internal/db"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.NewPool(cfg.DBUrl)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	q := db.NewQueries(pool)

	log.Println("Seeding categories...")
	seedCategories(ctx, q)

	log.Println("Seeding menu items...")
	seedMenuItems(ctx, q)

	log.Println("Seeding admin user...")
	seedAdminUser(ctx, q, cfg)

	log.Println("Done!")
}

// -----------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------

type categoryInput struct {
	Name  string
	Slug  string
	Order int32
}

func seedCategories(ctx context.Context, q *generated.Queries) {
	categories := []categoryInput{
		{"Pizza", "pizza", 1},
		{"Mexikansk Pizza", "mexikansk-pizza", 2},
		{"Pizza Nyheter", "pizza-nyheter", 3},
		{"Calzone", "calzone", 4},
		{"Burgers", "burgers", 5},
		{"Kebab", "kebab", 6},
		{"Barnemeny", "barnemeny", 7},
		{"Drikke", "drikke", 8},
	}

	for _, c := range categories {
		existing, err := q.GetCategoryBySlug(ctx, c.Slug)
		if err == nil {
			log.Printf("  Skipping category '%s' (already exists, id=%d)", existing.Name, existing.ID)
			continue
		}

		created, err := q.CreateCategory(ctx, generated.CreateCategoryParams{
			Name:      c.Name,
			Slug:      c.Slug,
			SortOrder: c.Order,
		})
		if err != nil {
			log.Fatalf("  Failed to create category '%s': %v", c.Name, err)
		}
		log.Printf("  Created category '%s' (id=%d)", created.Name, created.ID)
	}
}

// -----------------------------------------------------------------------
// Menu Items
// -----------------------------------------------------------------------

type menuItemInput struct {
	CategorySlug string
	Name         string
	Description  string
	PriceSmall   *float64
	PriceLarge   float64
	Allergens    []string
}

func p(v float64) *float64 { return &v }

func seedMenuItems(ctx context.Context, q *generated.Queries) {
	items := []menuItemInput{
		// Pizza
		{
			CategorySlug: "pizza",
			Name:         "Margherita",
			Description:  "Tomatsaus, ost",
			PriceSmall:   p(139),
			PriceLarge:   239,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "pizza",
			Name:         "Capricciosa",
			Description:  "Tomatsaus, ost, skinke, sjampinjong",
			PriceSmall:   p(159),
			PriceLarge:   259,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "pizza",
			Name:         "Pepperoni",
			Description:  "Tomatsaus, ost, pepperoni",
			PriceSmall:   p(159),
			PriceLarge:   259,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "pizza",
			Name:         "Hawaii",
			Description:  "Tomatsaus, ost, skinke, ananas",
			PriceSmall:   p(159),
			PriceLarge:   259,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "pizza",
			Name:         "Napoli",
			Description:  "Tomatsaus, ost, ansjos, kapers, oliven",
			PriceSmall:   p(159),
			PriceLarge:   259,
			Allergens:    []string{"gluten", "melk", "fisk"},
		},
		{
			CategorySlug: "pizza",
			Name:         "Vegetar",
			Description:  "Tomatsaus, ost, paprika, løk, sjampinjong, mais, oliven",
			PriceSmall:   p(159),
			PriceLarge:   259,
			Allergens:    []string{"gluten", "melk"},
		},
		// Mexikansk Pizza
		{
			CategorySlug: "mexikansk-pizza",
			Name:         "Mexican",
			Description:  "Tomatsaus, ost, kjøttdeig, jalapeños, paprika, løk",
			PriceSmall:   p(169),
			PriceLarge:   269,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "mexikansk-pizza",
			Name:         "Taco Pizza",
			Description:  "Tomatsaus, ost, kjøttdeig, tortillachips, rømme, salsa",
			PriceSmall:   p(169),
			PriceLarge:   269,
			Allergens:    []string{"gluten", "melk"},
		},
		// Pizza Nyheter
		{
			CategorySlug: "pizza-nyheter",
			Name:         "BBQ Chicken",
			Description:  "BBQ-saus, ost, kylling, rødløk, paprika",
			PriceSmall:   p(169),
			PriceLarge:   279,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "pizza-nyheter",
			Name:         "Pulled Pork",
			Description:  "BBQ-saus, ost, pulled pork, rødløk, jalapeños",
			PriceSmall:   p(179),
			PriceLarge:   289,
			Allergens:    []string{"gluten", "melk"},
		},
		// Calzone
		{
			CategorySlug: "calzone",
			Name:         "Calzone Classico",
			Description:  "Tomatsaus, ost, skinke, sjampinjong",
			PriceLarge:   249,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "calzone",
			Name:         "Calzone Pepperoni",
			Description:  "Tomatsaus, ost, pepperoni, paprika",
			PriceLarge:   259,
			Allergens:    []string{"gluten", "melk"},
		},
		// Burgers
		{
			CategorySlug: "burgers",
			Name:         "Classic Burger",
			Description:  "Storfekjøtt, salat, tomat, løк, dressing",
			PriceLarge:   179,
			Allergens:    []string{"gluten", "melk", "sennep"},
		},
		{
			CategorySlug: "burgers",
			Name:         "Cheese Burger",
			Description:  "Storfekjøtt, cheddar, salat, tomat, løk, dressing",
			PriceLarge:   189,
			Allergens:    []string{"gluten", "melk", "sennep"},
		},
		{
			CategorySlug: "burgers",
			Name:         "BBQ Burger",
			Description:  "Storfekjøtt, cheddar, bacon, BBQ-saus, løkringer",
			PriceLarge:   199,
			Allergens:    []string{"gluten", "melk", "sennep"},
		},
		// Kebab
		{
			CategorySlug: "kebab",
			Name:         "Kebab Tallerken",
			Description:  "Kebabkjøtt, salat, tomat, løк, hvitløkssaus, pommes frites",
			PriceLarge:   189,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "kebab",
			Name:         "Kebab i Pita",
			Description:  "Kebabkjøtt, salat, tomat, løк, hvitløkssaus",
			PriceLarge:   169,
			Allergens:    []string{"gluten", "melk", "sesamfrø"},
		},
		{
			CategorySlug: "kebab",
			Name:         "Kebab Pizza",
			Description:  "Tomatsaus, ost, kebabkjøtt, løk, paprika, hvitløkssaus",
			PriceSmall:   p(169),
			PriceLarge:   279,
			Allergens:    []string{"gluten", "melk"},
		},
		// Barnemeny
		{
			CategorySlug: "barnemeny",
			Name:         "Barnemeny Pizza",
			Description:  "Liten pizza med tomatsaus og ost, serveres med juice",
			PriceLarge:   129,
			Allergens:    []string{"gluten", "melk"},
		},
		{
			CategorySlug: "barnemeny",
			Name:         "Barnemeny Burger",
			Description:  "Liten burger med pommes frites и juice",
			PriceLarge:   129,
			Allergens:    []string{"gluten", "melk"},
		},
		// Drikke
		{
			CategorySlug: "drikke",
			Name:         "Coca-Cola",
			Description:  "0,5 l",
			PriceLarge:   39,
			Allergens:    []string{},
		},
		{
			CategorySlug: "drikke",
			Name:         "Solo",
			Description:  "0,5 l",
			PriceLarge:   39,
			Allergens:    []string{},
		},
		{
			CategorySlug: "drikke",
			Name:         "Farris",
			Description:  "0,5 l",
			PriceLarge:   39,
			Allergens:    []string{},
		},
		{
			CategorySlug: "drikke",
			Name:         "Juice",
			Description:  "Eple eller appelsin, 0,33 l",
			PriceLarge:   29,
			Allergens:    []string{},
		},
	}

	for i, item := range items {
		category, err := q.GetCategoryBySlug(ctx, item.CategorySlug)
		if err != nil {
			log.Fatalf("  Category '%s' not found: %v", item.CategorySlug, err)
		}

		existing, _ := q.GetMenuItemsByCategory(ctx, category.ID)
		alreadyExists := false
		for _, e := range existing {
			if e.Name == item.Name {
				log.Printf("  Skipping '%s' (already exists)", item.Name)
				alreadyExists = true
				break
			}
		}
		if alreadyExists {
			continue
		}

		params := generated.CreateMenuItemParams{
			CategoryID:  category.ID,
			Name:        item.Name,
			Description: pgStringPtr(item.Description),
			PriceLarge:  pgNumeric(item.PriceLarge),
			Allergens:   item.Allergens,
			IsAvailable: true,
			SortOrder:   int32(i + 1),
		}

		if item.PriceSmall != nil {
			params.PriceSmall = pgNumeric(*item.PriceSmall)
		}

		created, err := q.CreateMenuItem(ctx, params)
		if err != nil {
			log.Fatalf("  Failed to create item '%s': %v", item.Name, err)
		}
		log.Printf("  Created '%s' (id=%d)", created.Name, created.ID)
	}
}

// -----------------------------------------------------------------------
// Admin user
// -----------------------------------------------------------------------

func seedAdminUser(ctx context.Context, q *generated.Queries, cfg *config.Config) {
	email := "admin@vivanapoli.no"

	_, err := q.GetAdminByEmail(ctx, email)
	if err == nil {
		log.Printf("  Skipping admin user (already exists)")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("  Failed to hash password: %v", err)
	}

	admin, err := q.CreateAdmin(ctx, generated.CreateAdminParams{
		Email:        email,
		PasswordHash: string(hash),
	})
	if err != nil {
		log.Fatalf("  Failed to create admin: %v", err)
	}

	log.Printf("  Created admin user '%s' (id=%d)", admin.Email, admin.ID)
	log.Println("  Password: admin123  ← change after the first login!")
}

// -----------------------------------------------------------------------
// pgtype helpers
// -----------------------------------------------------------------------

func pgStringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func pgNumeric(v float64) pgtype.Numeric {
	n := pgtype.Numeric{}
	_ = n.Scan(fmt.Sprintf("%.2f", v))
	return n
}
