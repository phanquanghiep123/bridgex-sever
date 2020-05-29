SELECT
  status as "status",
  COUNT(status) as "count"
FROM assets
LEFT JOIN assets_status USING (type_id, asset_id)
GROUP BY status
;
