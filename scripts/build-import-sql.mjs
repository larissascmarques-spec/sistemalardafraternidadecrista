import fs from "node:fs";

const src = "C:/Users/LARISSA/Downloads/backup-farmalar.json";
const dest = "C:/Users/LARISSA/Downloads/import-farmalar.sql";
const backup = JSON.parse(fs.readFileSync(src, "utf8"));
const tables = backup.tables;

function lit(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "object") return `${sqlStr(JSON.stringify(v))}::jsonb`;
  return sqlStr(String(v));
}

function sqlStr(s) {
  return "'" + s.replace(/'/g, "''") + "'";
}

function arrText(v) {
  if (!Array.isArray(v)) return "ARRAY[]::text[]";
  if (v.length === 0) return "ARRAY[]::text[]";
  return "ARRAY[" + v.map((x) => sqlStr(String(x))) + "]::text[]";
}

function dateLit(v) {
  if (!v) return "NULL";
  return sqlStr(String(v).slice(0, 10)) + "::date";
}

function tsLit(v) {
  if (!v) return "NULL";
  return sqlStr(String(v)) + "::timestamptz";
}

const parts = [];
parts.push("-- Import Farmalar from backup-farmalar.json");
parts.push("-- Original user_id preserved so the same login sees the data.");
parts.push("BEGIN;");

const residentes = tables.residentes || [];
if (residentes.length) {
  parts.push(`INSERT INTO public.residentes (
    id, user_id, codigo, nome, data_nascimento, diagnosticos, alergias,
    responsavel, medico, ubs, observacoes, a_revisar, dependencia, mobilidade,
    dieta, alertas, haldol_injetavel, extras, created_at, updated_at
  ) VALUES`);
  const rows = residentes.map((r) => `(
    ${lit(r.id)}, ${lit(r.user_id)}, ${lit(r.codigo)}, ${lit(r.nome)}, ${dateLit(r.data_nascimento)},
    ${arrText(r.diagnosticos)}, ${arrText(r.alergias)}, ${lit(r.responsavel)}, ${lit(r.medico)},
    ${lit(r.ubs)}, ${lit(r.observacoes)}, ${lit(!!r.a_revisar)}, ${lit(r.dependencia)},
    ${lit(r.mobilidade)}, ${lit(r.dieta)}, ${arrText(r.alertas)}, ${lit(r.haldol_injetavel)},
    ${lit(r.extras || {})}, ${tsLit(r.created_at)}, ${tsLit(r.updated_at)}
  )`);
  parts.push(rows.join(",\n") + "\nON CONFLICT (id) DO NOTHING;");
}

const estoque = tables.estoque || [];
if (estoque.length) {
  parts.push(`INSERT INTO public.estoque (
    id, user_id, codigo, medicacao, apresentacao, lote, validade, quantidade,
    estoque_minimo, consumo_diario, origem, local, pacientes_uso, proxima_compra,
    observacao, tipo_uso, lancado_em, ultima_baixa, ultima_retirada, proxima_retirada,
    unidade, gotas_por_ml, created_at, updated_at
  ) VALUES`);
  const rows = estoque.map((r) => `(
    ${lit(r.id)}, ${lit(r.user_id)}, ${lit(r.codigo)}, ${lit(r.medicacao)}, ${lit(r.apresentacao)},
    ${lit(r.lote)}, ${dateLit(r.validade)}, ${lit(r.quantidade ?? 0)}, ${lit(r.estoque_minimo ?? 0)},
    ${lit(r.consumo_diario ?? 0)}, ${lit(r.origem)}, ${lit(r.local)}, ${lit(r.pacientes_uso || [])},
    ${dateLit(r.proxima_compra)}, ${lit(r.observacao)}, ${lit(r.tipo_uso || "continua")},
    ${dateLit(r.lancado_em)}, ${dateLit(r.ultima_baixa)}, ${dateLit(r.ultima_retirada)},
    ${dateLit(r.proxima_retirada)}, ${lit(r.unidade || "unidade")}, ${lit(r.gotas_por_ml)},
    ${tsLit(r.created_at)}, ${tsLit(r.updated_at)}
  )`);
  parts.push(rows.join(",\n") + "\nON CONFLICT (id) DO NOTHING;");
}

const agendamentos = tables.agendamentos || [];
if (agendamentos.length) {
  parts.push(`INSERT INTO public.agendamentos (
    id, user_id, residente_id, tipo, descricao, data, hora, local, medico,
    observacoes, realizado, status, motivo, especialidade, resultado_data,
    resultado_retirado, resultado_retirado_em, realizado_em, created_at, updated_at
  ) VALUES`);
  const rows = agendamentos.map((r) => `(
    ${lit(r.id)}, ${lit(r.user_id)}, ${lit(r.residente_id)}, ${lit(r.tipo)}, ${lit(r.descricao)},
    ${dateLit(r.data)}, ${lit(r.hora)}, ${lit(r.local)}, ${lit(r.medico)}, ${lit(r.observacoes)},
    ${lit(!!r.realizado)}, ${lit(r.status || "Agendada")}, ${lit(r.motivo)}, ${lit(r.especialidade)},
    ${dateLit(r.resultado_data)}, ${lit(!!r.resultado_retirado)}, ${dateLit(r.resultado_retirado_em)},
    ${dateLit(r.realizado_em)}, ${tsLit(r.created_at)}, ${tsLit(r.updated_at)}
  )`);
  parts.push(rows.join(",\n") + "\nON CONFLICT (id) DO NOTHING;");
}

parts.push("COMMIT;");
fs.writeFileSync(dest, parts.join("\n"), "utf8");
console.log(JSON.stringify({
  dest,
  residentes: residentes.length,
  estoque: estoque.length,
  agendamentos: agendamentos.length,
  bytes: fs.statSync(dest).size,
}));
