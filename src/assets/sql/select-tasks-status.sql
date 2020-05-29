SELECT
  task_id     	AS "taskId",
	'Deployment'	AS "taskType",
  status      	AS "status",
  ARRAY
	(
    SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(ta.*))
    FROM
		  (
	      SELECT
	        COALESCE(b.type_id, '')  AS "typeId",
	        COALESCE(b.asset_id, '') AS "assetId",
	        COALESCE(b.status, '')   AS "status"
	      FROM task_deployment a INNER JOIN task_deployment_assets b ON a.id = b.id
				WHERE
					task_id=$1
			) ta
  ) AS "taskAssets"
FROM
  task_deployment
WHERE
  task_id=$1

UNION ALL

SELECT
  task_id     	AS "taskId",
	'RetrieveLog'	AS "taskType",
  status      	AS "status",
  ARRAY
	(
    SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(ta.*))
    FROM
		  (
	      SELECT
	        COALESCE(b.type_id, '')  AS "typeId",
	        COALESCE(b.asset_id, '') AS "assetId",
	        COALESCE(b.status, '')   AS "status"
	      FROM task_log a INNER JOIN task_log_assets b ON a.id = b.id
				WHERE
					task_id=$1
			) ta
  ) AS "taskAssets"
FROM
  task_log
WHERE
  task_id=$1

UNION ALL

SELECT
  task_id     	AS "taskId",
	'Reboot'			AS "taskType",
  status      	AS "status",
  ARRAY
	(
    SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(ta.*))
    FROM
		  (
	      SELECT
	        COALESCE(b.type_id, '')  AS "typeId",
	        COALESCE(b.asset_id, '') AS "assetId",
	        COALESCE(b.status, '')   AS "status"
	      FROM task_reboot a INNER JOIN task_reboot_assets b ON a.id = b.id
				WHERE
					task_id=$1
			) ta
  ) AS "taskAssets"
FROM
  task_reboot
WHERE
  task_id=$1

UNION ALL

SELECT
  task_id     	AS "taskId",
	'SelfTest'		AS "taskType",
  status      	AS "status",
  ARRAY
	(
    SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(ta.*))
    FROM
		  (
	      SELECT
	        COALESCE(b.type_id, '')  AS "typeId",
	        COALESCE(b.asset_id, '') AS "assetId",
	        COALESCE(b.status, '')   AS "status"
	      FROM task_selftest a INNER JOIN task_selftest_assets b ON a.id = b.id
				WHERE
					task_id=$1
			) ta
  ) AS "taskAssets"
FROM
  task_selftest
WHERE
  task_id=$1
;
