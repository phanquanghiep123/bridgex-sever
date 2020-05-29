WITH t_id AS (
  SELECT id
  FROM task_log
  WHERE task_id=$1
)
INSERT INTO retrievelogs (
	id,
	asset_id,
	type_id,
	status,
  error_code,
  error_msg,
  created_at
)
VALUES ((SELECT id FROM t_id),$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)
;
