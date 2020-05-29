SELECT
	  type_id as "typeId",
	  asset_id as "assetId",
	  null as "cashUnits"
FROM
	  assets
WHERE
	  type_id = $1
      AND asset_id = $2
UNION ALL
SELECT
    ai.type_id as "typeId",
    ai.asset_id as "assetId",
    ai.units as "cashUnits"
FROM
    asset_composite_relation AS acr
JOIN asset_inventories AS ai ON
	acr.subasset_asset_id = ai.asset_id
    AND acr.subasset_type_id = ai.type_id
WHERE
	acr.composite_type_id = $1
    AND acr.composite_asset_id = $2;
