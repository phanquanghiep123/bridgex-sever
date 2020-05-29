WITH composite AS (
  SELECT 
    composite_type_id as "type_id",
    composite_asset_id as "asset_id"
  FROM
    asset_composite_relation
  WHERE
    subasset_type_id = $1 AND subasset_asset_id = $2
)
INSERT INTO event_list_asset (
  type_id,
  asset_id,
  subject,
  importance
)
VALUES (
  COALESCE( (SELECT type_id FROM composite), $1),
  COALESCE( (SELECT asset_id FROM composite), $2),
  COALESCE( $3, ''),
  COALESCE( $4, 'information' )
)
;
