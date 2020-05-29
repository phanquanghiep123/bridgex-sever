UPDATE reboots AS a
SET
  status = COALESCE($6, a.status),
  error_code = COALESCE($7, a.error_code),
  error_msg = COALESCE($8, a.error_msg),
  updated_at = COALESCE($9, a.updated_at)
WHERE
  (SELECT task_id FROM task_reboot AS t WHERE t.id = a.id) = $1 AND
  a.type_id = $2 AND
  a.asset_id = $3 AND
  a.sub_type_id = $4 AND
  a.sub_asset_id = $5
;
