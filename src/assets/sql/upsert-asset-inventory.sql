INSERT INTO asset_inventories AS ai (
  type_id,
  asset_id,
  units
) VALUES (
  $1,
  $2,
  $3
)
ON CONFLICT (type_id, asset_id)
DO UPDATE SET
  units=COALESCE($3, ai.units),
  updated_at=LOCALTIMESTAMP
;
