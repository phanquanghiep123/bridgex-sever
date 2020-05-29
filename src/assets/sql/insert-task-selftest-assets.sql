WITH t_id AS (
  SELECT id
  FROM task_selftest
  WHERE task_id=$1
)
INSERT INTO task_selftest_assets (
	id,
	asset_id,
	type_id,
	status,
	started_at,
	updated_at
)
VALUES ((SELECT id FROM t_id),$2,$3,$4,null,CURRENT_TIMESTAMP)
;
