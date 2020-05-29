WITH t_id AS (
  SELECT id
  FROM task_selftest
  WHERE task_id=$1
)
INSERT INTO selftests (
	id,
	asset_id,
	type_id,
  sub_asset_id,
  sub_type_id,
	status,
  error_code,
  error_msg,
  created_at,
  updated_at
)
VALUES ((SELECT id FROM t_id),$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
;
