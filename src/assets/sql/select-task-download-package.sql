SELECT
  download_package_info.task_id           AS "taskId",
  download_package_info.name              AS "name",
  download_package_info.status            AS "status",
  download_package_info.created_by        AS "createdBy",
  download_package_info.created_at        AS "createdAt",
  download_package_info.updated_at        AS "updatedAt",
  packages.package_id                     AS "packageId",
  packages.name                           AS "packageName",
  packages.status                         AS "packageStatus",
  packages.comment                        AS "packageComment",
  packages.upload_utc                     AS "packageUploadUtc",
  packages.upload_by                      AS "packageUploadBy",
  packages.summary                        AS "packageSummary",
  packages.description                    AS "packageDescription",
  packages.model                          AS "packageModel",
  packages.memo                           AS "packageMemo",
  packages.bucket_name                    AS "packageBucketName",
  packages.object_name                    AS "packageObjectName",
  packages.ftp_file_path                  AS "packageFtpFilePath",
  task_download_package_assets.type_id    AS "assetTypeId",
  task_download_package_assets.asset_id   AS "assetId",
  task_download_package_assets.status     AS "assetStatus",
  task_download_package_assets.started_at AS "assetStartedAt",
  task_download_package_assets.updated_at AS "assetUpdatedAt"
FROM
  (
    SELECT * FROM task_download_package WHERE task_id = $1
  ) AS download_package_info
LEFT JOIN packages                      ON  download_package_info.package_id = packages.id
LEFT JOIN task_download_package_assets  ON  download_package_info.id         = task_download_package_assets.id
;
