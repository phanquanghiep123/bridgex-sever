INSERT INTO packages (
  package_id,
  name,
  status,
  comment,
  upload_utc,
  upload_by,
  summary,
  description,
  model,
  memo,
  bucket_name,
  object_name,
  ftp_file_path
)
VALUES (
  $1,
  $2,
  COALESCE($3, 'Uploading'),
  COALESCE($4, ''),
  LOCALTIMESTAMP,
  COALESCE($5, ''),
  COALESCE($6, ''),
  COALESCE($7, ''),
  COALESCE($8, ''),
  COALESCE($9, ''),
  COALESCE($10, ''),
  COALESCE($11, ''),
  COALESCE($12, '')
)
;