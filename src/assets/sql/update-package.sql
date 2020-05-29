UPDATE packages
SET
  status=COALESCE($2, packages.status),
  summary=COALESCE($3, packages.summary),
  description=COALESCE($4, packages.description),
  model=COALESCE($5, packages.model),
  memo=COALESCE($6, packages.memo),
  ftp_file_path=COALESCE($7, packages.ftp_file_path),
  delete_flag=COALESCE($8, packages.delete_flag)
WHERE
  package_id=$1 AND delete_flag = false
;
