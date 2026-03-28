package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/kirinyoku/vivanapoli/backend/internal/db/generated"
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

func (req *createOrderRequest) validate() string {
	if strings.TrimSpace(req.CustomerName) == "" {
		return "customer_name is required"
	}
	if strings.TrimSpace(req.CustomerPhone) == "" {
		return "customer_phone is required"
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

	go func() {
		if err := h.sendOrderEmail(order, snapshots); err != nil {
			log.Printf("CreateOrder: failed to send email for order %d: %v", order.ID, err)
		}
	}()

	respondData(w, http.StatusCreated, createOrderResponse{
		ID:         order.ID,
		Status:     string(order.OrderStatus),
		TotalPrice: totalPrice,
		Items:      snapshots,
	})
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

func (h *Handler) sendOrderEmail(order generated.Order, items []orderItemSnapshot) error {
	log.Printf("sendOrderEmail: order #%d, total: %.2f NOK — email not implemented yet",
		order.ID, 0.0)
	return nil
}
