# Supabase Provisioning

## Project Details

- **Project Ref**: `wnqzzplxfoutblsksvud`
- **Region**: eu-central-1 (AWS)
- **URL**: https://wnqzzplxfoutblsksvud.supabase.co

## Enabled Extensions

- ✅ `vector` - для векторного поиска
- ✅ `pg_stat_statements` - для мониторинга производительности

## Realtime

- **Publication**: `supabase_realtime` (пустая, таблицы добавятся позже)
- **Status**: Готова к использованию

## Environment Variables

### Client-side (NEXT*PUBLIC*\*)

- `NEXT_PUBLIC_SUPABASE_URL`: https://wnqzzplxfoutblsksvud.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Server-side (только на сервере!)

- `SUPABASE_URL`: https://wnqzzplxfoutblsksvud.supabase.co
- `SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `SUPABASE_SERVICE_ROLE`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (СЕКРЕТ!)

## Health Checks

- ✅ `GET /auth/v1/health` => 200 OK (с anon key)
- ✅ Extensions: `vector` установлен
- ✅ Realtime publication: существует

## Security Notes

- ⚠️ **SERVICE_ROLE** никогда не используется на клиенте
- ⚠️ **SERVICE_ROLE** хранится только в секретах (Vercel/CF/Doppler)
- ✅ RLS настроен "deny-by-default" (будет в S-01.3)

## Deployment

- **Vercel**: Environment variables настроены
- **Local**: .env.example обновлен (плейсхолдеры)

## CLI Commands

```bash
# Линкать проект
supabase link --project-ref wnqzzplxfoutblsksvud

# Применить миграции
supabase db push

# Проверить статус
supabase status
```
