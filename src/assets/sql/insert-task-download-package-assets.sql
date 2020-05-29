INSERT INTO task_download_package_assets (
  id,
  asset_id,
  type_id,
  status,
  started_at,
  updated_at
)
VALUES (
  (SELECT id FROM task_download_package WHERE task_id=$1),
  $2,
  $3,
  $4,
  null,
  LOCALTIMESTAMP
)
;
