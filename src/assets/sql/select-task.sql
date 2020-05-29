WITH deploymentTask AS (
  SELECT
    CAST(task_download_package.task_id AS TEXT) AS "id",
    task_download_package.name                  AS "name",
    'DownloadPackage'                           AS "taskType",
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
    ) AS "deploymentTaskPackages"
  FROM
    task_download_package
  JOIN task_relation ON task_relation.download_package_task_id = task_download_package.id
  JOIN task_install  ON task_relation.install_task_id          = task_install.id
  JOIN packages      ON packages.id                            = task_download_package.package_id

  UNION ALL

  SELECT
    CAST(task_install.task_id AS TEXT) AS "id",
    task_install.name                  AS "name",
    'Install'                          AS "taskType",
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
    ) AS "deploymentTaskPackages"
  FROM
    task_install
  JOIN task_relation         ON task_relation.install_task_id          = task_install.id
  JOIN task_download_package ON task_relation.download_package_task_id = task_download_package.id
  JOIN packages              ON packages.id                            = task_install.package_id
)
SELECT *
FROM deploymentTask
WHERE id = $1
;
