SELECT
  a.asset_id                                AS "assetId",
  a.type_id                                 AS "typeId",
  a.customer_id                             AS "customerId",
  a.location_id                             AS "locationId",
  a.region_id                               AS "regionId",
  a.description                             AS "description",
  a.alias                                   AS "alias",
  COALESCE(assets_status.status, 'Missing') AS "status",
  COALESCE(asset_elements.ip_address, '')   AS "ipAddress",
  COALESCE(asset_elements.note, '')         AS "note",
  a.commissioning_timestamp                 AS "installationDate"
FROM
  assets a
LEFT JOIN assets_status ON assets_status.type_id = a.type_id AND assets_status.asset_id = a.asset_id
LEFT JOIN asset_elements ON asset_elements.type_id = a.type_id AND asset_elements.asset_id = a.asset_id
WHERE
  (a.type_id= $1 AND a.asset_id = $2)
;
