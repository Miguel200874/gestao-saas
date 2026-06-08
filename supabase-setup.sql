-- ============================================================
-- FlowGestão — Script SQL para o Supabase
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard
-- Projeto: ivmdcsjfcoogpmafodev
-- ============================================================

-- 1. TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  categoria TEXT,
  data DATE DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  cargo TEXT NOT NULL,
  salario NUMERIC(10, 2) DEFAULT 0,
  data_admissao DATE,
  email TEXT,
  telefone TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'ferias', 'afastado', 'inativo')),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FOLHA DE PAGAMENTO (salario_liquido como coluna normal para compatibilidade)
CREATE TABLE IF NOT EXISTS folha_pagamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  salario_bruto NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bonus NUMERIC(10, 2) DEFAULT 0,
  desconto NUMERIC(10, 2) DEFAULT 0,
  salario_liquido NUMERIC(10, 2) DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ESTOQUE
CREATE TABLE IF NOT EXISTS estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sku TEXT,
  categoria TEXT,
  quantidade INTEGER DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 5,
  preco_custo NUMERIC(10, 2) DEFAULT 0,
  preco_venda NUMERIC(10, 2) DEFAULT 0,
  fornecedor TEXT,
  localizacao TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estoque_id UUID REFERENCES estoque(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FORNECEDORES
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  categoria TEXT,
  prazo_pagamento INTEGER,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "auth_transacoes" ON transacoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_funcionarios" ON funcionarios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_folha" ON folha_pagamento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_estoque" ON estoque FOR ALL USING (auth.role() = 'authenticated');
ALTER TABLE estoque REPLICA IDENTITY FULL;
CREATE POLICY "auth_movimentacoes" ON movimentacoes_estoque FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_fornecedores" ON fornecedores FOR ALL USING (auth.role() = 'authenticated');

-- Habilitar Realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE transacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE funcionarios;
ALTER PUBLICATION supabase_realtime ADD TABLE folha_pagamento;
ALTER PUBLICATION supabase_realtime ADD TABLE estoque;
ALTER PUBLICATION supabase_realtime ADD TABLE fornecedores;

-- ============================================================
-- DADOS DE EXEMPLO
-- ============================================================
INSERT INTO funcionarios (nome, cargo, salario, status, data_admissao) VALUES
  ('Ana Paula Mendes', 'Gerente', 4500.00, 'ativo', '2022-03-01'),
  ('Carlos Eduardo Lima', 'Vendedor', 2200.00, 'ativo', '2023-01-15'),
  ('Fernanda Costa', 'Administrativo', 2800.00, 'ativo', '2021-08-10'),
  ('Ricardo Alves', 'Estoquista', 1900.00, 'ferias', '2022-11-20')
ON CONFLICT DO NOTHING;

INSERT INTO transacoes (tipo, descricao, valor, categoria, data) VALUES
  ('receita', 'Vendas do mês', 15400.00, 'Vendas', CURRENT_DATE - INTERVAL '25 days'),
  ('receita', 'Serviços prestados', 3200.00, 'Serviços', CURRENT_DATE - INTERVAL '20 days'),
  ('despesa', 'Aluguel do ponto', 2800.00, 'Aluguel', CURRENT_DATE - INTERVAL '15 days'),
  ('despesa', 'Compra de mercadorias', 4100.00, 'Fornecedores', CURRENT_DATE - INTERVAL '10 days'),
  ('receita', 'Consultoria', 2500.00, 'Serviços', CURRENT_DATE - INTERVAL '5 days'),
  ('despesa', 'Conta de luz e água', 380.00, 'Utilidades', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO estoque (nome, sku, categoria, quantidade, quantidade_minima, preco_custo, preco_venda) VALUES
  ('Camiseta Polo Azul M', 'CAM-001', 'Vestuário', 42, 10, 25.00, 59.90),
  ('Calça Jeans 42', 'CAL-042', 'Vestuário', 18, 8, 48.00, 119.90),
  ('Notebook 15" i5', 'NOTE-15', 'Eletrônicos', 5, 3, 1800.00, 3299.00),
  ('Mouse Sem Fio', 'MOUSE-01', 'Eletrônicos', 3, 5, 35.00, 89.90),
  ('Detergente 500ml', 'DET-500', 'Limpeza', 67, 15, 2.50, 5.90),
  ('Papel A4 Resma', 'PAP-A4', 'Escritório', 24, 10, 18.00, 34.90)
ON CONFLICT DO NOTHING;

INSERT INTO fornecedores (nome, cnpj, contato, telefone, categoria, prazo_pagamento) VALUES
  ('Distribuidora Boa Vista Ltda.', '12.345.678/0001-90', 'João Santos', '(47) 3344-5566', 'Vestuário', 30),
  ('Tech Supply SC', '98.765.432/0001-10', 'Maria Oliveira', '(47) 99887-6655', 'Eletrônicos', 15),
  ('Limpmax Produtos', '55.444.333/0001-22', 'Pedro Lima', '(47) 3322-1100', 'Limpeza', 45)
ON CONFLICT DO NOTHING;

SELECT 'FlowGestão: Todas as tabelas criadas com sucesso! ✅' AS resultado;
