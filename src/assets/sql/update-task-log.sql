UPDATE task_log AS d
SET
  status = COALESCE($2, d.status),
  updated_at = LOCALTIMESTAMP
WHERE
  task_id = $1
;
