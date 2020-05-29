WITH
  composite AS (
    SELECT
      composite_type_id as "type_id",
      composite_asset_id as "asset_id"
    FROM
      asset_composite_relation
    WHERE
      subasset_type_id = $1 AND subasset_asset_id = $2
  ),
  tasks AS (
    SELECT id
    FROM (
      SELECT id, task_id FROM task_download_package
      UNION
      SELECT id, task_id FROM task_install
      UNION
      SELECT id, task_id FROM task_log
      UNION
      SELECT id, task_id FROM task_reboot
      UNION
      SELECT id, task_id FROM task_selftest
    ) as t
    WHERE task_id = $3
  )
INSERT INTO event_list_bridge (
  type_id,
  asset_id,
  task_id,
  task_type,
  subject,
  importance
)
VALUES (
  COALESCE( (SELECT type_id FROM composite), $1),
  COALESCE( (SELECT asset_id FROM composite), $2),
  (SELECT id FROM tasks),
  $4,
  COALESCE( $5, ''),
  COALESCE( $6, 'information' )
)
;
