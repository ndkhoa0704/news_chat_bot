import PostgresService from "../services/postgresService.js";

PostgresService.executeSQL(`
    CREATE TABLE IF NOT EXISTS documents(
        id bigserial PRIMARY KEY,
        name varchar(255) NOT NULL,
        embeddings vector(512) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`)
