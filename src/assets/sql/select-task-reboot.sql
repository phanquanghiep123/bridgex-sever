SELECT
  tr.id AS "id",
  tr.task_id AS "taskId",
  tr.status AS "status",
  tr.created_by AS "createdBy",
  tr.memo AS "memo",
  tr.created_at AS "createdAt",
  tr.updated_at AS "updatedAt",
  ta.type_id AS "assetTypeId",
  ta.asset_id AS "assetId",
  ta.status AS "assetStatus",
  ta.started_at AS "assetStartedAt",
  ta.updated_at AS "assetUpdatedAt",
  r.type_id AS "rebootTypeId",
  r.asset_id AS "rebootAssetId",
  r.sub_type_id AS "rebootSubTypeId",
  r.sub_asset_id AS "rebootSubAssetId",
  r.status AS "rebootStatus",
	r.error_code AS "rebootErrorCode",
	r.error_msg AS "rebootErrorMsg",
  r.created_at AS "rebootCreatedAt",
  r.updated_at AS "rebootUpdatedAt"
FROM
  task_reboot tr
  LEFT JOIN
    task_reboot_assets AS ta
    ON
    tr.id = ta.id
    LEFT JOIN
      reboots AS r
      ON
      ta.id = r.id
WHERE
  tr.task_id = $1
;
