-- Import Farmalar from backup-farmalar.json
-- Original user_id preserved so the same login sees the data.
BEGIN;
INSERT INTO public.residentes (
    id, user_id, codigo, nome, data_nascimento, diagnosticos, alergias,
    responsavel, medico, ubs, observacoes, a_revisar, dependencia, mobilidade,
    dieta, alertas, haldol_injetavel, extras, created_at, updated_at
  ) VALUES
(
    '9dbf7fce-791c-4f58-b89d-d9cc25d0c525', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU001', 'Vitoria Caroline Oliveira Silva', '2007-08-01'::date,
    ARRAY['Deficiência intelectual grave e esquizofrenia paranoide. Histórico de encefalocele corrigida ao nascimento com atraso global do desenvolvimento neuropsicomotor.']::text[], ARRAY[]::text[], 'Lar Fraternidade Cristã', 'Carla do Carmo Pires',
    'UBS Iguaçu', 'Faz uso de Haldol injetável, 2 ampolas a cada 21 dias.', FALSE, 'parcial',
    'deambula', 'Livre', ARRAY[]::text[], '{"historico":["2026-07-07","2026-07-27","2026-08-17","2026-09-08"],"proximaDose":"2026-09-29","periodicidadeDias":21}'::jsonb,
    '{"cpf":"14063057666","sanitas":"12008137","medicacoesUso":["Acido Valproico 500mg","Clonazepam 2mg","Desogestrel 75mcg","Fluoxetina 20mg","Haloperidol Decanoato 70, 52mg/ml 1ml","Periciazina 4 %","Quetiapina 50mg","Risperidona 3mg"],"esquemaMedicacoes":[{"nome":"Acido Valproico 500mg","manha":"1cp","noite":"1cp","tarde":"1cp"},{"nome":"Clonazepam 2mg","manha":"-","noite":"1cp","tarde":"-"},{"nome":"Desogestrel 75mcg","manha":"1cp","noite":"-","tarde":"-"},{"nome":"Fluoxetina 20mg","manha":"2cp","noite":"-","tarde":"-"},{"nome":"Haloperidol Decanoato 70, 52mg/ml 1ml","manha":"02 ampolas a cada 21 dias ","noite":"","tarde":""},{"nome":"Periciazina 4 %","manha":"-","noite":"10 gotas","tarde":"-"},{"nome":"Quetiapina 50mg","manha":"--","noite":"1cp","tarde":"-"},{"nome":"Risperidona 3mg","manha":"1cp","noite":"1cp","tarde":"-"}],"dataInstitucionalizacao":"2025-08-04","acompanhamentoPsiquiatrico":{"local":"CAPS","medico":"Dra Samira Silva Vieira","observacoes":"Teve alta do CAPS e foi contra-referenciada para UBS. Solicitar encaminhamento para psiquiatra.","ultimaConsulta":"2026-05-04"}}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    '29ce69f5-df2b-4a07-98f7-f976b79fe457', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU002', 'Patricia Kennedy Alves Bueno', '1971-10-06'::date,
    ARRAY['Sequelas de Hemorragia Intracraniana','Dislipidemia (principalmente hipertrigliceridemia)','epilepsia','diabetes mellitus tipo 2','transtorno depressivo.']::text[], ARRAY['Dipirona']::text[], 'Lar da Fraternidade Cristã', 'Carla do Carmo Pires',
    'UBS Iguaçu', 'Aguardando consulta com psiquiatra para verificar depressão e motivo de uso do levodopa, pois segundo Emar, a residente não tem diagnostico de Parkinson.', FALSE, 'total',
    'acamada', 'Livre', ARRAY[]::text[], NULL,
    '{"cpf":"83748164653","sanitas":"33587","medicacoesUso":["Clonazepam 2mg","Fenofibrato 200mg","Metformina 500mg","Levodopa 200mg + benserazida 50mg","Pregabalina 150mg","Quetiapina 25mg","Levetiracetam 250mg","Sertralina 50mg","Risperidona 3mg"],"dataInstitucionalizacao":"2025-07-14"}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    'ecfdc093-c5d3-4335-86d4-6a8774bdce64', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU003', 'Silvania Aparecida Pereira Carvalho', '1972-06-24'::date,
    ARRAY['Encefalopatia hipóxico-isquêmica do recém-nascido, Retardo mental moderado - sem menção de comprometimento do comportamento. Relato de poliomelite aos dois anos de idade (informado pelo irmão da residente).','HAS']::text[], ARRAY[]::text[], 'Lar da Fraternidade Cristã', 'Carla do Carmo Pires',
    'UBS', 'Aguardando vaga no CER (atedimento multidiciplinar na Unileste) para TO e fisioterapia.', FALSE, 'parcial',
    'cadeirante', 'Livre', ARRAY[]::text[], NULL,
    '{"cpf":"70246649674","sanitas":"78951","medicacoesUso":["Desvenlafaxina 50mg","Losartana Potassica 50mg"],"esquemaMedicacoes":[{"nome":"Desvenlafaxina 50mg","manha":"1 cp","noite":"","tarde":""},{"nome":"Losartana Potassica 50mg","manha":"","noite":"1 cp","tarde":""}],"dataInstitucionalizacao":"2025-09-18"}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    'e1175a34-9364-48b9-83d6-42d82e8ebb26', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU004', 'Rosilda Maria Fernandes', '1969-11-29'::date,
    ARRAY['Deficiência intelectual grave e afasia adquirida com epilepsia.','Insuficiência Renal Crônica (IRC) estágio 4','HAS','Diabetes mellitus tipo 2','dislipidemia (hipercolesterolemia)','Epilepsia.']::text[], ARRAY[]::text[], NULL, 'Mirela Gomes Alves',
    NULL, NULL, FALSE, NULL,
    NULL, NULL, ARRAY[]::text[], NULL,
    '{"cpf":"03651259625","sanitas":"112575","medicacoesUso":["Atorvastatina 40mg","Carbamazepina 200mg","Diazepam 10mg","Furosemida 40mg","Gliclazida 30mg","Quetiapina 50mg","Risperidona 1mg","Losartana 50mg"],"dataInstitucionalizacao":"2025-03-12","acompanhamentoPsiquiatrico":{"observacoes":"Solicitar encaminhamento para psiquiatra."}}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    '070048b0-0a1b-4392-8341-177b50d5b587', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Marcelia Vogacia Ferreira', '1971-06-29'::date,
    ARRAY['Deficiência cognitiva moderada, Deficiência mental grave e Deficiência física','Diabetes','Hipotireoidismo','Dislipidemia']::text[], ARRAY[]::text[], NULL, 'CARLA DO CARMO PIRES',
    NULL, 'Verificar efeitos da retirada da quetiapina', FALSE, NULL,
    NULL, NULL, ARRAY[]::text[], NULL,
    '{"cpf":"054.732.516-92","sanitas":"35047134","medicacoesUso":["Acido Valproico 500mg","Atorvastatina 40mg","Metformina 500mg","Risperidona 1mg","Diosmina 450mg + hesperidina 50mg","Pregabalina 150mg","Levotiroxina 25mcg","Levotiroxina 50mcg","Clonazepam 2,5mg/ml - dar até 15 gotas caso precise dormir","Risperidona 1mg - se agitação durante o dia dar 1cp durante o dia","Escitalopram 10mg"],"dataInstitucionalizacao":"2019-02-08","acompanhamentoPsiquiatrico":{"local":"Policlínica","medico":"Dra Patricia Menezes Moreira","observacoes":"Aguardando vaga com psiquiatra na Policlínica.","ultimaConsulta":"2026-05-14"}}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    'afee0147-e3d7-4e68-adc5-faa39d93d534', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Jaqueline Karina Coelho', '1979-03-29'::date,
    ARRAY['Deficiência Intelectual Severa','Hipotireoidismo']::text[], ARRAY[]::text[], NULL, 'Carla do Carmo Pires',
    'UBS Iguaçu', NULL, FALSE, 'parcial',
    'deambula', 'Livre', ARRAY[]::text[], NULL,
    '{"cpf":"100.814.216-64","sanitas":"10025404","medicacoesUso":["Acido Valproico 500mg","Levotiroxina Sódica 50mg","Noretisterona","Risperidona 3mg","Clorpromazina 100mg","Carbamazepina 200mg"],"dataInstitucionalizacao":"2012-08-30","acompanhamentoPsiquiatrico":{"local":"Policlínica","medico":"Dr Leonardo Enes","observacoes":"Aguardando vaga na rede para consulta psiquiátrica.","ultimaConsulta":"2025-07-02"}}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    'bc9ee720-c92f-4edc-af9d-204e0e70a573', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU007', 'Katia Cirlene Costa Neves', '1970-03-23'::date,
    ARRAY['Deficiência intelectual moderada associada a grave transtorno de humor','Transtorno afetivo bipolar em estrutura psicótica','diabetes tipo 2','hipotireoidismo','Dislipidemia (hipercolesterolemia)']::text[], ARRAY[]::text[], NULL, 'CARLA DO CARMO PIRES',
    NULL, NULL, FALSE, NULL,
    NULL, NULL, ARRAY[]::text[], '{"historico":["2026-07-08","2026-09-05"],"proximaDose":"2026-10-05","periodicidadeDias":30}'::jsonb,
    '{"cpf":"10731315642","sanitas":"40003242","medicacoesUso":["Ácido Volproico 500mg","Gliclazida 30mg","Dapagliflozina 10mg","Haloperidol Decanoato 70,52mg/ml","Levotiroxina Sódica 50mcg","Metformina 500mg","Quetiapina 200mg","Rosuvastatina 20mg","Quetiapina 100mg"],"dataInstitucionalizacao":"2017-09-12","acompanhamentoPsiquiatrico":{"local":"CAPS","medico":"Dra Luiza Peixoto Ferreira","observacoes":"Próxima consulta 04/08/2026 às 10:30h com Dra Luiza, buscar resultado de HIV para levar, resultado da ressonancia, resultado da tomografia da UPA, informar sintomas que levou à UPA.","ultimaConsulta":"2026-06-02","proximaConsulta":"2026-08-04"}}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  ),
(
    'b254a0ea-317f-45dc-a2b6-39d44edeb355', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU009', 'Miriam Izidorio dos Santos', '1979-01-16'::date,
    ARRAY['Esquizofrenia, deficiência intelectual moderada a grave','Incontinência urinária de urgência']::text[], ARRAY[]::text[], 'Lar da Fraternidade Cristã', 'Carla do Carmos Pires',
    'UBS Iguaçu', NULL, FALSE, 'parcial',
    'deambula', 'Livre', ARRAY[]::text[], '{"historico":["2026-07-07","2026-07-27","2026-08-17","2026-09-08"],"proximaDose":"2026-09-29","periodicidadeDias":21}'::jsonb,
    '{"cpf":"055854646-39","sanitas":"60665","medicacoesUso":["Clonazepam 2mg","Desogestrel","Haloperidol Decanoato 70,52mg/ml","Oxibutinina 5mg","Quetiapina 100mg","Levomepromazina 25mg"],"dataInstitucionalizacao":"2025-09-16","acompanhamentoPsiquiatrico":{"observacoes":"Solicitar encaminhamento para psiquiatra"}}'::jsonb, '2026-09-15T16:18:08.585346+00:00'::timestamptz, '2026-09-15T16:18:08.585346+00:00'::timestamptz
  )
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.estoque (
    id, user_id, codigo, medicacao, apresentacao, lote, validade, quantidade,
    estoque_minimo, consumo_diario, origem, local, pacientes_uso, proxima_compra,
    observacao, tipo_uso, lancado_em, ultima_baixa, ultima_retirada, proxima_retirada,
    unidade, gotas_por_ml, created_at, updated_at
  ) VALUES
(
    'b1ead874-9f6d-4df9-8a7c-f0ba10a81bef', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Acido Volproico 500mg', 'Comprimido',
    '1274721', '2028-02-19'::date, 168, 90,
    10, 'Policlínica', 'Armario de medicações', '[{"qtdDia":3,"residenteId":"RU001"},{"qtdDia":3,"residenteId":"RU005"},{"qtdDia":4,"residenteId":"RU006"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-30T10:56:32.842251+00:00'::timestamptz, '2026-08-31T11:34:08.944257+00:00'::timestamptz
  ),
(
    'f41c7e1c-f7ea-4b2a-8f6e-2ca26d790acb', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E085', 'Fenofibrato 200mg', 'Comprimido',
    'B26C0744', '2028-03-30'::date, 39, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-05T15:27:01.716991+00:00'::timestamptz, '2026-08-31T11:55:08.60305+00:00'::timestamptz
  ),
(
    '55e96779-8f20-4c46-bc05-3d49e7ab6d23', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E086', 'Periciazina 4% 40mg/ml', 'solução oral',
    'GRA00375', '2029-01-30'::date, 50, 20,
    0.5, 'Farmácia (compra)', 'Armario de medicações', '[{"qtdDia":0.5,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'ml', 20,
    '2026-08-05T15:31:50.888117+00:00'::timestamptz, '2026-08-31T13:41:16.41788+00:00'::timestamptz
  ),
(
    '012ac04d-8c36-467d-a1bb-3ebc9cf962fe', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E031', 'Fluoxetina 20mg', 'Comprimido',
    '25723708', '2026-09-30'::date, 21, 30,
    2, 'UBS', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T13:13:23.47783+00:00'::timestamptz, '2026-08-31T11:56:34.985888+00:00'::timestamptz
  ),
(
    '8579c5ab-d18a-4297-8271-aa334f999289', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Quetiapina 25mg', 'Comprimido',
    '2513008', '2027-08-30'::date, 16, 20,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:52:34.839626+00:00'::timestamptz, '2026-08-31T14:55:55.38701+00:00'::timestamptz
  ),
(
    'a4dfd2a5-a406-4f30-8f9e-e2b391c15cc6', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E033', 'Diosmina 450mg + hesperidina 50mg', 'Comprimido',
    'B26B1221', '2028-02-28'::date, 50, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T13:24:04.298737+00:00'::timestamptz, '2026-08-31T14:30:56.459286+00:00'::timestamptz
  ),
(
    'd9fb0662-f959-4455-b3cb-b64b205a05d2', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Clorpromazina 100mg', 'Comprimido',
    '2541470', '2027-08-30'::date, 90, 25,
    1.5, 'Policlínica', 'Armário de Medicamentos', '[{"qtdDia":1.5,"residenteId":"RU006"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-30T11:37:47.274919+00:00'::timestamptz, '2026-08-31T11:44:11.297965+00:00'::timestamptz
  ),
(
    '3a453188-1d3e-42cc-80bc-cf9d33847912', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E001', 'Risperidona 3mg', 'Comprimido',
    '50018936', '2026-09-30'::date, 21, 60,
    0.5, 'Policlínica', 'Armário de Medicações', '[{"qtdDia":0.5,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-19T13:47:06.865986+00:00'::timestamptz, '2026-08-31T14:08:51.212344+00:00'::timestamptz
  ),
(
    'eb76060c-547a-45fb-a679-0dedd4b08d9a', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E007', 'Noretisterona 0,35mg', 'Comprimido',
    '40704933', '2027-08-31'::date, 33, 10,
    1, 'UBS', 'Armário de Medicamentos', '[{"qtdDia":1,"residenteId":"RU006"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-19T14:35:16.372115+00:00'::timestamptz, '2026-08-31T13:38:20.600578+00:00'::timestamptz
  ),
(
    '26dd9c98-72a5-40f6-8f43-17b6b8275df3', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E062', 'Escitalopram 10mg', 'Comprimido',
    '5E4901', '2027-11-30'::date, 15, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T15:16:17.531622+00:00'::timestamptz, '2026-08-31T11:54:15.797755+00:00'::timestamptz
  ),
(
    '6b07a62e-08c8-4e2f-a72c-71d9a39136e0', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E098', 'Desvenlafaxina 50mg', 'Comprimido',
    '26020158', '2028-01-30'::date, 30, 10,
    1, 'Farmácia (compra)', 'Armário de Medicação', '[{"qtdDia":1,"residenteId":"RU003"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T14:05:51.491106+00:00'::timestamptz, '2026-08-31T11:49:46.739376+00:00'::timestamptz
  ),
(
    'd7615cdd-3003-425e-90f2-93e49d70bcde', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E086', 'Risperidona 1mg', 'Comprimido',
    '60201833', '2028-04-30'::date, 70, 40,
    6, 'UBS', 'Armário de Medicações', '[{"qtdDia":4,"residenteId":"RU004"},{"qtdDia":2,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-10T15:47:04.502659+00:00'::timestamptz, '2026-08-31T14:01:26.515761+00:00'::timestamptz
  ),
(
    '55415edf-0db9-4b98-83a3-19f921e81d00', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E098', 'Desvenlafaxina 50mg', 'Comprimido',
    '118733', '2027-09-30'::date, 24, 10,
    1, 'Farmácia (compra)', 'Armário de Medicação', '[{"qtdDia":1,"residenteId":"RU003"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-22T11:38:49.228765+00:00'::timestamptz, '2026-08-31T11:49:46.739376+00:00'::timestamptz
  ),
(
    '691b2d48-3d4a-4e2f-ab29-64f56321795b', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E086', 'Haloperidol Decanoato 50mg/ml', 'Ampola',
    '2621288A', '2028-05-30'::date, 15, 3,
    0.24285714285714285, 'UBS', 'Armario de medicações', '[{"qtdDia":0.09523809523809523,"ampolas":2,"residenteId":"RU001","intervaloDias":21,"proximaAplicacao":"2026-08-17"},{"qtdDia":0.1,"ampolas":3,"residenteId":"RU007","intervaloDias":30,"proximaAplicacao":"2026-08-07"},{"qtdDia":0.047619047619047616,"ampolas":1,"residenteId":"RU009","intervaloDias":21,"proximaAplicacao":"2026-08-17"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-05T15:00:45.261295+00:00'::timestamptz, '2026-08-31T13:18:33.086519+00:00'::timestamptz
  ),
(
    '7a3d4005-0494-425e-8c78-f16b0d1e4d4d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E083', 'Omeprazol 20mg', 'Cápsulas',
    '2502077', '2027-01-30'::date, 24, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:36:03.20557+00:00'::timestamptz, '2026-08-31T15:11:03.698764+00:00'::timestamptz
  ),
(
    'd00cfbdd-66b1-42c5-93f2-5e4ca628db7e', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E086', 'Domperidona 10mg', 'Comprimido',
    '4W5709', '2027-06-30'::date, 25, 1,
    0, 'Policlínica', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:39:52.785599+00:00'::timestamptz, '2026-08-31T15:06:48.934988+00:00'::timestamptz
  ),
(
    '376ea178-c5e1-46f8-8325-d90fcff592cc', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E051', 'Ciclobenzaprina 10mg', 'Comprimido',
    '2607027', '2028-02-28'::date, 10, 1,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T14:36:50.460987+00:00'::timestamptz, '2026-08-31T15:07:48.908447+00:00'::timestamptz
  ),
(
    '9da5d22a-f52c-4119-876f-bc46010f7118', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E050', 'Ciclobenzaprina 5mg', 'Comprimido',
    '2416776', '2026-12-30'::date, 49, 1,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T14:36:13.078018+00:00'::timestamptz, '2026-08-31T15:08:10.605404+00:00'::timestamptz
  ),
(
    '895914f4-2768-4394-a46d-9e0f0630e2cc', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E081', 'Cetoprofeno 150mg', 'Comprimido',
    'FRA04813', '2027-09-30'::date, 2, 0,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:31:06.22805+00:00'::timestamptz, '2026-08-31T15:09:06.431341+00:00'::timestamptz
  ),
(
    'e5f52e7a-a612-4e23-81ec-3248c1a2017a', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E091', 'Soro de reidratação oral', 'Sachê',
    '05225', '2027-01-30'::date, 1, 0,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T14:09:15.986338+00:00'::timestamptz, '2026-08-31T15:27:25.046541+00:00'::timestamptz
  ),
(
    '910397a3-a017-48d2-a54b-9f142f6f921f', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E094', 'Paracetamol 500mg', 'Comprimido',
    '25H0E5', '2027-08-30'::date, 14, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-25T13:40:13.177998+00:00'::timestamptz, '2026-08-31T15:28:17.999429+00:00'::timestamptz
  ),
(
    'bbc66257-03b8-4d9c-a0f6-052dc93ab656', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E089', 'Buscopam Simples', 'Comprimido',
    'J25G0072', '2027-08-30'::date, 10, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:46:13.864676+00:00'::timestamptz, '2026-08-31T15:28:42.62485+00:00'::timestamptz
  ),
(
    '55e8f950-6abc-4395-9240-6e102b9e97b7', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E010', 'Dipirona 1g', 'Comprimido',
    '25L06P', '2027-12-30'::date, 21, 10,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-19T14:41:33.996282+00:00'::timestamptz, '2026-08-31T15:29:16.589058+00:00'::timestamptz
  ),
(
    'b97570c1-daca-4b38-94a9-ccce8a1e2ddd', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E094', 'Dipirona 500mg', 'Comprimido',
    '25H70V', '2027-08-30'::date, 7, 10,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T14:17:05.83598+00:00'::timestamptz, '2026-08-31T15:31:39.10505+00:00'::timestamptz
  ),
(
    'f222aac8-6404-4fb6-b48b-20d1c53bab48', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E097', 'Vitamina D', 'Comprimido',
    '50309078', '2027-02-28'::date, 4, 0,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":0,"residenteId":"RU002","seNecessario":true}]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-21T15:17:06.740938+00:00'::timestamptz, '2026-08-31T15:19:00.252529+00:00'::timestamptz
  ),
(
    '35b12f8f-46c1-415f-9271-89d9b897642f', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E088', 'Risperidona 3mg', 'Comprimido',
    '50020329', '2026-10-30'::date, 65, 60,
    3, 'Policlínica', 'Armário de Medicações', '[{"qtdDia":3,"residenteId":"RU006"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-10T15:59:54.24761+00:00'::timestamptz, '2026-08-31T14:08:51.212344+00:00'::timestamptz
  ),
(
    '5e7cc550-412f-41b7-9f41-60b7c9104db3', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E098', 'Desogestrel 75mcg', 'Comprimido',
    '151685', '2029-01-30'::date, 79, 10,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU001"},{"qtdDia":1,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-21T15:19:06.847034+00:00'::timestamptz, '2026-08-31T11:47:37.983881+00:00'::timestamptz
  ),
(
    '41a1997d-5ae9-4443-bc95-0770714f6cab', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E101', 'Levomepromazina 25mg', 'Comprimido',
    '50019486', '2026-09-30'::date, 224, 40,
    4, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":4,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-16T13:42:43.724613+00:00'::timestamptz, '2026-08-31T13:23:38.095297+00:00'::timestamptz
  ),
(
    '4d1558e2-a558-49aa-8721-1eba39806694', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E088', 'Sulfato Ferroso', 'Comprimido',
    '045171', '2027-04-30'::date, 33, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:45:12.812914+00:00'::timestamptz, '2026-08-31T15:02:31.615026+00:00'::timestamptz
  ),
(
    'f612e065-6a5f-4897-84f9-8a6fa1ab4c8e', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E097', 'Oxibutinina 5mg', 'Comprimido',
    '26040033', '2028-04-30'::date, 120, 30,
    3, 'Farmácia (compra)', 'Armário de medicações', '[{"qtdDia":3,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:59:42.708384+00:00'::timestamptz, '2026-08-31T13:40:07.330415+00:00'::timestamptz
  ),
(
    '4e51ff22-3d72-47de-9b45-41c8231543b9', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E092', 'Atorvastatina 40mg', 'Comprimido',
    '2609188', '2028-03-30'::date, 66, 20,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"},{"qtdDia":1,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-13T10:59:21.455196+00:00'::timestamptz, '2026-08-31T11:37:10.521338+00:00'::timestamptz
  ),
(
    '1719dd29-8d1e-4d01-8b51-e2cb45037889', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E091', 'Dapagliflozina 10mg', 'Comprimido',
    '5k6312', '2028-03-30'::date, 57, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-13T10:55:56.00099+00:00'::timestamptz, '2026-08-31T11:46:05.061143+00:00'::timestamptz
  ),
(
    'f56f7c11-ab44-4ebe-9773-a79d8f0e3efd', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E090', 'Levodopa 200mg + benserazida 50mg', 'Comprimido',
    'E1753E4', '2027-12-30'::date, 17, 15,
    1.5, 'Doação', 'Armário de Medicações', '[{"qtdDia":1.5,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-10T16:15:52.931873+00:00'::timestamptz, '2026-08-31T13:20:54.457359+00:00'::timestamptz
  ),
(
    '54feefbf-78d6-4e27-8467-081caae92742', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E006', 'Clorpromazina 100mg', 'Comprimido',
    '2541469', '2027-08-30'::date, 46, 25,
    1.5, 'UBS', 'Armário de Medicações', '[{"qtdDia":1.5,"residenteId":"RU006"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-19T14:33:53.630332+00:00'::timestamptz, '2026-08-31T11:44:11.297965+00:00'::timestamptz
  ),
(
    '62c1e65a-f02f-4385-806f-9b13c64fc95d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E094', 'Pregabalina 150mg', 'Comprimido',
    '72200415', '2027-11-30'::date, 79, 20,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:48:56.016784+00:00'::timestamptz, '2026-08-31T13:43:41.133931+00:00'::timestamptz
  ),
(
    '5fc57236-a036-428c-be69-78116115a3d2', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E074', 'Metoclopramida 10mg', 'Comprimido',
    '026055', '2028-02-28'::date, 18, 1,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:11:47.265171+00:00'::timestamptz, '2026-08-31T15:01:33.732601+00:00'::timestamptz
  ),
(
    '2c8318c1-7c9a-4a90-a568-6e415ec217be', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E097', 'Sertralina 50mg', 'Comprimido',
    'A20A02225', '2027-08-30'::date, 9, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:58:52.750407+00:00'::timestamptz, '2026-08-31T14:23:47.494811+00:00'::timestamptz
  ),
(
    '15019667-5e35-467b-b86f-12cbfd7ac606', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E098', 'Rosuvastatina 20mg', 'Comprimido',
    '5L8478', '2028-04-30'::date, 30, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T14:07:42.406793+00:00'::timestamptz, '2026-08-31T14:22:53.576542+00:00'::timestamptz
  ),
(
    'ab3ffb5b-2a10-4798-84f3-fe733ab34c95', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Diclofenaco 50mg', 'Comprimido',
    '016104', '2028-01-30'::date, 6, 1,
    0, 'Farmácia (compra)', 'Armário para Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T14:48:04.88341+00:00'::timestamptz, '2026-08-31T15:12:32.54388+00:00'::timestamptz
  ),
(
    '18f3fc26-3b33-450c-a273-c7ca6dd64f3c', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E084', 'Omeprazol 20mg', 'Cápsulas',
    '065009', '2027-06-30'::date, 56, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:36:55.731278+00:00'::timestamptz, '2026-08-31T15:11:03.698764+00:00'::timestamptz
  ),
(
    'c6211a2c-8834-41a4-9887-4ae74a4515ed', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E093', 'Codeína 30mg', 'Comprimido',
    '50034203', '2027-10-30'::date, 23, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T14:14:00.601248+00:00'::timestamptz, '2026-08-31T15:17:29.03233+00:00'::timestamptz
  ),
(
    'a67a14e1-9388-46b8-b566-ea5640417b67', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E078', 'Ibuprofeno 600mg', 'Comprimido',
    '25100504', '2027-09-30'::date, 1, 0,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:25:26.183516+00:00'::timestamptz, '2026-08-31T15:16:22.10352+00:00'::timestamptz
  ),
(
    '48ee293c-6201-4129-ac86-e2fa047ecd52', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Soro de Reidratação Oral', 'Sachê',
    '0030878', '2027-01-30'::date, 2, 0,
    0, 'Doação', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-01T12:18:55.053924+00:00'::timestamptz, '2026-08-31T15:27:25.046541+00:00'::timestamptz
  ),
(
    '9aaf3659-d5ca-4f0b-8322-12d713353f37', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E102', 'Amoxicilina 500mg + clavulanato 125mg', 'Comprimido',
    'DFG5802B', '2028-08-30'::date, 7, 0,
    0, 'Doação', 'Armário de Medicamentos', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-16T13:51:44.95058+00:00'::timestamptz, '2026-08-31T15:23:10.877578+00:00'::timestamptz
  ),
(
    '8617144a-b1cf-49ef-b909-330b7ee96ecc', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E103', 'Amoxicilina 500mg + clavulanato 125mg', 'Comprimido',
    'PK0624', '2027-02-28'::date, 1, 0,
    0, 'UBS', 'Armário de Medicamentos', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-16T13:52:28.092562+00:00'::timestamptz, '2026-08-31T15:23:10.877578+00:00'::timestamptz
  ),
(
    '16c3b32e-5824-4e75-8500-9e7f5e16c35d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E104', 'Nitrato de tiamina 100mg + cloridrato de piridoxina 100mg + cianocobalamina 5000mcg', 'Comprimido',
    '946146', '2026-10-30'::date, 13, 0,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-16T13:54:26.649298+00:00'::timestamptz, '2026-08-31T15:24:26.210227+00:00'::timestamptz
  ),
(
    '0128ba8b-ce8c-45b0-912d-be4f1493802a', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E072', 'Loratadina 10mg', 'Comprimido',
    '2602458', '2028-01-30'::date, 12, 1,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-06-24'::date, '2026-06-24'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T12:39:04.131398+00:00'::timestamptz, '2026-08-31T15:26:44.413791+00:00'::timestamptz
  ),
(
    '9c059a6f-b3af-4cec-9840-a49b89c40a97', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E077', 'Loratadina 10mg', 'Comprimido',
    '2517190', '2027-07-30'::date, 22, 1,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:24:05.209315+00:00'::timestamptz, '2026-08-31T15:26:44.413791+00:00'::timestamptz
  ),
(
    '4b1f70ca-7a4d-4198-8d34-f9814544d347', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E080', 'Paracetamol 750mg', 'Comprimido',
    '26A95J', '2027-12-30'::date, 29, 10,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:29:57.476852+00:00'::timestamptz, '2026-08-31T15:27:53.555786+00:00'::timestamptz
  ),
(
    '315317ac-483f-4d40-81f1-4c8acbbce470', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E090', 'Buscopam Composto', 'Comprimido',
    '125179', '2027-12-30'::date, 5, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:47:33.461737+00:00'::timestamptz, '2026-08-31T15:32:04.041608+00:00'::timestamptz
  ),
(
    '4b6d285b-e4aa-4bf7-b458-e80b6486551b', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E053', 'Clonazepam 2mg', 'Comprimido',
    '2601867', '2028-02-28'::date, 28, 15,
    1, 'UBS', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T14:47:13.455374+00:00'::timestamptz, '2026-08-31T14:25:53.136231+00:00'::timestamptz
  ),
(
    '415c976a-2197-46bc-9c94-d4b9ce600fb8', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E039', 'Quetiapina 50mg', 'Comprimido',
    '118495', '2027-06-30'::date, 30, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-06-23'::date, '2026-08-03'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T13:39:57.290205+00:00'::timestamptz, '2026-08-31T14:29:43.934401+00:00'::timestamptz
  ),
(
    'c10fb1d1-808b-4e35-8f57-0d0c865c30c4', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Levetiracetam 250mg', 'Comprimido',
    '5D0831', '2027-10-30'::date, 25, 20,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:55:06.770543+00:00'::timestamptz, '2026-08-31T13:19:46.211761+00:00'::timestamptz
  ),
(
    '381df286-cecb-4e8d-8dfe-97a8171052e0', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E027', 'Furosemida 40mg', 'Comprimido',
    '25F07D', '2027-06-30'::date, 47, 20,
    2, 'Farmácia Popular', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-04'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T13:03:16.672524+00:00'::timestamptz, '2026-09-04T11:28:06.081552+00:00'::timestamptz
  ),
(
    '998791b9-9f05-4dd3-92ad-eb7c3ad26c1e', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E022', 'Diazepam 10mg', 'Comprimido',
    '5D6887', '2027-08-31'::date, 97, 20,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T12:53:16.422039+00:00'::timestamptz, '2026-08-31T11:51:24.828622+00:00'::timestamptz
  ),
(
    'a6f885c7-d9fc-48a4-a268-aed360e687d0', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E079', 'Fluconazol 150mg', 'Comprimido',
    'LEKP14677', '2026-10-30'::date, 1, 0,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:28:21.34158+00:00'::timestamptz, '2026-08-31T15:08:41.592854+00:00'::timestamptz
  ),
(
    'a43ba47c-21d3-406f-a308-206d8ec7a6a4', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E093', 'Quetiapina 50mg', 'Comprimido',
    '152187', '2028-01-30'::date, 21, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-04'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:45:56.926399+00:00'::timestamptz, '2026-09-04T11:28:47.76927+00:00'::timestamptz
  ),
(
    '3c91ea57-f917-4b4f-87f7-4b4496099402', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Pregabalina 150mg', 'Comprimido',
    '72200416', '2027-11-30'::date, 26, 20,
    1, 'UBS', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T13:49:31.048428+00:00'::timestamptz, '2026-08-31T13:43:41.133931+00:00'::timestamptz
  ),
(
    '490ea945-9064-4d22-b1d6-1fecd0937881', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E082', 'Repoflor 200mg', 'Cápsulas',
    '4T4573', '2027-05-30'::date, 3, 1,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-24T13:32:21.06899+00:00'::timestamptz, '2026-08-31T15:26:12.922972+00:00'::timestamptz
  ),
(
    '458bcede-6b7e-4d82-802f-614ba9711461', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E025', 'Rosuvastatina 20mg', 'Comprimido',
    '5H8159', '2028-02-28'::date, 60, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T12:58:57.144846+00:00'::timestamptz, '2026-08-31T14:22:53.576542+00:00'::timestamptz
  ),
(
    '5cf4a79f-bd21-4444-baf7-191dfc64c1a0', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E013', 'Levotiroxina 50mcg', 'Comprimido',
    'BR185489', '2027-05-31'::date, 120, 40,
    4, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU006"},{"qtdDia":2,"residenteId":"RU007"},{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-19T14:49:26.279416+00:00'::timestamptz, '2026-09-01T13:38:29.433984+00:00'::timestamptz
  ),
(
    '3981813e-9575-4a3f-ad05-dec8982d9130', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E024', 'Rosuvastatina 20mg', 'Comprimido',
    '5F4891', '2027-11-30'::date, 30, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T12:58:17.732817+00:00'::timestamptz, '2026-08-31T14:22:53.576542+00:00'::timestamptz
  ),
(
    'f47784c7-acba-48e1-87c3-e882aca6aeff', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E002', 'Carbamazepina 200mg', 'Comprimido',
    '1350/25M', '2027-09-30'::date, 193, 70,
    7, 'UBS', 'Armário de Medicamentos', '[{"qtdDia":4,"residenteId":"RU006"},{"qtdDia":3,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-19T13:55:50.343696+00:00'::timestamptz, '2026-08-31T11:38:23.488145+00:00'::timestamptz
  ),
(
    'c24db810-a9b8-4166-87c9-aa58ccba6fba', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E099', 'Levomepromazina 25mg', 'Comprimido',
    'GRA01428', '2028-02-28'::date, 234, 40,
    4, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":4,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T14:10:20.759633+00:00'::timestamptz, '2026-08-31T13:23:38.095297+00:00'::timestamptz
  ),
(
    '4300b112-89be-499f-ba0a-3a92c09badfc', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E026', 'Furosemida 40mg', 'Comprimido',
    '25H0A5', '2027-08-31'::date, 87, 20,
    2, 'UBS', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T13:02:25.846508+00:00'::timestamptz, '2026-08-31T11:58:19.88914+00:00'::timestamptz
  ),
(
    'a5954963-f77c-4f83-9016-86edb257f37d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E034', 'Levotiroxina 25mcg', 'Comprimido',
    'M50954', '2027-02-28'::date, 30, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-06-23T13:25:35.092508+00:00'::timestamptz, '2026-09-01T13:40:54.845603+00:00'::timestamptz
  ),
(
    'b231d73f-f7fc-4f58-b889-51f417ee8ade', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E093', 'Risperidona 1mg', 'Comprimido',
    '51002463', '2028-04-30'::date, 405, 40,
    6, 'UBS', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU005"},{"qtdDia":4,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:01:26.316574+00:00'::timestamptz, '2026-08-31T14:01:26.515761+00:00'::timestamptz
  ),
(
    'e81a3495-2aa1-489b-89d5-da7606706b0d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Glicazida 30mg', 'Comprimido',
    'PTH0765A', '2028-01-30'::date, 154, 40,
    3, 'Policlínica', 'Armário de Medicações', '[{"qtdDia":3,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-03'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T12:00:43.573434+00:00'::timestamptz, '2026-09-03T15:07:04.433218+00:00'::timestamptz
  ),
(
    'e8bda0c6-f1e4-4191-83bc-47d23896315b', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E089', 'Clonazepam 2mg', 'Comprimido',
    '2601867', '2028-02-28'::date, 20, 15,
    1, 'UBS', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:17:40.485242+00:00'::timestamptz, '2026-08-31T14:25:53.136231+00:00'::timestamptz
  ),
(
    '4a7b2fc2-1164-4af6-99ea-1d057160b829', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E097', 'Levotiroxina 25mcg', 'Comprimido',
    'BR185911', '2027-07-30'::date, 18, 10,
    1, 'UBS', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:42:45.62902+00:00'::timestamptz, '2026-09-01T13:40:54.845603+00:00'::timestamptz
  ),
(
    'f8ddd3bc-5eba-498c-882e-0a9167abd53f', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Losartana 50mg', 'Comprimido',
    '14185970', '2028-02-28'::date, 24, 10,
    1, 'UBS', 'Armário de Medicação', '[{"qtdDia":1,"residenteId":"RU003"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:36:57.400934+00:00'::timestamptz, '2026-08-31T13:29:39.03097+00:00'::timestamptz
  ),
(
    '49071c74-ea49-4a1f-8def-769dbf81aed3', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Losartana 50mg', 'Comprimido',
    '25J729', '2027-09-30'::date, 23, 10,
    1, 'UBS', 'Armário de Medicação', '[{"qtdDia":1,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-19T14:06:47.979217+00:00'::timestamptz, '2026-08-31T13:29:39.03097+00:00'::timestamptz
  ),
(
    '1bdac209-44ee-4ec1-95af-0e655af381b5', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Fluoxetina 20mg', 'Comprimido',
    '1102/25M', '2027-08-30'::date, 180, 30,
    2, 'UBS', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:33:21.142244+00:00'::timestamptz, '2026-08-31T11:56:34.985888+00:00'::timestamptz
  ),
(
    'f4827c4f-1ea9-4e20-afc3-7c5d504c18c6', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Acido Volproico 250mg', 'Comprimido',
    '1267725', '2027-11-04'::date, 218, 60,
    6, 'UBS', 'Armário A1', '[{"qtdDia":6,"residenteId":"RU007","seNecessario":false}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-19T13:42:30.883943+00:00'::timestamptz, '2026-08-31T11:34:38.763131+00:00'::timestamptz
  ),
(
    '2b53c365-64f2-4a0a-b864-54e03ac5aaef', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E087', 'Clonazepam 2,5mg/ml', 'Solução gotas',
    '3591479', '2028-01-30'::date, 20, 1,
    0, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":0.75,"residenteId":"RU005","seNecessario":true}]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'ml', 20,
    '2026-08-10T13:02:50.014517+00:00'::timestamptz, '2026-08-31T15:23:30.636249+00:00'::timestamptz
  ),
(
    '9e2501b0-d105-4f26-bcb4-db767390fb0a', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E094', 'Metformina 500mg', 'Comprimido',
    '25D7F3', '2027-04-30'::date, 60, 40,
    2, 'Farmácia Popular', 'Armário de Medicamentos', '[{"qtdDia":2,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-08-10'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:31:39.733299+00:00'::timestamptz, '2026-08-31T13:37:18.373462+00:00'::timestamptz
  ),
(
    '2215cac2-9651-4e2d-98ba-ef8869c427f6', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E092', 'Quetiapina 100mg', 'Comprimido',
    '5H8434', '2028-02-28'::date, 14, 30,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T13:48:33.618579+00:00'::timestamptz, '2026-08-31T14:27:27.002085+00:00'::timestamptz
  ),
(
    '8af59c1e-fe05-49cf-85ab-58ecfce93151', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E100', 'Lacto-purga', 'Comprimido',
    'B25M1057', '2028-07-30'::date, 3, 0,
    0, 'Farmácia (compra)', 'Armario de medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T15:05:03.676972+00:00'::timestamptz, '2026-08-31T15:17:01.872694+00:00'::timestamptz
  ),
(
    'd90dde3a-1d2e-45d0-8fd6-cf5dce2069aa', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E091', 'Quetiapina 200mg', 'Comprimido',
    '50031834', '2027-08-30'::date, 95, 30,
    3, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":3,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-08-10'::date, '2026-09-02'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:21:48.784487+00:00'::timestamptz, '2026-09-02T12:29:38.758268+00:00'::timestamptz
  ),
(
    '7fb07952-533d-428c-937a-0c3ecfad9995', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Escitalopram 10mg', 'Comprimido',
    'M000567', '2027-12-30'::date, 60, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T11:54:15.569189+00:00'::timestamptz, '2026-08-31T11:54:15.797755+00:00'::timestamptz
  ),
(
    'ed57d4b8-a20a-44ad-a60d-6594734248d9', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Levomepromazina 25mg', 'Comprimido',
    '50021607', '2026-11-30'::date, 36, 40,
    4, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":4,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T13:23:37.896398+00:00'::timestamptz, '2026-08-31T13:23:38.095297+00:00'::timestamptz
  ),
(
    'f1b71d16-17b9-490c-bbbb-369c473b47a7', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E093', 'Metformina 500mg', 'Comprimido',
    '26B66C', '2028-02-28'::date, 120, 40,
    4, 'Farmácia Popular', 'Armário de Medicamentos', '[{"qtdDia":2,"residenteId":"RU007"},{"qtdDia":2,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-08-10'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:30:30.988541+00:00'::timestamptz, '2026-08-31T13:37:18.373462+00:00'::timestamptz
  ),
(
    '3b73223d-178f-4dac-a28b-7224fbf0530f', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E093', 'Risperidona 3mg', 'Comprimido',
    '104090', '2027-07-30'::date, 120, 60,
    5, 'Policlínica', 'Armário de Medicações', '[{"qtdDia":3,"residenteId":"RU006"},{"qtdDia":2,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:08:10.058926+00:00'::timestamptz, '2026-08-31T14:08:51.212344+00:00'::timestamptz
  ),
(
    'ff433974-6f9e-46ed-b32d-68572e200442', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E094', 'Risperidona 3mg', 'Comprimido',
    '104429', '2027-07-30'::date, 28, 60,
    2, 'Policlínica', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:08:51.026444+00:00'::timestamptz, '2026-08-31T14:08:51.212344+00:00'::timestamptz
  ),
(
    '863c87be-3680-43a6-b90d-a177c4483463', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E090', 'Clonazepam 2mg', 'Comprimido',
    '2601753', '2028-02-28'::date, 27, 15,
    1.5, 'UBS', 'Armário de Medicações', '[{"qtdDia":1.5,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:18:39.469036+00:00'::timestamptz, '2026-08-31T14:25:53.136231+00:00'::timestamptz
  ),
(
    '752e2461-d805-423e-9e67-36c5e89ed0c7', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E092', 'Quetiapina 100mg', 'Comprimido',
    '50032449', '2027-09-30'::date, 30, 30,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-10T14:22:35.399148+00:00'::timestamptz, '2026-08-31T14:27:27.002085+00:00'::timestamptz
  ),
(
    '61e9091e-0cc8-457b-a9eb-1fce7c84b41f', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E095', 'Quetiapina 100mg', 'Comprimido',
    '5G5228', '2028-01-30'::date, 48, 30,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU009"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:27:26.803452+00:00'::timestamptz, '2026-08-31T14:27:27.002085+00:00'::timestamptz
  ),
(
    '21a65c1a-5c4d-478c-aa17-dcc22b20c749', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E097', 'Quetiapina 100mg', 'Comprimido',
    '5L5638', '2028-04-30'::date, 9, 30,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU007"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-08-31'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-07-14T14:04:03.983253+00:00'::timestamptz, '2026-08-31T14:27:27.002085+00:00'::timestamptz
  ),
(
    '14091cf4-88a3-4413-91ba-3e5a83ea26a2', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E096', 'Quetiapina 50mg', 'Comprimido',
    '190355', '2028-06-30'::date, 60, 10,
    1, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU001"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:29:43.737642+00:00'::timestamptz, '2026-08-31T14:29:43.934401+00:00'::timestamptz
  ),
(
    '51ced404-0ee1-4fd8-a71c-8b4ad361cc8c', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E097', 'Quetiapina 25mg', 'Comprimido',
    '50707088', '2028-10-30'::date, 14, 20,
    2, 'Farmácia (compra)', 'Armário de Medicações', '[{"qtdDia":2,"residenteId":"RU002"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:55:54.859755+00:00'::timestamptz, '2026-08-31T14:55:55.38701+00:00'::timestamptz
  ),
(
    '9e3ed559-836d-43aa-a416-12d0285a0289', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E098', 'Ondansetrona 8mg', 'Comprimido',
    '50711123', '2027-11-30'::date, 9, 1,
    0, 'SUS/UBS', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:58:17.474571+00:00'::timestamptz, '2026-08-31T14:59:27.733959+00:00'::timestamptz
  ),
(
    '39babbbf-5080-4575-9c03-69ffc4bd4a01', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E099', 'Ondansetrona 8mg', 'Comprimido',
    '2607435', '2028-06-30'::date, 7, 1,
    0, 'SUS/UBS', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'queixa_simples',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T14:59:27.537587+00:00'::timestamptz, '2026-08-31T14:59:27.733959+00:00'::timestamptz
  ),
(
    'f0601cd2-34df-4677-bb1f-3abe6e59e511', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E100', 'Mecobalamina 1000mcg', 'Comprimido',
    '50901806', '2028-11-30'::date, 13, 0,
    0, 'SUS/UBS', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T15:04:46.202154+00:00'::timestamptz, '2026-08-31T15:04:46.439591+00:00'::timestamptz
  ),
(
    '064bced7-2c26-4788-8493-7b140b14c8ab', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E100', 'Prednisona 20mg', 'Comprimido',
    'B23L0275', '2026-11-30'::date, 16, 0,
    0, 'SUS/UBS', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T15:06:27.189508+00:00'::timestamptz, '2026-08-31T15:06:27.432798+00:00'::timestamptz
  ),
(
    '2d0db6b7-b6d7-415b-9aa7-cb77c4361c02', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E101', 'Acetilcisteína 600mg', 'Sachê',
    '5D1523', '2027-11-30'::date, 1, 0,
    0, 'SUS/UBS', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T15:12:13.448178+00:00'::timestamptz, '2026-08-31T15:12:13.972706+00:00'::timestamptz
  ),
(
    'df539a48-14fe-41b7-a468-53cf1db96075', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E102', 'Betametasona 120ml', 'Solução oral',
    '2228216', '2027-12-30'::date, 120, 0,
    0, 'SUS/UBS', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'ml', 20,
    '2026-08-31T15:14:01.680077+00:00'::timestamptz, '2026-08-31T15:14:02.182299+00:00'::timestamptz
  ),
(
    'ceb7394f-5d6a-49b6-91ab-ba24b30f2c70', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E103', 'Acetilcisteina 20mg/ml', 'Solução Oral',
    '4W2753', '2027-07-30'::date, 80, 0,
    0, 'Farmácia (compra)', 'Armário A1', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'ml', 20,
    '2026-08-31T15:15:42.485175+00:00'::timestamptz, '2026-08-31T15:15:42.701599+00:00'::timestamptz
  ),
(
    '5be8f7e7-66ca-4885-8bc3-0d99e13ed43b', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E104', 'Ibuprofeno 600mg', 'Comprimido',
    '25E407', '2027-04-30'::date, 15, 0,
    0, 'UBS', 'Armário de Medicações', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T15:16:21.826953+00:00'::timestamptz, '2026-08-31T15:16:22.10352+00:00'::timestamptz
  ),
(
    'f893a00f-b69b-4875-bc1a-f05a88c1e9ac', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E103', 'Glicazida 30mg', 'Comprimido',
    'PTG5271A', '2027-10-30'::date, 90, 40,
    3, 'Policlínica', 'Armário de Medicações', '[{"qtdDia":3,"residenteId":"RU004"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-03'::date, '2026-09-03'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-09-03T15:05:12.028763+00:00'::timestamptz, '2026-09-03T15:07:04.433218+00:00'::timestamptz
  ),
(
    '906f47c9-103e-427c-948b-7a92f630fa8b', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E105', 'Amoxicilina 500mg + clavulanato 125mg', 'Comprimido',
    'DFG6504A', '2028-09-30'::date, 7, 0,
    0, 'UBS', 'Armário de Medicamentos', '[]'::jsonb,
    NULL, NULL, 'nao_continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-08-31T15:21:26.950743+00:00'::timestamptz, '2026-08-31T15:23:10.877578+00:00'::timestamptz
  ),
(
    'd412b8a6-144a-4723-973b-9b8d5a49060d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'E105', 'Levotiroxina 25mcg', 'Comprimido',
    'BR186046', '2027-07-30'::date, 30, 10,
    1, 'UBS', 'Armário de Medicações', '[{"qtdDia":1,"residenteId":"RU005"}]'::jsonb,
    NULL, NULL, 'continua',
    '2026-09-01'::date, '2026-09-01'::date, NULL,
    NULL, 'unidade', NULL,
    '2026-09-01T13:40:54.592853+00:00'::timestamptz, '2026-09-01T13:40:54.845603+00:00'::timestamptz
  )
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.agendamentos (
    id, user_id, residente_id, tipo, descricao, data, hora, local, medico,
    observacoes, realizado, status, motivo, especialidade, resultado_data,
    resultado_retirado, resultado_retirado_em, realizado_em, created_at, updated_at
  ) VALUES
(
    '6e90e12b-89a5-4e99-bf84-e3176c6f0f1f', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Consulta', 'Consulta de retorno',
    '2026-08-04'::date, '08:00', 'Policlinica', 'Dra Fabiane', NULL,
    TRUE, 'Realizada', 'Avaliação dos exames para risco cirúrgico', 'Cardiologia',
    NULL, FALSE, NULL,
    '2026-08-04'::date, '2026-07-17T14:44:49.796729+00:00'::timestamptz, '2026-08-04T12:28:17.706857+00:00'::timestamptz
  ),
(
    '43881631-6a08-425a-8203-5b4c728310f7', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU007', 'Exame', 'Ressonancia de crânio',
    '2026-07-20'::date, '14:40', 'Laboratorio São Judas', NULL, NULL,
    TRUE, 'Realizada', 'Investigar perda cognitiva, memória, agressividade.', 'Neurologia',
    '2026-07-22'::date, TRUE, '2026-07-24'::date,
    NULL, '2026-07-15T11:46:28.483669+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    '2d1ff37e-ea6d-4413-ab30-62f884c6e0d2', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU002', 'Consulta', 'Pegar pedido de hemograma',
    '2026-10-17'::date, '08:00', 'UBS', 'Dra Carla', NULL,
    FALSE, 'Agendada', 'Retorno com Dra Carla para solicitar novo hemograma após suplementar vitamina D', 'Clínica geral',
    NULL, FALSE, NULL,
    NULL, '2026-07-17T14:42:03.559439+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    'af4ef4ac-6d42-46ba-9fcb-7f5d05c4cedd', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU009', 'Consulta', 'Consulta de retorno',
    '2026-08-17'::date, '08:00', 'UBS', 'Dra Carla', NULL,
    TRUE, 'Realizada', 'Consulta de retorno para avaliar como foi após aumento da quetiapina para 200mg.', 'Clínica geral',
    NULL, FALSE, NULL,
    '2026-08-17'::date, '2026-07-17T14:45:46.542574+00:00'::timestamptz, '2026-08-18T15:28:48.087479+00:00'::timestamptz
  ),
(
    '66c5234f-8800-4a42-90b0-5eef91bae748', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Exame', 'Ultrassom de axila direita',
    '2026-08-21'::date, '08:00', 'HMC I', 'Dr Andres', NULL,
    TRUE, 'Realizada', 'Cirurgia', 'Outros',
    NULL, FALSE, NULL,
    '2026-08-21'::date, '2026-07-17T14:57:38.812457+00:00'::timestamptz, '2026-08-26T15:12:49.189146+00:00'::timestamptz
  ),
(
    'e3c6d214-a89b-494a-a41a-10b50c2ed5c5', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Consulta', 'Acompanhamento',
    '2026-07-17'::date, NULL, 'Policlínica', NULL, NULL,
    FALSE, 'Aguardando vaga', NULL, 'Psiquiatria',
    NULL, FALSE, NULL,
    NULL, '2026-07-17T14:56:00.080217+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    '6c81f675-422e-4c90-a3c1-8fa76928d996', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU001', 'Consulta', 'Acompanhamento',
    '2026-09-10'::date, '11:00', 'Policlínica', 'CAPS', NULL,
    TRUE, 'Realizada', 'Avaliação do quadro geral + sialorréia + revisão da medicação + agitaçao constante', 'Psiquiatria',
    NULL, FALSE, NULL,
    '2026-09-10'::date, '2026-07-17T14:48:27.977396+00:00'::timestamptz, '2026-09-15T16:18:38.878251+00:00'::timestamptz
  ),
(
    '670bfd47-4ce1-4655-87de-7a9996a5b6d0', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU009', 'Consulta', 'Acompanhamento',
    '2026-07-17'::date, NULL, NULL, NULL, NULL,
    FALSE, 'Aguardando vaga', 'Agitação psicomotora (tirar roupas, dormir mal); avaliar aumento da quetiapina.', 'Psiquiatria',
    NULL, FALSE, NULL,
    NULL, '2026-07-17T14:58:24.16147+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    'ce8addcc-27bf-4103-a206-6f9b65d631cd', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Exame', 'Hemograma',
    '2026-07-21'::date, '08:00', 'HMC II - Bom Retiro', 'Dr Andres', NULL,
    TRUE, 'Realizada', 'Hemograma solicitado pelo oncologista para proxima cirurgia na mama', 'Outros',
    '2026-07-24'::date, TRUE, '2026-07-27'::date,
    NULL, '2026-07-17T14:53:12.634661+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    'c4baed88-6a00-4e11-81ef-26efc38cec13', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Exame', 'Ecocardiograma',
    '2026-07-06'::date, '08:30', 'Policlínica', 'Fabiane Vieira Nascimento', 'Resultado na pasta da residente',
    TRUE, 'Realizada', 'Risco cirúrgico', 'Cardiologia',
    '2026-07-06'::date, TRUE, '2026-07-21'::date,
    NULL, '2026-06-29T15:38:20.799798+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    '37e2198c-e3b3-43c9-97b5-8332b74598e9', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Exame', 'Raio-x de quadril',
    '2026-07-22'::date, NULL, 'Policlínica', 'Dra Vanessa Araújo', NULL,
    FALSE, 'Aguardando vaga', 'Investigar queixa de dor em MID', 'Outros',
    NULL, FALSE, NULL,
    NULL, '2026-07-22T14:33:49.073864+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    'f711deab-3c45-4b8a-b6e0-e69b099107e5', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU002', 'Consulta', 'Acompanhamento',
    '2026-07-17'::date, NULL, NULL, NULL, NULL,
    FALSE, 'Aguardando vaga', 'Quadro depressivo, chamar o tempo todo, Parkinson?', 'Psiquiatria',
    NULL, FALSE, NULL,
    NULL, '2026-07-17T14:56:39.845526+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    'a1385998-3d28-4c12-a135-8b51c50ff7c5', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Exame', 'Radiografia de tórax',
    '2026-07-21'::date, '15:50', 'Policlínica', 'Dra Fabiane', 'Perguntar Ivone data do resultado',
    TRUE, 'Realizada', 'Risco cirurgico', 'Cardiologia',
    NULL, FALSE, NULL,
    NULL, '2026-07-17T14:43:40.592633+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    '16225d79-3876-4430-8c25-9458ecfe23aa', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU003', 'Consulta', 'Psicólogo',
    '2026-07-24'::date, '13:00', 'UBS', NULL, NULL,
    TRUE, 'Realizada', 'Acompanhamento psicológico', 'Outros',
    NULL, FALSE, NULL,
    '2026-07-24'::date, '2026-07-20T10:21:07.605469+00:00'::timestamptz, '2026-07-29T10:12:53.708408+00:00'::timestamptz
  ),
(
    'cda8c97f-efab-4c39-8c67-f6d69410df7a', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU004', 'Consulta', 'Acompanhamento',
    '2026-07-31'::date, NULL, NULL, NULL, NULL,
    FALSE, 'Aguardando vaga', NULL, 'Psiquiatria',
    NULL, FALSE, NULL,
    NULL, '2026-07-31T11:21:47.361995+00:00'::timestamptz, '2026-07-31T11:21:47.361995+00:00'::timestamptz
  ),
(
    'b4dbb32c-d79b-41b9-a3c8-efad3951e876', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Consulta', 'Acompanhamento',
    '2026-08-05'::date, '09:00', 'Faculdade', 'Dr. Ricardo', NULL,
    TRUE, 'Realizada', 'paciente tremendo muito', 'Psiquiatria',
    NULL, FALSE, NULL,
    '2026-08-05'::date, '2026-07-31T11:19:09.868036+00:00'::timestamptz, '2026-08-05T14:26:42.768128+00:00'::timestamptz
  ),
(
    '90a0e109-9752-41dd-be62-7a50c76513d3', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU002', 'Consulta', 'Dermatologista',
    '2026-08-05'::date, '07:50', 'Policlínica', 'Dra Monica Silva Gouveia', NULL,
    TRUE, 'Realizada', 'Pequenas lesões que já melhoraram, pele sensível. Petequias?', 'Outros',
    NULL, FALSE, NULL,
    '2026-08-05'::date, '2026-07-22T14:47:34.064461+00:00'::timestamptz, '2026-08-05T14:26:47.995807+00:00'::timestamptz
  ),
(
    '9e3d9a09-66a5-4140-8caf-fdc060728653', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Consulta', 'Ortopedista devido dor em MID',
    '2026-08-07'::date, '13:00', 'Faculdade de Medicina - Rua Teresopolis, 160,Veneza', 'Ortopedista', NULL,
    TRUE, 'Realizada', 'Dor em perna direita.', 'Outros',
    NULL, FALSE, NULL,
    '2026-08-07'::date, '2026-08-04T12:44:49.500836+00:00'::timestamptz, '2026-08-10T10:23:09.105649+00:00'::timestamptz
  ),
(
    'f4001b41-d99a-4b9e-b84a-ccd8d8dcba3c', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Consulta', 'Retorno da cirurgia mama',
    '2026-09-24'::date, '07:50', 'HMC I - Bairro das Águas', 'Dr Djalma', NULL,
    FALSE, 'Agendada', NULL, 'Outros',
    NULL, FALSE, NULL,
    NULL, '2026-08-27T14:00:53.604232+00:00'::timestamptz, '2026-08-27T14:01:45.173161+00:00'::timestamptz
  ),
(
    'c49d2acc-2a6b-4ec5-b36a-380b32e271a9', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Consulta', 'Elaine enviou',
    '2026-08-13'::date, '08:00', 'CLINICA DR FAMILIA - Avenida Selim José de Sales, 1167 Canaã  - Saúde Brasil - Sala 3.', 'Dra Sheila', 'Apta para cirurgia, aguardar SAM entrar em contato',
    TRUE, 'Realizada', NULL, 'Outros',
    NULL, FALSE, NULL,
    '2026-08-13'::date, '2026-08-12T15:57:18.496111+00:00'::timestamptz, '2026-08-13T14:30:22.490109+00:00'::timestamptz
  ),
(
    'f851108a-6090-4256-bdfe-f2babfde8aa7', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU003', 'Exame', 'Colonoscopia',
    '2026-08-11'::date, '14:00', 'Nucleo Digestivo', 'Dr Ralph', 'Sem alterações',
    TRUE, 'Realizada', NULL, 'Outros',
    '2026-08-11'::date, TRUE, '2026-08-13'::date,
    '2026-08-11'::date, '2026-08-11T12:12:21.382412+00:00'::timestamptz, '2026-08-13T14:30:56.095883+00:00'::timestamptz
  ),
(
    '92c2e5aa-76c3-407e-9501-4b5c7c3a4031', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU003', 'Consulta', 'Fisioterapia',
    '2026-08-14'::date, '08:00', 'Policlinica', 'Leticia', 'Agendou 20 sessoes',
    TRUE, 'Realizada', 'Encaminhamento do neurologista', 'Outros',
    NULL, FALSE, NULL,
    '2026-08-14'::date, '2026-08-04T12:34:54.722988+00:00'::timestamptz, '2026-08-14T12:34:21.644364+00:00'::timestamptz
  ),
(
    '487f6176-4518-4954-80d8-ee7000987b0d', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU007', 'Consulta', 'Acompanhamento com Dra Carla',
    '2026-08-17'::date, '13:00', 'UBS', 'Dra Carla', NULL,
    TRUE, 'Realizada', 'Renovar receita de Levotiroxina 50mcg e acompanhamento Diabetes', 'Clínica geral',
    NULL, FALSE, NULL,
    '2026-08-17'::date, '2026-08-06T14:56:00.284068+00:00'::timestamptz, '2026-08-18T15:28:45.347008+00:00'::timestamptz
  ),
(
    '47979228-f619-43aa-8de2-03de169f4e33', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU004', 'Consulta', 'Nefrologista - Acompanhamento',
    '2026-08-18'::date, '08:00', 'Policlinica', 'Dr Ricardo Alvarenga', NULL,
    TRUE, 'Realizada', 'IRC nível 4', 'Outros',
    NULL, FALSE, NULL,
    '2026-08-18'::date, '2026-08-06T10:36:34.491769+00:00'::timestamptz, '2026-08-18T15:28:51.606674+00:00'::timestamptz
  ),
(
    'c5dc02a0-0a89-4e44-80ce-ed340b5a8bef', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU004', 'Exame', 'Exames solicitados pelo nefrologista',
    '2026-11-01'::date, '08:00', 'UBS', 'Dr Ricardo', NULL,
    FALSE, 'Agendada', 'Acompanhamento função renal', 'Outros',
    NULL, FALSE, NULL,
    NULL, '2026-08-18T15:56:25.325719+00:00'::timestamptz, '2026-08-18T15:56:25.325719+00:00'::timestamptz
  ),
(
    'f015172c-9fcb-4411-91cc-85d5adc1a617', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU006', 'Consulta', 'Cirurgia  mama direita',
    '2026-08-22'::date, '09:30', 'HMCI', 'Dr. Djalma Igor de Oliveira Gonçalves', NULL,
    TRUE, 'Realizada', 'Cirurgia para retirada de margem de segurança oncológica', 'Outros',
    NULL, FALSE, NULL,
    '2026-08-22'::date, '2026-08-11T12:06:11.937996+00:00'::timestamptz, '2026-08-26T15:12:52.051726+00:00'::timestamptz
  ),
(
    '565f0aaf-8aa3-4da6-b050-bb1b04a83e46', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Exame', 'Hemograma para cirurgia',
    '2026-08-24'::date, '07:00', 'Laboratorio São Lucas - Cidade Nobre', 'Dr Fernando Xavier Ferreira', NULL,
    TRUE, 'Realizada', 'Cirurgia vesicula', 'Clínica geral',
    NULL, FALSE, NULL,
    '2026-08-24'::date, '2026-08-20T10:56:43.182444+00:00'::timestamptz, '2026-08-26T15:12:56.382037+00:00'::timestamptz
  ),
(
    'e5108f0f-28c9-4385-97e6-446cdcb91dfe', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU003', 'Consulta', 'Fisioterapia',
    '2026-09-09'::date, '14:00', 'Clinica', NULL, NULL,
    TRUE, 'Realizada', NULL, 'Psiquiatria',
    NULL, FALSE, NULL,
    '2026-09-09'::date, '2026-09-02T12:44:15.939616+00:00'::timestamptz, '2026-09-15T16:18:42.51717+00:00'::timestamptz
  ),
(
    '30dc810c-fbd6-45a7-a67a-9552582fb5b1', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU007', 'Consulta', 'Retorno',
    '2026-09-11'::date, '07:20', 'Policlinica', NULL, NULL,
    TRUE, 'Realizada', NULL, 'Neurologia',
    NULL, FALSE, NULL,
    '2026-09-11'::date, '2026-08-31T14:39:40.853612+00:00'::timestamptz, '2026-09-15T16:18:47.115527+00:00'::timestamptz
  ),
(
    '51dedbb0-4159-48a5-a840-0fc52fa8f656', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU003', 'Consulta', 'Fisioterapia',
    '2026-09-11'::date, '14:00', 'Clinica', NULL, NULL,
    TRUE, 'Realizada', NULL, 'Outros',
    NULL, FALSE, NULL,
    '2026-09-11'::date, '2026-09-02T12:44:48.332535+00:00'::timestamptz, '2026-09-15T16:18:51.756016+00:00'::timestamptz
  ),
(
    'dfb541a2-5675-4e5b-bfad-664a1c25b028', '255d05d4-83b9-4042-8355-2d66dfbe09f5', 'RU005', 'Exame', 'Agendar ultrassom abdominal na Clinica Superar - 31972539952',
    '2026-09-11'::date, '08:00', NULL, NULL, NULL,
    TRUE, 'Realizada', 'Ligar na clinica e agendar data e hora pra ultrassom abdominal. Lembrar do preparo.', 'Outros',
    NULL, FALSE, NULL,
    '2026-09-11'::date, '2026-09-03T13:53:31.624629+00:00'::timestamptz, '2026-09-15T16:18:56.993291+00:00'::timestamptz
  )
ON CONFLICT (id) DO NOTHING;
COMMIT;