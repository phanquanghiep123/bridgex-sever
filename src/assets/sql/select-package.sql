SELECT
  p.package_id           AS "id",
  p.name                 AS "name",
  p.status               AS "status",
  p.comment              AS "comment",
  p.upload_utc           AS "updateUtc",
  p.upload_by            AS "updateBy",
  p.summary              AS "summary",
  p.description          AS "description",
  p.model                AS "model",
  p.memo                 AS "memo",
  p.ftp_file_path        AS "ftpFilePath",
  COALESCE(pe.key, '')   AS "key",
  COALESCE(pe.value, '') AS "value",
  (
    SELECT
      COUNT(*)
    FROM
      packages p
	  WHERE delete_flag = false AND status LIKE COALESCE($3, '%')
    AND
    concat_ws(chr(9),
      name,
      status,
      upload_by,
      summary,
      description,
      model,
      COALESCE(ARRAY_TO_STRING(ARRAY((SELECT pe.key FROM package_elements pe WHERE p.id = pe.package_id)), chr(9)), ''),
      COALESCE(ARRAY_TO_STRING(ARRAY((SELECT pe.value FROM package_elements pe WHERE p.id = pe.package_id)), chr(9)), ''),
      memo
    ) ILIKE ALL (STRING_TO_ARRAY($4,' '))
  ) AS "totalCount"
FROM
  (
  SELECT * FROM packages p
  WHERE delete_flag = false AND status LIKE COALESCE($3, '%')
  AND
  concat_ws(chr(9),
    name,
    status,
    upload_by,
    summary,
    description,
    model,
    COALESCE(ARRAY_TO_STRING(ARRAY((SELECT pe.key FROM package_elements pe WHERE p.id = pe.package_id)), chr(9)), ''),
    COALESCE(ARRAY_TO_STRING(ARRAY((SELECT pe.value FROM package_elements pe WHERE p.id = pe.package_id)), chr(9)), ''),
    memo
  ) ILIKE ALL (STRING_TO_ARRAY($4,' '))
  ORDER BY
    (CASE WHEN $5 = 'name asc' THEN p.name END) ASC,
    (CASE WHEN $5 = 'name asc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'name asc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'name desc' THEN p.name END) DESC,
    (CASE WHEN $5 = 'name desc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'name desc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'status asc' THEN p.status END) ASC,
    (CASE WHEN $5 = 'status asc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'status asc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'status desc' THEN p.status END) DESC,
    (CASE WHEN $5 = 'status desc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'status desc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'summary asc' THEN p.summary END) ASC,
    (CASE WHEN $5 = 'summary asc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'summary asc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'summary desc' THEN p.summary END) DESC,
    (CASE WHEN $5 = 'summary desc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'summary desc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'date asc' THEN p.upload_utc END) ASC,
    (CASE WHEN $5 = 'date asc' THEN p.id END) DESC,
    (CASE WHEN $5 = 'date desc' THEN p.upload_utc END) DESC,
    (CASE WHEN $5 = 'date desc' THEN p.id END) DESC
  LIMIT $1 OFFSET $2 
  ) p 
LEFT JOIN
  package_elements pe
ON
  p.id = pe.package_id
ORDER BY
  (CASE WHEN $5 = 'name asc' THEN p.name END) ASC,
  (CASE WHEN $5 = 'name asc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'name asc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'name desc' THEN p.name END) DESC,
  (CASE WHEN $5 = 'name desc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'name desc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'status asc' THEN p.status END) ASC,
  (CASE WHEN $5 = 'status asc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'status asc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'status desc' THEN p.status END) DESC,
  (CASE WHEN $5 = 'status desc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'status desc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'summary asc' THEN p.summary END) ASC,
  (CASE WHEN $5 = 'summary asc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'summary asc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'summary desc' THEN p.summary END) DESC,
  (CASE WHEN $5 = 'summary desc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'summary desc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'date asc' THEN p.upload_utc END) ASC,
  (CASE WHEN $5 = 'date asc' THEN p.id END) DESC,
  (CASE WHEN $5 = 'date desc' THEN p.upload_utc END) DESC,
  (CASE WHEN $5 = 'date desc' THEN p.id END) DESC
