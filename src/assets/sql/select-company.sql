SELECT
  name   AS "customerId",
  (
    SELECT COUNT(*) FROM company
  ) AS "totalCount"
FROM
  company
;
