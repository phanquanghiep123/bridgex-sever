SELECT
  tl.id AS"id",
  tl.task_id AS"taskId",
  tlr.type_id AS "typeId",
  tlr.asset_id AS "assetId",
  tlr.ftp_file_path AS "ftpFilePath",
  r.status AS "status",
  r.error_code AS "errorCode",
  r.error_msg AS "errorMsg",
  r.created_at AS "createdAt"
FROM
  task_log_retrievelogs AS tlr,
  retrievelogs AS r,
  task_log AS tl
WHERE
  tlr.id = tl.id AND
  tlr.id = r.id AND
  tlr.type_id = r.type_id AND
  tlr.asset_id = r.asset_id AND
  ( ${WHERE_PLACEHOLDER} )
;
