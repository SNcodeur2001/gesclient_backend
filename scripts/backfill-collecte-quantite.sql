UPDATE "Collecte" AS c
SET "quantiteKg" = sub.total_kg
FROM (
  SELECT "collecteId", COALESCE(SUM("quantiteKg"), 0) AS total_kg
  FROM "CollecteItem"
  GROUP BY "collecteId"
) AS sub
WHERE c."id" = sub."collecteId"
  AND (c."quantiteKg" IS NULL OR c."quantiteKg" <> sub.total_kg);
