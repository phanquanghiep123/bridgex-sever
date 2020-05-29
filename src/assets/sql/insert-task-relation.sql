INSERT INTO task_relation (
  download_package_task_id,
  install_task_id
)
VALUES(
  (SELECT id FROM task_download_package WHERE task_id = $1),
  (SELECT id FROM task_install WHERE task_id = $2)
)
;
