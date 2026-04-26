package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
	"github.com/resend/resend-go/v3"
)

type orderItemRequest struct {
	MenuItemID int32  `json:"menu_item_id"`
	Quantity   int32  `json:"quantity"`
	Size       string `json:"size"`
}

type createOrderRequest struct {
	CustomerName    string             `json:"customer_name"`
	CustomerPhone   string             `json:"customer_phone"`
	CustomerAddress string             `json:"customer_address"`
	OrderType       string             `json:"order_type"`
	Comment         string             `json:"comment"`
	Items           []orderItemRequest `json:"items"`
}

type orderItemSnapshot struct {
	MenuItemID int32   `json:"menu_item_id"`
	Name       string  `json:"name"`
	Quantity   int32   `json:"quantity"`
	Size       string  `json:"size"`
	UnitPrice  float64 `json:"unit_price"`
	TotalPrice float64 `json:"total_price"`
}

// validate checks the integrity of the order request.
// It enforces that delivery orders must have an address.
// Norwegian phone numbers are validated as exactly 8 digits (spaces stripped).
func (req *createOrderRequest) validate() string {
	if strings.TrimSpace(req.CustomerName) == "" {
		return "customer_name is required"
	}
	if strings.TrimSpace(req.CustomerPhone) == "" {
		return "customer_phone is required"
	}
	// Norwegian phone numbers are always 8 digits. We strip spaces and the
	// international prefix (+47) to handle formats like "123 45 678" or
	// "+47 123 45 678".
	phoneCleaned := strings.ReplaceAll(req.CustomerPhone, " ", "")
	phoneCleaned = strings.TrimPrefix(phoneCleaned, "+47")
	if len(phoneCleaned) != 8 {
		return "customer_phone must be 8 digits"
	}
	if req.OrderType != "delivery" && req.OrderType != "pickup" {
		return "order_type must be 'delivery' or 'pickup'"
	}
	if req.OrderType == "delivery" && strings.TrimSpace(req.CustomerAddress) == "" {
		return "customer_address is required for delivery"
	}
	if len(req.Items) == 0 {
		return "items cannot be empty"
	}
	for _, item := range req.Items {
		if item.MenuItemID <= 0 {
			return "invalid menu_item_id"
		}
		if item.Quantity <= 0 {
			return "quantity must be greater than 0"
		}
		if item.Size != "small" && item.Size != "large" {
			return "size must be 'small' or 'large'"
		}
	}
	return ""
}

// CreateOrder processes a new customer order.
//
// Critical security decision: prices are NEVER taken from the client request.
// Instead, we fetch current prices from the database and calculate totals
// server-side. This prevents price manipulation attacks where a malicious
// client submits a lower price.
//
// Flow:
// 1. Validate input fields.
// 2. Check if the shop is open (settings + business hours).
// 3. Fetch current item prices from DB (snapshots) and calculate total.
// 4. Save order to database.
// 5. Send email notification to the restaurant (async goroutine).
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req createOrderRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	if errMsg := req.validate(); errMsg != "" {
		respondBadRequest(w, errMsg)
		return
	}

	// Check if shop is open according to settings and business hours
	if open, msg, err := h.checkShopOpen(ctx); err != nil {
		log.Printf("CreateOrder: failed to check shop status: %v", err)
		respondInternalError(w)
		return
	} else if !open {
		respondBadRequest(w, msg)
		return
	}

	// buildOrderSnapshots fetches current item data to calculate totals
	// and verify availability. Never trust prices sent from the frontend.
	snapshots, totalPrice, err := h.buildOrderSnapshots(ctx, req.Items)
	if err != nil {
		log.Printf("CreateOrder: failed to build snapshots: %v", err)
		if strings.Contains(err.Error(), "not found") {
			respondBadRequest(w, err.Error())
			return
		}
		respondInternalError(w)
		return
	}

	itemsJSON, err := json.Marshal(snapshots)
	if err != nil {
		log.Printf("CreateOrder: failed to marshal items: %v", err)
		respondInternalError(w)
		return
	}

	order, err := h.queries.CreateOrder(ctx, generated.CreateOrderParams{
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		OrderType:       generated.OrderType(req.OrderType),
		Items:           itemsJSON,
		TotalPrice:      floatToNumeric(totalPrice),
		Comment:         &req.Comment,
	})
	if err != nil {
		log.Printf("CreateOrder: failed to save order: %v", err)
		respondInternalError(w)
		return
	}

	// Email is sent in a background goroutine so the HTTP response is not
	// blocked by the external API call to Resend. If the email fails,
	// we log the error but do not fail the order — the restaurant can
	// still see the order in the admin panel.
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("CreateOrder: panic in sendOrderEmail goroutine: %v", r)
			}
		}()
		if err := h.sendOrderEmail(order, snapshots); err != nil {
			log.Printf("CreateOrder: failed to send email for order %d: %v", order.ID, err)
		}
	}()

	respondData(w, http.StatusCreated, toOrderResponse(order))
}

// checkShopOpen verifies that the restaurant is currently accepting orders.
// It checks two conditions:
//  1. The manual "is_open" toggle in settings (for closures/holidays).
//  2. The configured opening hours (open_time/close_time).
//
// Timezone is Europe/Oslo, with UTC fallback if the system timezone DB is
// not available (e.g. in minimal Docker images missing tzdata).
func (h *Handler) checkShopOpen(ctx context.Context) (bool, string, error) {
	rows, err := h.queries.GetAllSettings(ctx)
	if err != nil {
		return false, "", err
	}

	settings := make(map[string]string)
	for _, row := range rows {
		settings[row.Key] = row.Value
	}

	if settings["is_open"] == "false" {
		return false, "The shop is closed for new orders", nil
	}

	openTime := settings["open_time"]
	closeTime := settings["close_time"]
	if openTime == "" || closeTime == "" {
		// Default hours are used as a safety net if settings haven't been
		// configured yet (e.g. after a fresh DB migration).
		openTime = "14:00"
		closeTime = "22:00"
	}

	loc, err := time.LoadLocation("Europe/Oslo")
	if err != nil {
		// Fallback to UTC if timezone data is missing — the Dockerfile
		// installs tzdata, but a minimal base image might not have it.
		log.Printf("checkShopOpen: failed to load Europe/Oslo: %v", err)
		loc = time.UTC
	}

	now := time.Now().In(loc)
	currentMinutes := now.Hour()*60 + now.Minute()

	// parseTime converts "HH:MM" to total minutes since midnight.
	// This avoids time-of-day comparison pitfalls with string sorting.
	parseTime := func(t string) (int, error) {
		parts := strings.Split(t, ":")
		if len(parts) != 2 {
			return 0, fmt.Errorf("invalid time format")
		}
		hourVal, err := strconv.Atoi(parts[0])
		if err != nil {
			return 0, err
		}
		m, err := strconv.Atoi(parts[1])
		if err != nil {
			return 0, err
		}
		return hourVal*60 + m, nil
	}

	openMinutes, err := parseTime(openTime)
	if err != nil {
		return false, "", fmt.Errorf("invalid open_time: %w", err)
	}

	closeMinutes, err := parseTime(closeTime)
	if err != nil {
		return false, "", fmt.Errorf("invalid close_time: %w", err)
	}

	if currentMinutes < openMinutes || currentMinutes >= closeMinutes {
		return false, fmt.Sprintf("The shop is currently closed. Opening hours: %s - %s", openTime, closeTime), nil
	}

	return true, "", nil
}

// buildOrderSnapshots fetches current menu item data from the DB and
// calculates line-item totals server-side. This is the security-critical
// function that prevents price manipulation — the frontend only sends
// item IDs, quantities, and sizes; all prices come from the database.
func (h *Handler) buildOrderSnapshots(
	ctx context.Context,
	items []orderItemRequest,
) ([]orderItemSnapshot, float64, error) {
	snapshots := make([]orderItemSnapshot, 0, len(items))
	var totalPrice float64

	for _, item := range items {
		menuItem, err := h.queries.GetMenuItemByID(ctx, item.MenuItemID)
		if err != nil {
			return nil, 0, fmt.Errorf("menu item %d not found", item.MenuItemID)
		}

		if !menuItem.IsAvailable {
			return nil, 0, fmt.Errorf("menu item '%s' is not available", menuItem.Name)
		}

		unitPrice, err := resolvePrice(menuItem, item.Size)
		if err != nil {
			return nil, 0, fmt.Errorf("menu item '%s': %w", menuItem.Name, err)
		}

		itemTotal := unitPrice * float64(item.Quantity)
		totalPrice += itemTotal

		snapshots = append(snapshots, orderItemSnapshot{
			MenuItemID: menuItem.ID,
			Name:       menuItem.Name,
			Quantity:   item.Quantity,
			Size:       item.Size,
			UnitPrice:  unitPrice,
			TotalPrice: itemTotal,
		})
	}

	return snapshots, totalPrice, nil
}

// resolvePrice determines which price (small/large) to use based on the requested size.
// It returns an error if the requested size has no price defined in the DB.
//
// Discount prices (discount_price_small/large) take priority when set.
// If no discount price is defined for the requested size, the regular price is used.
func resolvePrice(item generated.MenuItem, size string) (float64, error) {
	switch size {
	case "small":
		// Discount price takes priority if set
		if item.DiscountPriceSmall.Valid {
			f, err := item.DiscountPriceSmall.Float64Value()
			if err != nil {
				return 0, fmt.Errorf("failed to convert discount small price: %w", err)
			}
			return f.Float64, nil
		}
		// Fall back to regular price
		if pgNumericToPtr(item.PriceSmall) == nil {
			return 0, fmt.Errorf("size 'small' is not available")
		}
		f, err := item.PriceSmall.Float64Value()
		if err != nil {
			return 0, fmt.Errorf("failed to convert small price: %w", err)
		}
		return f.Float64, nil
	case "large":
		// Discount price takes priority if set
		if item.DiscountPriceLarge.Valid {
			f, err := item.DiscountPriceLarge.Float64Value()
			if err != nil {
				return 0, fmt.Errorf("failed to convert discount large price: %w", err)
			}
			return f.Float64, nil
		}
		// Fall back to regular price
		if !item.PriceLarge.Valid {
			return 0, fmt.Errorf("size 'large' is not available")
		}
		f, err := item.PriceLarge.Float64Value()
		if err != nil {
			return 0, fmt.Errorf("failed to convert large price: %w", err)
		}
		return f.Float64, nil
	default:
		return 0, fmt.Errorf("unknown size '%s'", size)
	}
}

// floatToNumeric converts a float64 to pgtype.Numeric for PostgreSQL storage.
// The conversion goes through a formatted string ("%.2f") to ensure
// the value stored in the database has at most 2 decimal places,
// matching the expected currency precision.
func floatToNumeric(f float64) pgtype.Numeric {
	n := pgtype.Numeric{}
	if err := n.Scan(fmt.Sprintf("%.2f", f)); err != nil {
		log.Printf("floatToNumeric: failed to scan value %.2f: %v", f, err)
	}
	return n
}

// sendOrderEmail generates an HTML email for the restaurant owners.
// It uses Resend and falls back gracefully if the API key is missing
// (e.g. in development or CI environments).
//
// The email is written in Norwegian (Norsk) since the restaurant staff
// are located in Notodden, Norway.
func (h *Handler) sendOrderEmail(order generated.Order, items []orderItemSnapshot) error {
	if h.config.ResendApiKey == "" {
		log.Println("sendOrderEmail: RESEND_API_KEY is not set, skipping email")
		return nil
	}
	if h.config.OrderEmailFrom == "" {
		log.Println("sendOrderEmail: ORDER_EMAIL_FROM is not set, skipping email")
		return nil
	}
	if h.config.OrderEmailTo == "" {
		log.Println("sendOrderEmail: ORDER_EMAIL_TO is not set, skipping email")
		return nil
	}

	f, err := order.TotalPrice.Float64Value()
	if err != nil {
		log.Printf("sendOrderEmail: failed to convert total price: %v", err)
		return fmt.Errorf("failed to convert total price: %w", err)
	}
	totalPrice := f.Float64

	var itemsHtml strings.Builder
	for _, item := range items {
		sizeStr := ""
		switch item.Size {
		case "large":
			sizeStr = " (Stor)"
		case "small":
			sizeStr = " (Liten)"
		}

		itemsHtml.WriteString(fmt.Sprintf(
			"<li><strong>%s%s</strong> x %d — %.2f NOK</li>",
			item.Name, sizeStr, item.Quantity, item.TotalPrice,
		))
	}

	addressLine := ""
	if order.OrderType == "delivery" {
		addressLine = fmt.Sprintf("<p><strong>Adresse:</strong> %s</p>", order.CustomerAddress)
	}

	commentLine := ""
	if order.Comment != nil && *order.Comment != "" {
		commentLine = fmt.Sprintf("<p><strong>Kommentar:</strong> %s</p>", *order.Comment)
	}

	htmlContent := fmt.Sprintf(`
		<h1>Ny bestilling #%d</h1>
		<p><strong>Kunde:</strong> %s</p>
		<p><strong>Telefon:</strong> %s</p>
		%s
		<p><strong>Type:</strong> %s</p>
		%s
		<hr />
		<ul>
			%s
		</ul>
		<p><strong>Totalpris: %.2f NOK</strong></p>
	`,
		order.ID,
		order.CustomerName,
		order.CustomerPhone,
		addressLine,
		order.OrderType,
		commentLine,
		itemsHtml.String(),
		totalPrice,
	)

	params := &resend.SendEmailRequest{
		From:    h.config.OrderEmailFrom,
		To:      []string{h.config.OrderEmailTo},
		Subject: fmt.Sprintf("Ny bestilling #%d - %s", order.ID, order.CustomerName),
		Html:    htmlContent,
	}

	_, err = h.resend.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email via Resend: %w", err)
	}

	log.Printf("sendOrderEmail: email sent for order #%d", order.ID)
	return nil
}

type orderResponse struct {
	ID              int32               `json:"id"`
	CustomerName    string              `json:"customer_name"`
	CustomerPhone   string              `json:"customer_phone"`
	CustomerAddress string              `json:"customer_address"`
	OrderType       string              `json:"order_type"`
	OrderStatus     string              `json:"order_status"`
	Items           []orderItemSnapshot `json:"items"`
	TotalPrice      float64             `json:"total_price"`
	Comment         *string             `json:"comment"`
	CreatedAt       pgtype.Timestamp    `json:"created_at"`
}

func toOrderResponse(o generated.Order) orderResponse {
	var items []orderItemSnapshot
	if err := json.Unmarshal(o.Items, &items); err != nil {
		log.Printf("toOrderResponse: failed to unmarshal items for order %d: %v", o.ID, err)
	}

	f, err := o.TotalPrice.Float64Value()
	if err != nil {
		log.Printf("toOrderResponse: failed to convert total price for order %d: %v", o.ID, err)
	}

	return orderResponse{
		ID:              o.ID,
		CustomerName:    o.CustomerName,
		CustomerPhone:   o.CustomerPhone,
		CustomerAddress: o.CustomerAddress,
		OrderType:       string(o.OrderType),
		OrderStatus:     string(o.OrderStatus),
		Items:           items,
		TotalPrice:      f.Float64,
		Comment:         o.Comment,
		CreatedAt:       o.CreatedAt,
	}
}

// ---------------------------------------------------------------------------
// Admin Order Handlers
// ---------------------------------------------------------------------------

func (h *Handler) AdminGetOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := h.queries.GetOrders(r.Context())
	if err != nil {
		log.Printf("AdminGetOrders: %v", err)
		respondInternalError(w)
		return
	}

	response := make([]orderResponse, 0, len(orders))
	for _, o := range orders {
		response = append(response, toOrderResponse(o))
	}

	respondData(w, http.StatusOK, response)
}

type updateOrderStatusRequest struct {
	Status string `json:"status"`
}

func (h *Handler) AdminUpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondBadRequest(w, "invalid order id")
		return
	}

	var req updateOrderStatusRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	order, err := h.queries.UpdateOrderStatus(r.Context(), generated.UpdateOrderStatusParams{
		ID:          int32(id),
		OrderStatus: generated.OrderStatus(req.Status),
	})
	if err != nil {
		log.Printf("AdminUpdateOrderStatus: %v", err)
		respondInternalError(w)
		return
	}

	respondData(w, http.StatusOK, toOrderResponse(order))
}

// AdminGetStats returns today's order count and total revenue for the admin dashboard.
// The query aggregates data from the current calendar day (midnight-to-midnight)
// in the restaurant's local timezone (Europe/Oslo), not UTC.
func (h *Handler) AdminGetStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	loc, err := time.LoadLocation("Europe/Oslo")
	if err != nil {
		log.Printf("AdminGetStats: failed to load timezone: %v", err)
		respondInternalError(w)
		return
	}
	now := time.Now().In(loc)
	osloMidnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	stats, err := h.queries.GetTodayStats(ctx, osloMidnight)
	if err != nil {
		log.Printf("AdminGetStats: database query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "failed to fetch stats")
		return
	}

	revenue, err := stats.TotalRevenue.Float64Value()
	if err != nil {
		log.Printf("AdminGetStats: numeric conversion failed: %v", err)
		respondError(w, http.StatusInternalServerError, "failed to process revenue data")
		return
	}

	respondData(w, http.StatusOK, map[string]any{
		"total_orders":  stats.TotalOrders,
		"total_revenue": revenue.Float64,
	})
}
