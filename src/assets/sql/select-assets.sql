SELECT
  a.asset_id                                AS "assetId",
  a.type_id                                 AS "typeId",
  a.customer_id                             AS "customerId",
  a.location_id                             AS "locationId",
  a.region_id                               AS "regionId",
  a.description                             AS "description",
  a.alias                                   AS "alias",
  COALESCE(assets_status.status, 'Missing') AS "status",
  COALESCE(asset_elements.ip_address, '')    AS "ipAddress",
  COALESCE(asset_elements.note, '')          AS "note",
  a.commissioning_timestamp           AS "installationDate",
  COUNT(*) OVER() AS "totalCount"
FROM
  assets a
LEFT JOIN assets_status ON assets_status.type_id = a.type_id AND assets_status.asset_id = a.asset_id
LEFT JOIN asset_elements ON asset_elements.type_id = a.type_id AND asset_elements.asset_id = a.asset_id
WHERE
  COALESCE(a.type_id, '') LIKE ANY (STRING_TO_ARRAY($1,','))
  AND
  COALESCE(a.customer_id, '') LIKE $2
  AND
  COALESCE(a.location_id, '') LIKE $3
  AND
  COALESCE(a.region_id, '') LIKE $4
  AND
  COALESCE(a.search, '') ILIKE ALL (STRING_TO_ARRAY($5,' '))
  AND
  COALESCE(status, 'Missing') LIKE ANY (STRING_TO_ARRAY($8,','))
ORDER BY
  (CASE WHEN $9 = 'assetId asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'assetId asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'assetId asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'assetId desc' THEN a.asset_id END) DESC,
  (CASE WHEN $9 = 'assetId desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'assetId desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'typeId asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'typeId asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'typeId asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'typeId desc' THEN a.type_id END) DESC,
  (CASE WHEN $9 = 'typeId desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'typeId desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'customerId asc' THEN a.customer_id END) ASC,
  (CASE WHEN $9 = 'customerId asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'customerId asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'customerId asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'customerId desc' THEN a.customer_id END) DESC,
  (CASE WHEN $9 = 'customerId desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'customerId desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'customerId desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'locationId asc' THEN a.location_id END) ASC,
  (CASE WHEN $9 = 'locationId asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'locationId asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'locationId asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'locationId desc' THEN a.location_id END) DESC,
  (CASE WHEN $9 = 'locationId desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'locationId desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'locationId desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'regionId asc' THEN (CASE WHEN a.region_id IS NULL THEN 10 WHEN a.region_id='' THEN 10 ELSE 0 END)END) ASC,
  (CASE WHEN $9 = 'regionId asc' THEN a.region_id END) ASC,
  (CASE WHEN $9 = 'regionId asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'regionId asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'regionId asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'regionId desc' THEN (CASE WHEN a.region_id IS NULL THEN 10 WHEN a.region_id='' THEN 10 ELSE 0 END)END) DESC,
  (CASE WHEN $9 = 'regionId desc' THEN a.region_id END) DESC,
  (CASE WHEN $9 = 'regionId desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'regionId desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'regionId desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'alias asc' THEN (CASE WHEN a.alias IS NULL THEN 10 WHEN a.alias='' THEN 10 ELSE 0 END)END) ASC,
  (CASE WHEN $9 = 'alias asc' THEN a.alias END) ASC,
  (CASE WHEN $9 = 'alias asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'alias asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'alias asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'alias desc' THEN (CASE WHEN a.alias IS NULL THEN 10 WHEN a.alias='' THEN 10 ELSE 0 END)END) DESC,
  (CASE WHEN $9 = 'alias desc' THEN a.alias END) DESC,
  (CASE WHEN $9 = 'alias desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'alias desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'alias desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'ipAddress asc' THEN (CASE WHEN asset_elements.ip_address IS NULL THEN 10 WHEN asset_elements.ip_address='' THEN 10 ELSE 0 END)END) ASC,
  (CASE WHEN $9 = 'ipAddress asc' THEN asset_elements.ip_address END) ASC,
  (CASE WHEN $9 = 'ipAddress asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'ipAddress asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'ipAddress asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'ipAddress desc' THEN (CASE WHEN asset_elements.ip_address IS NULL THEN 10 WHEN asset_elements.ip_address='' THEN 10 ELSE 0 END) END) DESC,
  (CASE WHEN $9 = 'ipAddress desc' THEN asset_elements.ip_address END) DESC,
  (CASE WHEN $9 = 'ipAddress desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'ipAddress desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'ipAddress desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'status asc' THEN assets_status.status END) ASC,
  (CASE WHEN $9 = 'status asc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'status asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'status asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'status desc' THEN assets_status.status END) DESC,
  (CASE WHEN $9 = 'status desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'status desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'status desc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'installationDate asc' THEN a.commissioning_timestamp END) ASC,
  (CASE WHEN $9 = 'installationDate asc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'installationDate asc' THEN a.asset_id END) ASC,
  (CASE WHEN $9 = 'installationDate desc' THEN a.commissioning_timestamp END) DESC,
  (CASE WHEN $9 = 'installationDate desc' THEN a.type_id END) ASC,
  (CASE WHEN $9 = 'installationDate desc' THEN a.asset_id END) ASC
LIMIT $6 OFFSET $7
;
