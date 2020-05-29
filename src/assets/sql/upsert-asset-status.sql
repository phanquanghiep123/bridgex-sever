INSERT INTO asset_status AS s (
  type_id,
  asset_id,
  status,
  error_code
) VALUES (
  $1,
  $2,
  COALESCE($3, 'Missing'),
  COALESCE($4, '')
)
ON CONFLICT (type_id,asset_id)
DO UPDATE SET
  status=COALESCE($3, s.status),
  error_code=COALESCE($4, s.error_code)
;
