SELECT
  customer_id   AS "customerId",
  location_id   AS "locationId",
  (
    SELECT COUNT(*) FROM company_locations
    WHERE
      customer_id = $1
  ) AS "totalCount"
FROM
  company_locations
WHERE
  customer_id = $1
;
