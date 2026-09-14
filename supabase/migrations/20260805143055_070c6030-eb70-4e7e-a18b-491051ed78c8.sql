update public.estoque
set pacientes_uso = '[{"residenteId":"RU007","qtdDia":1}]'::jsonb,
    consumo_diario = 1
where id = '52c46971-4050-4975-9fe4-960781429133';