-- Fix duplicate index issues by checking existence before creation

-- Drop and recreate indexes safely
DO $$
BEGIN
    -- Check and create idx_customer_segments_type
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'customer_segments' 
        AND indexname = 'idx_customer_segments_type'
    ) THEN
        CREATE INDEX idx_customer_segments_type ON customer_segments(segment_type);
    END IF;

    -- Check other potentially duplicate indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND indexname = 'idx_transactions_created_at'
    ) THEN
        CREATE INDEX idx_transactions_created_at ON transactions(created_at);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND indexname = 'idx_transactions_store_id'
    ) THEN
        CREATE INDEX idx_transactions_store_id ON transactions(store_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND indexname = 'idx_transactions_product_id'
    ) THEN
        CREATE INDEX idx_transactions_product_id ON transactions(product_id);
    END IF;
END $$;