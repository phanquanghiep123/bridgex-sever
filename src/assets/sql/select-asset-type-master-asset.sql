SELECT
  type_id   AS "typeId",
  (
    SELECT COUNT(*) FROM asset_type_master
    WHERE
      type_kind IN (0, 1)
  ) AS "totalCount"
FROM
  asset_type_master
WHERE
  type_kind IN (0, 1)
;
