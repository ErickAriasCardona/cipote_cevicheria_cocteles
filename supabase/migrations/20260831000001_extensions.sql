-- Migración 1 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Habilita pgcrypto para gen_random_uuid(), usado como default de PK en todas
-- las tablas del modelo (convención documentada en el diccionario de datos).
create extension if not exists pgcrypto;
