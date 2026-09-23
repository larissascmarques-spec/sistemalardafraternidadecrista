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