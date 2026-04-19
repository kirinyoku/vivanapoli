DB_URL=postgres://postgres:postgres@localhost:5432/vivanapoli?sslmode=disable

migrate-up:
	migrate -path internal/db/migrations -database "$(DB_URL)" up
migrate-down:
	migrate -path internal/db/migrations -database "$(DB_URL)" down
migrate-create:
	migrate create -ext sql -dir internal/db/migrations -seq $(name)

sqlc:
	cd internal/db && sqlc generate

seed:
	go run ./cmd/seed

server:
	go run ./cmd/server	
