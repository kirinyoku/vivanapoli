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

type createOrderResponse struct {
	ID         int32               `json:"id"`
	Status     string              `json:"status"`
	TotalPrice float64             `json:"total_price"`
	Items      []orderItemSnapshot `json:"items"`
}

// validate checks the integrity of the order request.
// It enforces that delivery orders must have an address.
func (req *createOrderRequest) validate() string {
	if strings.TrimSpace(req.CustomerName) == "" {
		return "customer_name is required"
	}
	if strings.TrimSpace(req.CustomerPhone) == "" {
		return "customer_phone is required"
	}
	// Basic validation for Norwegian phone numbers (8 digits)
	phoneCleaned := strings.ReplaceAll(req.CustomerPhone, " ", "")
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
// 1. Validates input.
// 2. Fetches current prices from DB (snapshots).
// 3. Saves to database.
// 4. Sends email notification to the restaurant (asynchronously).
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

	// We send the email in a separate goroutine so the user doesn't
	// have to wait for the email service to respond.
	go func() {
		if err := h.sendOrderEmail(order, snapshots); err != nil {
			log.Printf("CreateOrder: failed to send email for order %d: %v", order.ID, err)
		}
	}()

	respondData(w, http.StatusCreated, toOrderResponse(order))
}

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
		// Use defaults if not set in DB
		openTime = "14:00"
		closeTime = "22:00"
	}

	loc, err := time.LoadLocation("Europe/Oslo")
	if err != nil {
		// Fallback to UTC if timezone data is missing, but log it
		log.Printf("checkShopOpen: failed to load Europe/Oslo: %v", err)
		loc = time.UTC
	}

	now := time.Now().In(loc)
	currentMinutes := now.Hour()*60 + now.Minute()

	parseTime := func(t string) (int, error) {
		parts := strings.Split(t, ":")
		if len(parts) != 2 {
			return 0, fmt.Errorf("invalid time format")
		}
		h, err := strconv.Atoi(parts[0])
		if err != nil {
			return 0, err
		}
		m, err := strconv.Atoi(parts[1])
		if err != nil {
			return 0, err
		}
		return h*60 + m, nil
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
func resolvePrice(item generated.MenuItem, size string) (float64, error) {
	switch size {
	case "small":
		if pgNumericToPtr(item.PriceSmall) == nil || !item.PriceSmall.Valid {
			return 0, fmt.Errorf("size 'small' is not available")
		}
		f, _ := item.PriceSmall.Float64Value()
		return f.Float64, nil
	case "large":
		if !item.PriceLarge.Valid {
			return 0, fmt.Errorf("size 'large' is not available")
		}
		f, _ := item.PriceLarge.Float64Value()
		return f.Float64, nil
	default:
		return 0, fmt.Errorf("unknown size '%s'", size)
	}
}

func floatToNumeric(f float64) pgtype.Numeric {
	n := pgtype.Numeric{}
	_ = n.Scan(fmt.Sprintf("%.2f", f))
	return n
}

// sendOrderEmail generates an HTML email for the restaurant owners.
// It uses Resend and falls back gracefully if the API key is missing.
func (h *Handler) sendOrderEmail(order generated.Order, items []orderItemSnapshot) error {
	if h.config.ResendApiKey == "" {
		log.Println("sendOrderEmail: RESEND_API_KEY is not set, skipping email")
		return nil
	}

	f, _ := order.TotalPrice.Float64Value()
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

	_, err := h.resend.Emails.Send(params)
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
	_ = json.Unmarshal(o.Items, &items)

	f, _ := o.TotalPrice.Float64Value()

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

// Admin Order Handlers
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

func (h *Handler) AdminGetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.queries.GetTodayStats(r.Context())
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
