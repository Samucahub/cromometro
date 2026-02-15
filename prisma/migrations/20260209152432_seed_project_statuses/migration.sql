-- Seed default statuses for existing collaborative projects
INSERT INTO "Status" ("id", "name", "order", "userId", "projectId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'To Do',
    0,
    "userId",
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Project"
WHERE "isCollaborative" = true
  AND NOT EXISTS (
    SELECT 1 FROM "Status" 
    WHERE "projectId" = "Project"."id" AND "name" = 'To Do'
  );

INSERT INTO "Status" ("id", "name", "order", "userId", "projectId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'In Progress',
    1,
    "userId",
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Project"
WHERE "isCollaborative" = true
  AND NOT EXISTS (
    SELECT 1 FROM "Status" 
    WHERE "projectId" = "Project"."id" AND "name" = 'In Progress'
  );

INSERT INTO "Status" ("id", "name", "order", "userId", "projectId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'Done',
    2,
    "userId",
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Project"
WHERE "isCollaborative" = true
  AND NOT EXISTS (
    SELECT 1 FROM "Status" 
    WHERE "projectId" = "Project"."id" AND "name" = 'Done'
  );
