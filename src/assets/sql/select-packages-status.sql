SELECT
  package_id  AS "packageId",
  status      AS "status"
FROM
  packages
WHERE
  package_id=$1 AND delete_flag = false
;
