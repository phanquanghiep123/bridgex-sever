SELECT
	type_id as "typeId",
	asset_id as "assetId",
	'' as "subpartName",
	'' as "subpartVersion"
FROM
	assets
WHERE
	type_id = $1 AND
	asset_id = $2
UNION ALL
SELECT
	composite_asset_type_id as "typeId",
	composite_asset_id as "assetId",
	subpart_name as "subpartName",
	subpart_version as "subpartVersion"
FROM
	asset_versions
WHERE
	type_id = $1 AND
	asset_id = $2
;
