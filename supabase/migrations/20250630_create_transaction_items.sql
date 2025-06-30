-- Create transaction_items table
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  sku VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_sku ON public.transaction_items(sku);
CREATE INDEX IF NOT EXISTS idx_transaction_items_category ON public.transaction_items(category);
CREATE INDEX IF NOT EXISTS idx_transaction_items_brand ON public.transaction_items(brand);
CREATE INDEX IF NOT EXISTS idx_transaction_items_created_at ON public.transaction_items(created_at);

-- Add foreign key constraint to transactions table
ALTER TABLE public.transaction_items 
  ADD CONSTRAINT fk_transaction_items_transaction 
  FOREIGN KEY (transaction_id) 
  REFERENCES public.transactions(id) 
  ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users" ON public.transaction_items
  FOR SELECT USING (true);

-- Create policy for authenticated users to insert/update/delete
CREATE POLICY "Enable insert for authenticated users only" ON public.transaction_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.transaction_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.transaction_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_transaction_items_updated_at
  BEFORE UPDATE ON public.transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate transaction totals
CREATE OR REPLACE FUNCTION calculate_transaction_total(tid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_price - discount_amount), 0)
    FROM public.transaction_items
    WHERE transaction_id = tid
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment to table
COMMENT ON TABLE public.transaction_items IS 'Stores individual line items for each transaction';