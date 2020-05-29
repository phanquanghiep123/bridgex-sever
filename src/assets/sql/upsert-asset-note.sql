INSERT INTO asset_elements AS s (
  type_id,
  asset_id,
  note
) VALUES (
  $1,
  $2,
  COALESCE($3, '')
)
ON CONFLICT (type_id,asset_id)
DO UPDATE SET
  note=COALESCE($3, s.note)
;
