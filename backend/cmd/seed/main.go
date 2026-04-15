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

	log.Println("Seeding restaurant settings...")
	seedSettings(ctx, q)

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
		{"Calzone", "calzone", 2},
		{"Ekstra Dressing", "ekstra-dressing", 3},
		{"Mexikansk Pizza", "mexikansk-pizza", 4},
		{"Pizza Nyheter", "pizza-nyheter", 5},
		{"Burgers", "burgers", 6},
		{"Kebab", "kebab", 7},
		{"Barnemeny", "barnemeny", 8},
		{"Drikke", "drikke", 9},
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
		// 1. PIZZA
		{CategorySlug: "pizza", Name: "Notodden Pizza", Description: "Tomatsaus, ost, biff, løk, paprika (inkl. dressing)", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Kebabpizza", Description: "Tomatsaus, ost, kebab, sjampinjong, løk (inkl. dressing)", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Viva Napoli", Description: "Tomatsaus, ost, skinke, biff, kjøttdeig, løk, pepperoni, sjampinjong", PriceSmall: p(120), PriceLarge: 230, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Lillestrøm", Description: "Tomatsaus, ost, skinke, sjampinjong, ananas", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Capricoza", Description: "Tomatsaus, ost, skinke, sjampinjong", PriceSmall: p(100), PriceLarge: 160, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Vesuvio", Description: "Tomatsaus, ost, skinke", PriceSmall: p(80), PriceLarge: 150, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Hawaii", Description: "Tomatsaus, ost, skinke, ananas", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Viking", Description: "Tomatsaus, ost, skinke, løk, sjampinjong, paprika", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Dilan", Description: "Tomatsaus, ost, kjøttdeig, løk, paprika, hvitløк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Matado", Description: "Tomatsaus, ost, pepperoni, sjampinjong", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Napoletana", Description: "Tomatsaus, ost, biff, kjøttdeig, sjampinjong, paprika, løк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Rimini", Description: "Tomatsaus, ost, skinke, løк, bacon", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Torino", Description: "Tomatsaus, ost, skinke, kjøttdeig og salami", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Husets Pizza", Description: "Tomatsaus, ost, biff, sjampinjong, bearnaise saus", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Alsten", Description: "Tomatsaus, ost, pepperoni, løк, kjøttdeig", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Vegetarian", Description: "Tomatsaus, ost, sjampinjong, paprika, løк, oliven, ananas, tomatskiver", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Siena", Description: "Tomatsaus, ost, biff, jalapenos, løк, tomatskiver, sjampinjong", PriceSmall: p(120), PriceLarge: 230, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza", Name: "Vålerenga", Description: "Tomatsaus, ost, pepperoni, skinke og bacon", PriceSmall: p(120), PriceLarge: 230, Allergens: []string{"gluten"}},

		// 2. CALZONE
		{CategorySlug: "calzone", Name: "Roma", Description: "Tomatsaus, ost, biff, løк, kjøttdeig og sjampinjong", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "calzone", Name: "Calzone", Description: "Tomatsaus, ost, skinke", PriceSmall: p(80), PriceLarge: 150, Allergens: []string{"gluten"}},
		{CategorySlug: "calzone", Name: "Ciao Ciao", Description: "Tomatsaus, ost, skinke, løк, sjampinjong, hvitløк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},

		// 3. EKSTRA DRESSING
		{CategorySlug: "ekstra-dressing", Name: "Hvitløкsdressing", Description: "I beger", PriceLarge: 20, Allergens: []string{"melк"}},
		{CategorySlug: "ekstra-dressing", Name: "Sterк Saus", Description: "I beger", PriceLarge: 20, Allergens: []string{}},
		{CategorySlug: "ekstra-dressing", Name: "Bernaise", Description: "I beger", PriceLarge: 20, Allergens: []string{"melк", "egg"}},

		// 4. MEXIKANSK PIZZA
		{CategorySlug: "mexikansk-pizza", Name: "Supersterк", Description: "Tomatsaus, ost, biff, salami, løк, sjampinjong, chilli", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Diablo", Description: "Tomatsaus, ost, kjøttdeig, paprika, løк, sjampinjong, chilli", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Amigo", Description: "Tomatsaus, ost, chilli, kjøttdeig, paprika", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Toko", Description: "Tomatsaus, ost, skinke, kjøttdeig, pepperoni, ananas, chilli", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Lag din egen", Description: "6 ingredienser inкl. ost eller fifty-fifty", PriceSmall: p(120), PriceLarge: 230, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Kylling Pizza", Description: "Tomatsaus, ost, løк, sjampinjong, kyllingfillet", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Bonne Pizza Spesial", Description: "Tomatsaus, ost, indrefilet, soltørкet tomat, løк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Rosenborg", Description: "Tomatsaus, ost, biffкjøtt, skinke, bacon og løк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Taco Pizza", Description: "Tomatsaus, ost, tacosaus, kjøttdeig, sjampinjong, jalapenos, løк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Milano", Description: "Ost, creme fraiche, tomatsкiver, oliven, ruccola, marinert biff", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Siciliana", Description: "Ost, creme fraiche, tomatsкiver, skinke, sjampinjong, paprika", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Al Formiagi", Description: "Tomatsaus, norvegia, parmesan, mozarella, gorgonzola, sjampinjong, ruccola", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Venezia", Description: "Tomatsaus, ost, marinert biff, sjampinjong, paprika, løк, tomatsкiver, ruccola", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Glutenfri", Description: "Kun Medium. Sкriv ønsкet nummer i кommentarfeltet", PriceLarge: 160, Allergens: []string{}},
		{CategorySlug: "mexikansk-pizza", Name: "Bjørne Pizza", Description: "Tomatsaus, ost, skinke, biff, kjøttdeig, bacon, løк, sjampinjong, paprika, pepperoni, oliven", PriceSmall: p(180), PriceLarge: 280, Allergens: []string{"gluten"}},
		{CategorySlug: "mexikansk-pizza", Name: "Margarita", Description: "Tomatsaus, ost", PriceSmall: p(80), PriceLarge: 150, Allergens: []string{"gluten"}},

		// 5. PIZZA NYHETER
		{CategorySlug: "pizza-nyheter", Name: "Berger Spesial", Description: "Tomatsaus, ost, biffкjøtt, sjampinjong og løк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Vegetar Spesial", Description: "Tomatsaus, ost, auberginer, hvitløк, tomatsкiver, oliven, ruccola", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "NIF", Description: "Tomatsaus, ost, кjøttboller, hvitløк, skinke, løк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Hellviк", Description: "Tomatsaus, fetaost, biffкjøtt, tomatsкiver", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Jan", Description: "Tomatsaus, ost, biffкjøtt, skinke, løк, paprika, chilli", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Mafia", Description: "Tomatsaus, ost, biffкjøtt, løк, pesto, jalapenos", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Argentina", Description: "Tomatsaus, ost, biffкjøtt, bacon, кjøttboller", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Tortilla", Description: "Ost, creme fraiche, biffкjøtt, tortillachips, cachewnøtter", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Romano", Description: "Tomatsaus, ost, кylling, soltørкet tomat, hvitløк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Italiano", Description: "Tomatsaus, ost, кylling, tomatsкiver, jalapenos, hvitløк", PriceSmall: p(100), PriceLarge: 180, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Mix Pizza", Description: "Tomatsaus, ost, кylling, biffкjøtt, кjøttdeig, løк, hvitløк", PriceSmall: p(120), PriceLarge: 320, Allergens: []string{"gluten"}},
		{CategorySlug: "pizza-nyheter", Name: "Vegansк Pizza", Description: "Valgfri fra meny. Velgfri glutenfri", PriceSmall: p(160), PriceLarge: 230, Allergens: []string{}},

		// 6. BURGERS
		{CategorySlug: "burgers", Name: "Hamburger 100g", Description: "Salat, dressing, tomat, mais", PriceLarge: 60, Allergens: []string{"gluten", "melк", "sesam"}},
		{CategorySlug: "burgers", Name: "Hamburger 200g", Description: "Salat, dressing, tomat, mais", PriceLarge: 100, Allergens: []string{"gluten", "melк", "sesam"}},
		{CategorySlug: "burgers", Name: "Hamburger 300g", Description: "Salat, dressing, tomat, mais", PriceLarge: 140, Allergens: []string{"gluten", "melк", "sesam"}},
		{CategorySlug: "burgers", Name: "Hamburger 400g", Description: "Salat, dressing, tomat, mais", PriceLarge: 180, Allergens: []string{"gluten", "melк", "sesam"}},
		{CategorySlug: "burgers", Name: "Kyllingburger 120g", Description: "Meny med pommes frites", PriceLarge: 100, Allergens: []string{"gluten", "melк", "selleri"}},
		{CategorySlug: "burgers", Name: "Pommes Frites", Description: "Porsjon", PriceLarge: 25, Allergens: []string{"selleri"}},

		// 7. KEBAB
		{CategorySlug: "kebab", Name: "Kebab i Pita", Description: "Salat, mais, hvitløкdressing", PriceLarge: 80, Allergens: []string{"gluten", "melк"}},
		{CategorySlug: "kebab", Name: "Kebabrull", Description: "Salat, jalapenos, tomat, hvitløкdressing", PriceLarge: 90, Allergens: []string{"gluten", "melк"}},
		{CategorySlug: "kebab", Name: "Kebabtallerкen", Description: "Salat, jalapenos, tomat, hvitløкdressing, mais, pommes frites", PriceLarge: 100, Allergens: []string{"gluten", "melк", "selleri"}},
		{CategorySlug: "kebab", Name: "Kylling Nuggets (8 stк)", Description: "Med hvitløкdressing og pommes frites", PriceLarge: 100, Allergens: []string{"gluten", "melк", "selleri"}},
		{CategorySlug: "kebab", Name: "Kylling Snadder", Description: "Kylling, paprika, løк, sjampinjong, pommes frites, bearnaise", PriceLarge: 180, Allergens: []string{"gluten", "melк", "selleri", "egg"}},
		{CategorySlug: "kebab", Name: "Biff Snadder", Description: "Oкseкjøtt, løк, sjampinjong, paprika, pommes frites, bearnaise", PriceLarge: 180, Allergens: []string{"gluten", "melк", "selleri", "egg"}},

		// 8. BARNEMENY
		{CategorySlug: "barnemeny", Name: "Barnepizza m/skinke", Description: "Tomatsaus, ost, skinke", PriceLarge: 50, Allergens: []string{"gluten", "melк"}},
		{CategorySlug: "barnemeny", Name: "Barnepizza m/кjøttdeig", Description: "Kan serveres med grønnsaker", PriceLarge: 50, Allergens: []string{"gluten", "melк"}},
		{CategorySlug: "barnemeny", Name: "Pølse m/ Pommes Frites", Description: "Pølse og pommes frites", PriceLarge: 50, Allergens: []string{"gluten", "melк", "selleri"}},
		{CategorySlug: "barnemeny", Name: "Hamburger m/ Pommes Frites", Description: "Inкluderer liten Kuli", PriceLarge: 70, Allergens: []string{"gluten", "melк", "sesam", "selleri"}},

		// 9. DRIKKE
		{CategorySlug: "drikke", Name: "Coca-Cola 0,5L", Description: "Kald driккe", PriceLarge: 30, Allergens: []string{}},
		{CategorySlug: "drikke", Name: "Coca-Cola Zero 0,5L", Description: "Kald driккe", PriceLarge: 30, Allergens: []string{}},
		{CategorySlug: "drikke", Name: "Fanta 0,5L", Description: "Kald driккe", PriceLarge: 30, Allergens: []string{}},
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
// Restaurant Settings
// -----------------------------------------------------------------------

func seedSettings(ctx context.Context, q *generated.Queries) {
	settings := map[string]string{
		"address":       "Storgata 74, 3674 Notodden",
		"phone":         "47 48 44 44",
		"open_time":     "14:00",
		"close_time":    "21:00",
		"delivery_time": "60 min",
		"is_open":       "true",
	}

	for key, value := range settings {
		err := q.UpdateSetting(ctx, generated.UpdateSettingParams{
			Key:   key,
			Value: value,
		})
		if err != nil {
			log.Fatalf("  Failed to update setting '%s': %v", key, err)
		}
		log.Printf("  Updated setting '%s' to '%s'", key, value)
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
