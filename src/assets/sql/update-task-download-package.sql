UPDATE task_download_package
SET
  status = COALESCE($2, task_download_package.status),
  updated_at = LOCALTIMESTAMP
WHERE
  task_id = $1
;
