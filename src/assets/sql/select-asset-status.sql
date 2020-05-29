SELECT
  r.type_id as "typeId",
  r.asset_id as "assetId",
  COALESCE(a.status, 'Missing') as "status",
  COALESCE(a.error_code, '') as "errorCode",
  r.is_subasset as "isSubAsset"
FROM (
  SELECT
    true AS "is_subasset",
    subasset_type_id AS "type_id",
    subasset_asset_id AS "asset_id"
  FROM
    asset_composite_relation
  WHERE
    composite_type_id = $1 AND composite_asset_id = $2
  UNION ALL
  SELECT
    false AS "is_subasset",
    type_id AS "type_id",
    asset_id AS "asset_id"
  FROM
    assets
  WHERE
    type_id = $1 AND
    asset_id = $2
  ) AS r
LEFT JOIN
  assets_status AS a
ON
  r.type_id = a.type_id AND r.asset_id = a.asset_id
ORDER BY
  "typeId", "assetId"
;
