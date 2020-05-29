SELECT
  install_info.task_id           AS "taskId",
  install_info.name              AS "name",
  install_info.status            AS "status",
  install_info.created_by        AS "createdBy",
  install_info.created_at        AS "createdAt",
  install_info.updated_at        AS "updatedAt",
  packages.package_id            AS "packageId",
  packages.name                  AS "packageName",
  packages.status                AS "packageStatus",
  packages.comment               AS "packageComment",
  packages.upload_utc            AS "packageUploadUtc",
  packages.upload_by             AS "packageUploadBy",
  packages.summary               AS "packageSummary",
  packages.description           AS "packageDescription",
  packages.model                 AS "packageModel",
  packages.memo                  AS "packageMemo",
  packages.bucket_name           AS "packageBucketName",
  packages.object_name           AS "packageObjectName",
  packages.ftp_file_path         AS "packageFtpFilePath",
  task_install_assets.type_id    AS "assetTypeId",
  task_install_assets.asset_id   AS "assetId",
  task_install_assets.status     AS "assetStatus",
  task_install_assets.started_at AS "assetStartedAt",
  task_install_assets.updated_at AS "assetUpdatedAt"
FROM
  (
    SELECT * FROM task_install WHERE task_id = $1
  ) AS install_info
LEFT JOIN packages                      ON  install_info.package_id = packages.id
LEFT JOIN task_install_assets           ON  install_info.id         = task_install_assets.id
;
