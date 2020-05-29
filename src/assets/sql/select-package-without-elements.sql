SELECT
  package_id AS "id",
  name AS "name",
  status AS "status",
  comment AS "comment",
  upload_utc AS "uploadUtc",
  upload_by AS "uploadBy",
  summary AS "summary",
  description AS "description",
  model AS "model",
  memo AS "memo",
  bucket_name AS "bucketName",
  object_name AS "objectName",
  ftp_file_path AS "ftpFilePath",
  delete_flag AS "deleteFlag"
FROM
  packages
WHERE
  package_id=$1 AND delete_flag = false
;