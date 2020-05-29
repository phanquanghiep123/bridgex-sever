DROP VIEW IF EXISTS asset_versions
;
DROP VIEW IF EXISTS test_asset_status_view
;
DROP VIEW IF EXISTS assets_status
;
DROP VIEW IF EXISTS asset_composite_relation
;
DROP VIEW IF EXISTS assets
;

/* install dblink command */
CREATE EXTENSION DBLINK;


CREATE OR REPLACE VIEW asset_type_master AS
SELECT
	gcon.*
FROM (
  SELECT
    *
  FROM
		dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
		SELECT
		  asset_type_name AS type_id,
		  asset_type_kind AS type_kind,
		  class_id        AS class_id,
		  device_class    AS device_class,
		  manufacturer    AS manufacturer,
		  product_number  AS product_number,
		  order_no        AS order_no,
		  description     AS description
		FROM
		  asset_type_master
		ORDER BY order_no, class_id, device_class, type_id
		') AS t (type_id text, type_kind int, class_id text, device_class text, manufacturer text, product_number text, order_no int, description text)
) AS gcon
;


/* create view */
CREATE OR REPLACE VIEW assets AS
SELECT
  gcon.asset_id,
  gcon.type_id,
  gcon.customer_id,
  gcon.location_id,
  gcon.region_id,
  gcon.description,
  gcon.alias,
  gcon.commissioning_timestamp,
  (
  gcon.search
  || chr(9) || COALESCE((SELECT ip_address FROM asset_elements WHERE type_id = gcon.type_id AND asset_id = gcon.asset_id), '')
  || chr(9) || COALESCE((SELECT note FROM asset_elements WHERE type_id = gcon.type_id AND asset_id = gcon.asset_id), '')
  ) AS search
FROM (
SELECT *
FROM dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
SELECT
  ASS.asset_name                    AS asset_id,
  ASSTP.asset_type_name             AS type_id,
  (CASE WHEN CP.name IS NULL THEN '''' ELSE CP.name END) AS customer_id,
  (CASE WHEN LT.name IS NULL THEN '''' ELSE LT.name END) AS location_id,
  (CASE WHEN RM.region_name IS NULL THEN '''' ELSE RM.region_name END) AS region_id,
  ASS.description                   AS description,
  ASS.alias                         AS alias,
  ASS.asset_commissioning_timestamp AS commissioning_timestamp,
  concat_ws(chr(9),ASS.asset_name,ASSTP.asset_type_name,(CASE WHEN CP.name IS NULL THEN '''' ELSE CP.name END),
  (CASE WHEN LT.name IS NULL THEN '''' ELSE LT.name END),(CASE WHEN RM.region_name IS NULL THEN '''' ELSE RM.region_name END),
  ASS.description,ASS.alias  )      AS search

FROM
  assets ASS
  INNER JOIN asset_type_master ASSTP
    ON ASS.asset_type_id = ASSTP.id
       AND
       ASSTP.asset_type_kind IN (0, 1)
  LEFT JOIN company_locations LT
    ON ASS.company_location_id = LT.id
  LEFT JOIN company CP
    ON LT.company_id = CP.id
  LEFT JOIN region_master RM
    ON ASS.region_id = RM.id
ORDER BY ASS.created_at desc
') AS t1 ( asset_id text, type_id text, customer_id text, location_id text, region_id text, description text, alias text, commissioning_timestamp timestamptz, search text
)) AS gcon
;

CREATE OR REPLACE VIEW
  asset_composite_relation
AS SELECT
  composite_type_id,
  composite_asset_id,
  subasset_type_id,
  subasset_asset_id
FROM (
  SELECT
    *
  FROM dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
SELECT
  ct.asset_type_name AS composite_type_id,
  ca.asset_name AS composite_asset_id,
  st.asset_type_name AS subasset_type_id,
  sa.asset_name AS subasset_asset_id
FROM
  asset_composite_relation AS r
LEFT JOIN
  assets AS ca
ON
  r.asset_id = ca.id
LEFT JOIN
  asset_type_master AS ct
ON
  ca.asset_type_id = ct.id
LEFT JOIN
  assets AS sa
ON
  sa.id = r.device_asset_id
LEFT JOIN
  asset_type_master AS st
ON
  sa.asset_type_id = st.id
'
	) AS t1 (
    composite_type_id text,
    composite_asset_id text,
    subasset_type_id text,
    subasset_asset_id text
  )
) AS gcon
;

CREATE OR REPLACE VIEW asset_versions AS
SELECT
  t.asset_id,
  t.type_id,
  t.composite_asset_id,
  t.composite_asset_type_id,
  t.subpart_name,
  t.subpart_version
FROM dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
  SELECT
    parentAsset.asset_name as asset_id,
    parentType.asset_type_name as type_id,
    compositeAsset.asset_name as composite_asset_id,
    compositeType.asset_type_name as composite_asset_type_id,
    subpart.asset_subpart_name as subpart_name,
    subpart.asset_subpart_version as subpart_version
  FROM
    assets as parentAsset
  INNER JOIN
    asset_type_master as parentType
  ON
    parentType.id = parentAsset.asset_type_id
  INNER JOIN
    asset_composite_relation as compositeRelation
  ON
    compositeRelation.asset_id = parentAsset.id
  LEFT JOIN
    assets as compositeAsset
  ON
    compositeAsset.id = compositeRelation.device_asset_id
  LEFT JOIN
    asset_type_master as compositeType
  ON
    compositeType.id = compositeAsset.asset_type_id
  INNER JOIN
    asset_subparts as subpart
  on
    subpart.asset_id = compositeAsset.id
  UNION
  SELECT
    parentAsset.asset_name as asset_id,
    parentType.asset_type_name as type_id,
    parentAsset.asset_name as composite_asset_id,
    parentType.asset_type_name as composite_asset_type_id,
    subpart.asset_subpart_name as subpart_name,
    subpart.asset_subpart_version as subpart_version
  FROM
    assets as parentAsset
  INNER JOIN
    asset_type_master as parentType
  ON
    parentType.id = parentAsset.asset_type_id
  INNER JOIN
    asset_subparts as subpart
  on
    subpart.asset_id = parentAsset.id
  WHERE
    parentAsset.id NOT IN (SELECT device_asset_id FROM asset_composite_relation)
  ORDER BY
    asset_id, composite_asset_id
  ;
  '::text) AS t(asset_id text, type_id text, composite_asset_id text, composite_asset_type_id text, subpart_name text, subpart_version text)
;

CREATE OR REPLACE VIEW company_locations AS
SELECT
	gcon.*
FROM (
  SELECT
    *
  FROM
		dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
		SELECT
		  CP.name          AS customer_id,
		  LT.name          AS location_id,
		  LT.description   AS description
		FROM
		  company CP
		  INNER JOIN company_locations LT
		    ON CP.id = LT.company_id
				   AND
			     CP.delete_flag IS NULL
		ORDER BY CP.name, LT.name
		') AS t (customer_id text, location_id text, description text)
) AS gcon
;

CREATE OR REPLACE VIEW company AS
SELECT
	gcon.*
FROM (
  SELECT
    *
  FROM
		dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
		SELECT
		  name          AS name,
		  description   AS description
		FROM
		  company
		WHERE
			delete_flag IS NULL
		ORDER BY name
		') AS t (name text, description text)
) AS gcon
;

CREATE OR REPLACE VIEW region_master AS
SELECT
	gcon.*
FROM (
  SELECT
    *
  FROM
		dblink('host=gconnect-postgres port=5432 dbname=postgres user=postgres password=postgres','
		SELECT
		  region_name   AS region_id
		FROM
		  region_master
		ORDER BY id
		') AS t (region_id text)
) AS gcon
;

CREATE OR REPLACE VIEW assets_status AS
SELECT assets.type_id, assets.asset_id,
CASE
   WHEN sub_asset_status @> ARRAY['Error'] then 'Error'
   WHEN sub_asset_status @> ARRAY['Good'] then 'Good'
   WHEN sub_asset_status @> ARRAY['Missing'] then 'Missing'
   WHEN sub_asset_status @> ARRAY['Online'] then 'Missing'
   WHEN asset_status.status IS NULL THEN 'Missing'
   WHEN asset_status.status = 'Online' then 'Missing'
   ELSE asset_status.status
 END AS status,
 asset_status.error_code
FROM assets
LEFT JOIN asset_status on asset_status.type_id=assets.type_id AND asset_status.asset_id=assets.asset_id
LEFT JOIN
(SELECT acr.composite_type_id, acr.composite_asset_id,
  ARRAY(SELECT DISTINCT st.status FROM asset_composite_relation ac
    JOIN asset_status st on st.type_id = ac.subasset_type_id AND st.asset_id = ac.subasset_asset_id
    WHERE ac.composite_type_id = acr.composite_type_id AND ac.composite_asset_id = acr.composite_asset_id) as sub_asset_status
FROM asset_composite_relation as acr GROUP BY acr.composite_type_id, acr.composite_asset_id) as acr_status ON assets.asset_id = acr_status.composite_asset_id AND assets.type_id = acr_status.composite_type_id

UNION
SELECT acr.subasset_type_id, acr.subasset_asset_id,
CASE
   WHEN asset_status.status IS NULL THEN 'Missing'
   WHEN asset_status.status = 'Online' then 'Missing'
   ELSE asset_status.status
 END AS status,
 asset_status.error_code
FROM asset_composite_relation acr
LEFT JOIN asset_status on asset_status.type_id=acr.subasset_type_id AND asset_status.asset_id=acr.subasset_asset_id
;


CREATE OR REPLACE VIEW test_asset_status_view AS
SELECT r.type_id,
    r.asset_id,
    COALESCE(a.status, 'Missing'::text) AS status,
    COALESCE(a.error_code, ''::text) AS error_code,
    r.is_subasset,
    r.composite_type_id,
    r.composite_asset_id
   FROM (( SELECT true AS is_subasset,
            asset_composite_relation.subasset_type_id AS type_id,
            asset_composite_relation.subasset_asset_id AS asset_id,
            asset_composite_relation.composite_type_id,
            asset_composite_relation.composite_asset_id,
            ((asset_composite_relation.composite_type_id || '  '::text) || asset_composite_relation.composite_asset_id) AS sort_keyword
           FROM asset_composite_relation
        UNION ALL
         SELECT false AS is_subasset,
            asset_composite_relation.composite_type_id AS type_id,
            asset_composite_relation.composite_asset_id AS asset_id,
            ''::text AS composite_type_id,
            ''::text AS composite_asset_id,
            ((asset_composite_relation.composite_type_id || '  '::text) || asset_composite_relation.composite_asset_id) AS sort_keyword
           FROM asset_composite_relation
          GROUP BY asset_composite_relation.composite_asset_id, asset_composite_relation.composite_type_id
        UNION ALL
         SELECT false AS is_subasset,
            assets.type_id,
            assets.asset_id,
            ''::text AS composite_type_id,
            ''::text AS composite_asset_id,
            ((assets.type_id || '  '::text) || assets.asset_id) AS sort_keyword
           FROM assets
          WHERE (NOT (EXISTS ( SELECT 1
                   FROM asset_composite_relation
                  WHERE (((asset_composite_relation.composite_type_id = assets.type_id) AND (asset_composite_relation.composite_asset_id = assets.asset_id)) OR ((asset_composite_relation.subasset_type_id = assets.type_id) AND (asset_composite_relation.subasset_asset_id = assets.asset_id))))))
  ORDER BY 6, 1) r
     LEFT JOIN asset_status a ON (((r.type_id = a.type_id) AND (r.asset_id = a.asset_id))));