WITH
  evl_asset AS (
    SELECT created_at, subject, importance
    FROM event_list_asset
    WHERE ($4 = 'asset' OR $4 = 'all') AND type_id = $1 AND asset_id = $2
  ),
  evl_bridge AS (
    SELECT created_at, subject, importance
    FROM event_list_bridge
    WHERE ($4 = 'bridge' OR $4 = 'all')  AND type_id = $1 AND asset_id = $2
  ),
  event_list AS (
    SELECT
      created_at,
      event_source,
      subject,
      importance
    FROM (
      SELECT *, 'asset' AS "event_source" FROM evl_asset
      UNION
      SELECT *, 'bridge' AS "event_source" FROM evl_bridge
    ) AS evl
    WHERE
      subject LIKE $3 OR
      INITCAP(importance) LIKE $3
  )
SELECT
  created_at AS "date",
  event_source AS "eventSource",
  subject AS "subject",
  importance AS "importance",
  COUNT(*) OVER() AS "totalCount"
FROM
  event_list
ORDER BY
  created_at DESC
LIMIT $5 OFFSET $6
;
