SELECT
  a.composite_type_id as "typeId",
  a.composite_asset_id as "assetId"
FROM
  asset_composite_relation AS a
WHERE
    subasset_asset_id = $2
  AND
    subasset_type_id= $1
;
