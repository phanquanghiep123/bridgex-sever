INSERT INTO task_log (
	task_id,
	status,
	log_type,
	created_by,
	memo,
	created_at,
	updated_at
)
VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
;
