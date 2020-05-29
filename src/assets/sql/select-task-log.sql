SELECT
  tl.id AS "id",
  tl.task_id AS "taskId",
  tl.status AS "status",
  tl.log_type AS "logType",
  tl.memo AS "memo",
  tl.created_at AS "createdAt",
  tl.updated_at AS "updatedAt",
  ta.status AS "assetStatus",
  ta.started_at AS "assetStartedAt",
  ta.updated_at AS "assetUpdatedAt",
  acr.composite_type_id AS "assetTypeId",
  acr.composite_asset_id AS "assetId",
  acr.subasset_type_id AS "logAssetTypeId",
  acr.subasset_asset_id AS "logAssetId",
  tr.ftp_file_path AS "logFtpFilePath",
  r.status AS "logStatus",
  r.error_code AS "logErrorCode",
  r.error_msg AS "logErrorMsg",
  r.created_at AS "logCreatedAt"
FROM
  (
  SELECT
    *
  FROM
    task_log
  WHERE
    task_id = $1
  ) AS tl
  LEFT JOIN
    task_log_assets AS ta
    ON
      tl.id = ta.id
  LEFT JOIN
    asset_composite_relation AS acr
    ON
      ta.type_id = acr.composite_type_id
    AND
      ta.asset_id = acr.composite_asset_id
  LEFT JOIN
    task_log_retrievelogs AS tr
    ON
      tr.id = ta.id
    AND
      tr.type_id = acr.subasset_type_id
    AND
      tr.asset_id = acr.subasset_asset_id
  LEFT JOIN
    retrievelogs AS r
    ON
      r.id = tr.id
    AND
      r.type_id = tr.type_id
    AND
      r.asset_id = tr.asset_id
;
