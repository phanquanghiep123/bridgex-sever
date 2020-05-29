SELECT
  package_id AS "id",
  name AS "name"
FROM
  packages
WHERE
  ${WHERE_PLACEHOLDER}
;
