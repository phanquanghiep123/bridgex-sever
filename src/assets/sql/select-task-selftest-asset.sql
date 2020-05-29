SELECT
  t.id AS "id",
  t.task_id AS "taskId",
  a.type_id AS "typeId",
  a.asset_id AS "assetId",
  a.status AS "status",
  a.started_at AS "startedAt",
  a.updated_at AS "updatedAt"
FROM
  task_selftest_assets AS a,
  task_selftest AS t
WHERE
  t.task_id = $1 AND
  a.type_id = $2 AND
  a.asset_id = $3 AND
  t.id = a.id
;
