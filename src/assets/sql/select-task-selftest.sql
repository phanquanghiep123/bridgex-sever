SELECT
  ts.id AS "id",
  ts.task_id AS "taskId",
  ts.status AS "status",
  ts.created_by AS "createdBy",
  ts.memo AS "memo",
  ts.created_at AS "createdAt",
  ts.updated_at AS "updatedAt",
  ta.type_id AS "assetTypeId",
  ta.asset_id AS "assetId",
  ta.status AS "assetStatus",
  ta.started_at AS "assetStartedAt",
  ta.updated_at AS "assetUpdatedAt",
  s.type_id AS "selftestTypeId",
  s.asset_id AS "selftestAssetId",
  s.sub_type_id AS "selftestSubTypeId",
  s.sub_asset_id AS "selftestSubAssetId",
  s.status AS "selftestStatus",
	s.error_code AS "selftestErrorCode",
	s.error_msg AS "selftestErrorMsg",
  s.created_at AS "selftestCreatedAt",
  s.updated_at AS "selftestUpdatedAt"
FROM
  task_selftest ts
  LEFT JOIN
    task_selftest_assets AS ta
    ON
    ts.id = ta.id
    LEFT JOIN
      selftests AS s
      ON
      ta.id = s.id
WHERE
  ts.task_id = $1
;
