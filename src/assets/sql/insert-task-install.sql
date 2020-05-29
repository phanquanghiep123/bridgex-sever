INSERT INTO task_install(
  task_id,
  name,
  package_id,
  status,
  created_by,
  created_at,
  updated_at
)
VALUES (
  $1,
  $2,
  (SELECT id FROM packages WHERE package_id = $3),
  $4,
  $5,
  LOCALTIMESTAMP,
  LOCALTIMESTAMP
)
;
