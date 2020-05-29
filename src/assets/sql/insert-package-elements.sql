WITH p_id AS (
  SELECT id
  FROM packages
  WHERE package_id=$1
)
INSERT INTO package_elements (
  package_id,
  key,
  value
)
VALUES
  ( (SELECT id FROM p_id), $2, $3 )
;