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