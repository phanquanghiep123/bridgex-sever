INSERT INTO task_reboot (
	task_id,
	status,
	created_by,
	memo,
	created_at,
	updated_at
)
VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
;
