WITH taskList AS (
  SELECT
    CAST(task_download_package.task_id AS TEXT) AS "id",
    task_download_package.name                  AS "name",
    'DownloadPackage'                           AS "taskType",
    task_install.task_id                        AS "relatedTaskId",
    'Install'                                   AS "relatedTaskType",
    task_download_package.status                AS "status",
    task_download_package.created_by            AS "createdBy",
    task_download_package.created_at            AS "createdAt",
    task_download_package.updated_at            AS "updatedAt",
    ARRAY(
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tda.*) )
      FROM (
        SELECT
          t_d_a.started_at                 AS "startedAt",
          t_d_a.updated_at                 AS "updatedAt",
          COALESCE(t_d_a.status, '')       AS "status",
          COALESCE(t_d_a.type_id, '')      AS "typeId",
          COALESCE(t_d_a.asset_id, '')     AS "assetId",
          COALESCE(assets.customer_id, '') AS "customerId",
          COALESCE(assets.location_id, '') AS "locationId",
          COALESCE(assets.region_id, '')   AS "regionId",
          COALESCE(assets.alias, '')       AS "alias"
        FROM task_download_package_assets t_d_a
        JOIN assets ON assets.asset_id = t_d_a.asset_id AND assets.type_id = t_d_a.type_id
        WHERE t_d_a.id = task_download_package.id
      ) tda
    ) AS "downloadPackageTaskAssets",
    '{}'::jsonb[] AS "installTaskAssets",
    jsonb_build_object(
      'packageId', packages.package_id,
      'date',      packages.upload_utc,
      'name',      COALESCE(packages.name, ''),
      'summary',   COALESCE(packages.summary, '')
    ) AS "deploymentTaskPackages",
    '{"logType": ""}'::jsonb AS "logTask",
    '{}'::jsonb[] AS "logTaskAssets",
    '{}'::jsonb[] AS "retrieveLogs",
    '{}'::jsonb AS "rebootTask",
    '{}'::jsonb[] AS "rebootTaskAssets",
    '{}'::jsonb AS "selfTestTask",
    '{}'::jsonb[] AS "selfTestTaskAssets"
  FROM
    task_download_package
  JOIN task_relation ON task_relation.download_package_task_id = task_download_package.id
  JOIN task_install  ON task_relation.install_task_id          = task_install.id
  JOIN packages      ON packages.id                            = task_download_package.package_id
  WHERE
    concat_ws(chr(9),
      task_download_package.status,
      task_download_package.name,
      'DownloadPackage',
      task_download_package.created_by
    )
    ILIKE ALL (STRING_TO_ARRAY($3,' '))

  UNION ALL

  SELECT
    CAST(task_install.task_id AS TEXT) AS "id",
    task_install.name                  AS "name",
    'Install'                          AS "taskType",
    task_download_package.task_id      AS "relatedTaskId",
    'DownloadPackage'                  AS "relatedTaskType",
    task_install.status                AS "status",
    task_install.created_by            AS "createdBy",
    task_install.created_at            AS "createdAt",
    task_install.updated_at            AS "updatedAt",
    '{}'::jsonb[]                      AS "downloadPackageTaskAssets",
    ARRAY(
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tia.*) )
      FROM (
        SELECT
          t_i_a.started_at                 AS "startedAt",
          t_i_a.updated_at                 AS "updatedAt",
          COALESCE(t_i_a.status, '')       AS "status",
          COALESCE(t_i_a.type_id, '')      AS "typeId",
          COALESCE(t_i_a.asset_id, '')     AS "assetId",
          COALESCE(assets.customer_id, '') AS "customerId",
          COALESCE(assets.location_id, '') AS "locationId",
          COALESCE(assets.region_id, '')   AS "regionId",
          COALESCE(assets.alias, '')       AS "alias"
        FROM task_install_assets t_i_a
        JOIN assets ON assets.asset_id = t_i_a.asset_id AND assets.type_id = t_i_a.type_id
        WHERE t_i_a.id = task_install.id
      ) tia
    ) AS "installTaskAssets",
    jsonb_build_object(
      'packageId', packages.package_id,
      'date',      packages.upload_utc,
      'name',      COALESCE(packages.name, ''),
      'summary',   COALESCE(packages.summary, '')
    ) AS "deploymentTaskPackages",
    '{"logType": ""}'::jsonb AS "logTask",
    '{}'::jsonb[] AS "logTaskAssets",
    '{}'::jsonb[] AS "retrieveLogs",
    '{}'::jsonb   AS "rebootTask",
    '{}'::jsonb[] AS "rebootTaskAssets",
    '{}'::jsonb   AS "selfTestTask",
    '{}'::jsonb[] AS "selfTestTaskAssets"
  FROM
    task_install
  JOIN task_relation         ON task_relation.install_task_id          = task_install.id
  JOIN task_download_package ON task_relation.download_package_task_id = task_download_package.id
  JOIN packages              ON packages.id                            = task_install.package_id
  WHERE
    concat_ws(chr(9),
      task_install.status,
      task_install.name,
      'Install',
      task_install.created_by
    )
    ILIKE ALL (STRING_TO_ARRAY($3,' '))

  UNION ALL

  SELECT
    CAST(tasklog.task_id AS TEXT)             AS "id",
    (tasklog.log_type || ' ' || tasklog.memo) AS "name",
    'RetrieveLog'                             AS "taskType",
    NULL                                      AS "relatedTaskId",
    NULL                                      AS "relatedTaskType",
    tasklog.status                            AS "status",
    tasklog.created_by                        AS "createdBy",
    tasklog.created_at                        AS "createdAt",
    tasklog.updated_at                        AS "updatedAt",
    '{}'::jsonb[]                             AS "downloadPackageTaskAssets",
    '{}'::jsonb[]                             AS "installTaskAssets",
    '{"name": ""}'::jsonb                     AS "deploymentTaskPackages",
    (
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tlg.*) )
      FROM (
        SELECT
          t_l.log_type AS "logType",
          t_l.memo     AS "memo"
        FROM task_log t_l
        WHERE t_l.id = tasklog.id
      ) tlg
    ) AS "logTask",
    ARRAY(
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tla.*))
      FROM (
        SELECT
          t_l_a.started_at                 AS "startedAt",
          t_l_a.updated_at                 AS "updatedAt",
          COALESCE(t_l_a.status, '')       AS "status",
          COALESCE(t_l_a.type_id, '')      AS "typeId",
          COALESCE(t_l_a.asset_id, '')     AS "assetId",
          COALESCE(assets.customer_id, '') AS "customerId",
          COALESCE(assets.location_id, '') AS "locationId",
          COALESCE(assets.region_id, '')   AS "regionId",
          COALESCE(assets.alias, '')       AS "alias"
        FROM task_log_assets t_l_a
        JOIN assets ON assets.asset_id = t_l_a.asset_id AND assets.type_id = t_l_a.type_id
        WHERE t_l_a.id = tasklog.id
      ) tla
    ) AS "logTaskAssets",
    ARRAY(
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tlr.*))
      FROM (
        SELECT
          COALESCE(t_l_r.type_id, '')       AS "typeId",
          COALESCE(t_l_r.asset_id, '')      AS "assetId",
          COALESCE(rls.status, '')          AS "status",
          COALESCE(rls.error_code, '')      AS "errorCode",
          COALESCE(rls.error_msg, '')       AS "errorMsg",
          COALESCE(t_l_r.ftp_file_path, '') AS "filePath",
          rls.created_at                    AS "createdAt"
        FROM task_log_retrievelogs t_l_r
        JOIN retrievelogs rls ON t_l_r.id = rls.id AND t_l_r.asset_id = rls.asset_id AND t_l_r.type_id = rls.type_id
        WHERE tasklog.id = t_l_r.id
      ) tlr
    ) AS "retrieveLogs",
    '{}'::jsonb AS "rebootTask",
    '{}'::jsonb[] AS "rebootTaskAssets",
    '{}'::jsonb AS "selfTestTask",
    '{}'::jsonb[] AS "selfTestTaskAssets"
  FROM
    task_log AS tasklog
  WHERE
    concat_ws(chr(9),
      tasklog.status,
      tasklog.log_type,
      tasklog.memo,
      'RetrieveLog',
      tasklog.created_by
    )
    ILIKE ALL (STRING_TO_ARRAY($3,' '))

  UNION ALL

  SELECT
    CAST(taskreboot.task_id AS TEXT) as "id",
    taskreboot.memo AS "name",
    'Reboot' AS "taskType",
    NULL                                      AS "relatedTaskId",
    NULL                                      AS "relatedTaskType",
    taskreboot.status,
    taskreboot.created_by AS "createdBy",
    taskreboot.created_at AS "createdAt",
    taskreboot.updated_at AS "updatedAt",
    '{}'::jsonb[]                             AS "downloadPackageTaskAssets",
    '{}'::jsonb[]                             AS "installTaskAssets",
    '{"name": ""}'::jsonb                     AS "deploymentTaskPackages",
    '{"logType": ""}'::jsonb AS "logTask",
    '{}'::jsonb[] AS "logTaskAssets",
    '{}'::jsonb[] AS "retrieveLogs",
    (
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(trg.*) )
      FROM (
        SELECT
          t_r.memo AS "memo"
        FROM task_reboot t_r
        WHERE t_r.id = taskreboot.id ) trg
    ) AS "rebootTask",
    ARRAY(
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tra.*))
      FROM (
        SELECT
          t_r_a.started_at AS "startedAt",
          t_r_a.updated_at AS "updatedAt",
          COALESCE(t_r_a.status, '') AS "status",
          COALESCE(t_r_a.type_id, '') AS "typeId",
          COALESCE(t_r_a.asset_id, '') AS "assetId",
          COALESCE(assets.customer_id, '') AS "customerId",
          COALESCE(assets.location_id, '') AS "locationId",
          COALESCE(assets.region_id, '') AS "regionId",
          COALESCE(assets.alias, '') AS "alias"
        FROM task_reboot_assets t_r_a JOIN assets ON assets.asset_id = t_r_a.asset_id AND assets.type_id = t_r_a.type_id
        WHERE t_r_a.id = taskreboot.id ) tra
    ) AS "rebootTaskAssets",
    '{}'::jsonb AS "selfTestTask",
    '{}'::jsonb[] AS "selfTestTaskAssets"
  FROM
    task_reboot AS taskreboot
  WHERE
    concat_ws(chr(9),
      taskreboot.status,
      taskreboot.memo,
      'Reboot',
      taskreboot.created_by
    ) ILIKE ALL (STRING_TO_ARRAY($3,' '))

  UNION ALL

  SELECT
    CAST(taskselftest.task_id AS TEXT) as "id",
    taskselftest.memo AS "name",
    'SelfTest' AS "taskType",
    NULL                                      AS "relatedTaskId",
    NULL                                      AS "relatedTaskType",
    taskselftest.status,
    taskselftest.created_by AS "createdBy",
    taskselftest.created_at AS "createdAt",
    taskselftest.updated_at AS "updatedAt",
    '{}'::jsonb[]                             AS "downloadPackageTaskAssets",
    '{}'::jsonb[]                             AS "installTaskAssets",
    '{"name": ""}'::jsonb                     AS "deploymentTaskPackages",
    '{"logType": ""}'::jsonb AS "logTask",
    '{}'::jsonb[] AS "logTaskAssets",
    '{}'::jsonb[] AS "retrieveLogs",
    '{}'::jsonb AS "rebootTask",
    '{}'::jsonb[] AS "rebootTaskAssets",
    (
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tsg.*) )
      FROM (
        SELECT
          t_s.memo AS "memo"
        FROM task_selftest t_s
        WHERE t_s.id = taskselftest.id ) tsg
    ) AS "selfTestTask",
    ARRAY(
      SELECT JSONB_ARRAY_ELEMENTS( JSONB_BUILD_ARRAY(tsa.*))
      FROM (
        SELECT
          t_s_a.started_at AS "startedAt",
          t_s_a.updated_at AS "updatedAt",
          COALESCE(t_s_a.status, '') AS "status",
          COALESCE(t_s_a.type_id, '') AS "typeId",
          COALESCE(t_s_a.asset_id, '') AS "assetId",
          COALESCE(assets.customer_id, '') AS "customerId",
          COALESCE(assets.location_id, '') AS "locationId",
          COALESCE(assets.region_id, '') AS "regionId",
          COALESCE(assets.alias, '') AS "alias"
        FROM task_selftest_assets t_s_a JOIN assets ON assets.asset_id = t_s_a.asset_id AND assets.type_id = t_s_a.type_id
        WHERE t_s_a.id = taskselftest.id ) tsa
    ) AS "selfTestTaskAssets"
  FROM
    task_selftest AS taskselftest
  WHERE
    concat_ws(chr(9),
      taskselftest.status,
      taskselftest.memo,
      'SelfTest',
      taskselftest.created_by
    ) ILIKE ALL (STRING_TO_ARRAY($3,' '))
)
SELECT
  *,
  (
    SELECT COUNT(*) FROM task_download_package
    WHERE
      concat_ws(
        chr(9),
        task_download_package.status,
        task_download_package.name,
        'DownloadPackage',
        task_download_package.created_by
      )
      ILIKE ALL (STRING_TO_ARRAY($3,' '))
  ) + (
    SELECT COUNT(*) FROM task_install
    WHERE
      concat_ws(
        chr(9),
        task_install.status,
        task_install.name,
        'Install',
        task_install.created_by
      )
      ILIKE ALL (STRING_TO_ARRAY($3,' '))
  ) + (
    SELECT COUNT(*) FROM task_log
    WHERE
      concat_ws(
        chr(9),
        task_log.status,
        task_log.log_type,
        task_log.memo,
        'RetrieveLog',
        task_log.created_by
      )
      ILIKE ALL (STRING_TO_ARRAY($3,' '))
  ) + (
    SELECT COUNT(*) FROM task_reboot
    WHERE
      concat_ws(
        chr(9),
        task_reboot.status,
        task_reboot.memo,
        'Reboot',
        task_reboot.created_by
      )
      ILIKE ALL (STRING_TO_ARRAY($3,' '))
  ) + (
    SELECT COUNT(*) FROM task_selftest
    WHERE
      concat_ws(
        chr(9),
        task_selftest.status,
        task_selftest.memo,
        'SelfTest',
        task_selftest.created_by
      ) ILIKE ALL (STRING_TO_ARRAY($3,' '))
  ) AS "totalCount"
FROM taskList
ORDER BY
  (CASE WHEN $4 = 'status asc'      THEN status      END) ASC,
  (CASE WHEN $4 = 'status asc'      THEN "updatedAt" END) DESC,
  (CASE WHEN $4 = 'status desc'     THEN status      END) DESC,
  (CASE WHEN $4 = 'status desc'     THEN "updatedAt" END) DESC,
  (CASE WHEN $4 = 'name asc'        THEN name        END) ASC,
  (CASE WHEN $4 = 'name asc'        THEN "updatedAt" END) DESC,
  (CASE WHEN $4 = 'name desc'       THEN name        END) DESC,
  (CASE WHEN $4 = 'name desc'       THEN "updatedAt" END) DESC,
  (CASE WHEN $4 = 'taskType asc'    THEN "taskType"  END) ASC,
  (CASE WHEN $4 = 'taskType asc'    THEN "updatedAt" END) DESC,
  (CASE WHEN $4 = 'taskType desc'   THEN "taskType"  END) DESC,
  (CASE WHEN $4 = 'taskType desc'   THEN "updatedAt" END) DESC,
  (CASE WHEN $4 = 'updateDate asc'  THEN "updatedAt" END) ASC,
  (CASE WHEN $4 = 'updateDate desc' THEN "updatedAt" END) DESC
LIMIT $1 OFFSET $2
;
