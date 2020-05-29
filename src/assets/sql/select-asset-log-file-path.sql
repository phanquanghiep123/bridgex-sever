WITH task_log_detail AS (
	SELECT
		task_log_assets.id,
		task_log_assets.asset_id,
		task_log_assets.type_id,
		task_log_assets.status,
		task_log_retrievelogs.ftp_file_path
	FROM
		task_log_assets
	INNER JOIN
		task_log_retrievelogs
	ON
		task_log_assets.id       = task_log_retrievelogs.id       AND
		task_log_assets.type_id  = task_log_retrievelogs.type_id  AND
		task_log_assets.asset_id = task_log_retrievelogs.asset_id
)
SELECT
	task_log.status        		      AS "taskStatus",
	task_log_detail.status 		      AS "taskAssetStatus",
	task_log_detail.ftp_file_path   AS "ftpFilePath"
FROM
	task_log
INNER JOIN
	task_log_detail
ON
	task_log_detail.id = (SELECT id FROM task_log WHERE task_id = $1)
WHERE
	task_log.task_id         = $1 AND
	task_log_detail.type_id  = $2 AND
	task_log_detail.asset_id = $3
;
