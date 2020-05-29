WITH p_asset AS (
  SELECT composite_type_id as type_id, composite_asset_id as asset_id
  FROM asset_composite_relation
  WHERE subasset_type_id=$1 AND subasset_asset_id=$2
  UNION
  SELECT type_id, asset_id
  FROM assets
  WHERE type_id=$1 AND asset_id=$2
)

INSERT INTO asset_elements AS s (
  type_id,
  asset_id,
  ip_address
) 
VALUES (
  (SELECT type_id FROM p_asset),
  (SELECT asset_id FROM p_asset),
  COALESCE($3, '')
)
ON CONFLICT (type_id,asset_id)
DO UPDATE SET
  ip_address=COALESCE($3, s.ip_address)
;
