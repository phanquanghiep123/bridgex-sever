UPDATE task_download_package_assets AS a
SET
  status = COALESCE($4, a.status),
  started_at = COALESCE($5, a.started_at)
WHERE
  (SELECT task_id FROM task_download_package AS t WHERE t.id = a.id) = $1 AND
  a.type_id = $2 AND
  a.asset_id = $3
;
