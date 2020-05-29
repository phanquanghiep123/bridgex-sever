SELECT
  region_id   AS "regionId",
  (
    SELECT COUNT(*) FROM region_master
  ) AS "totalCount"
FROM
  region_master
;
