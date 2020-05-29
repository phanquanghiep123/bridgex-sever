WITH t_id AS (
  SELECT id
  FROM task_log
  WHERE task_id=$1
)
INSERT INTO task_log_retrievelogs (
	id,
	asset_id,
	type_id,
	ftp_file_path
)
VALUES ((SELECT id FROM t_id),$2,$3,$4)
;
