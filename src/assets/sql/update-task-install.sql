UPDATE task_install
SET
  status = COALESCE($2, task_install.status),
  updated_at = LOCALTIMESTAMP
WHERE
  task_id = $1
;
