WITH task AS (
  SELECT
    task_download_package.task_id  AS "task_id",
    task_install.task_id           AS "related_id"
  FROM
    task_download_package
  LEFT JOIN task_relation ON task_download_package.id = task_relation.download_package_task_id
  LEFT JOIN task_install  ON task_install.id          = task_relation.install_task_id

  UNION

  SELECT
    task_install.task_id          AS "task_id",
    task_download_package.task_id AS "related_id"
  FROM
    task_install
  LEFT JOIN task_relation         ON task_install.id          = task_relation.install_task_id
  LEFT JOIN task_download_package ON task_download_package.id = task_relation.download_package_task_id
)
SELECT
  related_id AS "relatedTaskId"
FROM
  task
WHERE
  task_id  = $1
;
