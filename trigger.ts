import { sql } from '@deepcase/hasura/sql';

export interface IOptions {
  mpTableName?: string;
  graphTableName?: string;
  id_field?: string;
  to_field?: string;
  from_field?: string;
  id_type?: string;
}

export const Trigger = ({
  mpTableName = 'nodes__mp',
  graphTableName = 'nodes',
  id_field = 'id',
  to_field = 'to_id',
  from_field = 'from_id',
  id_type = 'integer',
}: IOptions) => ({
  downFunctionIsRoot: () => sql`DROP FUNCTION IF EXISTS ${mpTableName}__is_root;`,
  upFunctionIsRoot: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName}__is_root(node_id ${id_type}) RETURNS boolean AS $$
  DECLARE
  DECLARE result BOOLEAN;
  BEGIN
    SELECT COUNT("id") >= 1
    INTO result
    FROM
    "${mpTableName}"
    WHERE
    "item_id" = node_id AND
    "path_item_id" = node_id AND
    "path_item_depth" = 0
    LIMIT 1;
    RETURN result;
  END;
  $$ LANGUAGE plpgsql;`,
  
  downFunctionInsertNode: () => sql`DROP FUNCTION IF EXISTS ${mpTableName}__insert_node__function;`,
  upFunctionInsertNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName}__insert_node__function()
  RETURNS TRIGGER AS $trigger$
  DECLARE
    fromFlow RECORD;
    toFlow RECORD;
    positionId TEXT;
  BEGIN
    IF ((NEW."${from_field}" IS NOT NULL AND NEW."${from_field}" != 0) OR (NEW."${to_field}" IS NOT NULL AND NEW."${to_field}" != 0))
    THEN
      -- IL
      -- ILTR
      IF (SELECT * FROM ${mpTableName}__is_root(NEW."${to_field}"))
      THEN
        -- ILS
        FOR fromFlow
        IN (
          -- find all .from flows
          SELECT fromFlowItem.*
          FROM "${mpTableName}" as fromFlowItem
          WHERE
          fromFlowItem."item_id" = NEW."${from_field}" AND
          fromFlowItem."path_item_id" = NEW."${from_field}"
        )
        LOOP
          SELECT gen_random_uuid() INTO positionId;
  
          -- spread to link
          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id")
          SELECT
          NEW."${id_field}",
          fromItemPath."path_item_id",
          fromItemPath."path_item_depth",
          fromItemPath."root_id",
          positionId
          FROM "${mpTableName}" AS fromItemPath
          WHERE
          fromItemPath."item_id" = fromFlow."item_id" AND
          fromItemPath."root_id" = fromFlow."root_id";
  
          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id")
          VALUES
          (NEW."${id_field}", NEW."${id_field}", fromFlow."path_item_depth" + 1, fromFlow."root_id", positionId);
  
          FOR toFlow
          IN (
            -- find all .to and down nodes
            SELECT toFlowItem.*
            FROM "${mpTableName}" as toFlowItem
            WHERE
            toFlowItem."root_id" = NEW."${to_field}" AND
            toFlowItem."path_item_depth" = 0
          )
          LOOP
            SELECT gen_random_uuid() INTO positionId;
  
            -- toFlow."item_id"
  
            -- clone root flow path with move depth
            INSERT INTO "${mpTableName}"
            ("item_id","path_item_id","path_item_depth","root_id","position_id")
            SELECT
            toItemPath."item_id",
            toItemPath."path_item_id",
            toItemPath."path_item_depth" + fromFlow."path_item_depth" + 2,
            fromFlow."root_id",
            positionId
            FROM "${mpTableName}" AS toItemPath
            WHERE
            toItemPath."position_id" = toFlow."position_id";
  
            INSERT INTO "${mpTableName}"
            ("item_id","path_item_id","path_item_depth","root_id","position_id")
            VALUES
            (toFlow."item_id", NEW."${id_field}", fromFlow."path_item_depth" + 1, fromFlow."root_id", positionId);
  
            -- fill path in moved area
            INSERT INTO "${mpTableName}"
            ("item_id","path_item_id","path_item_depth","root_id","position_id")
            SELECT
            toFlow."item_id",
            fromItemPath."path_item_id",
            fromItemPath."path_item_depth",
            fromItemPath."root_id",
            positionId
            FROM "${mpTableName}" AS fromItemPath
            WHERE
            fromItemPath."item_id" = fromFlow."item_id" AND
            fromItemPath."root_id" = fromFlow."root_id";
  
          END LOOP;
  
          -- ILTFD
          DELETE FROM "${mpTableName}"
          WHERE "root_id" = NEW."${to_field}";
        END LOOP;
      ELSE
        -- ILTRF
        -- ILS
        FOR fromFlow
        IN (
          -- find all .from flows
          SELECT fromFlowItem.*
          FROM "${mpTableName}" as fromFlowItem
          WHERE
          fromFlowItem."item_id" = NEW."${from_field}" AND
          fromFlowItem."path_item_id" = NEW."${from_field}"
        )
        LOOP
          SELECT gen_random_uuid() INTO positionId;
  
          -- spread to link
          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id")
          SELECT
          NEW."${id_field}",
          fromItemPath."path_item_id",
          fromItemPath."path_item_depth",
          fromItemPath."root_id",
          positionId
          FROM "${mpTableName}" AS fromItemPath
          WHERE
          fromItemPath."item_id" = fromFlow."item_id" AND
          fromItemPath."root_id" = fromFlow."root_id";
  
          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id")
          VALUES
          (NEW."${id_field}", NEW."${id_field}", fromFlow."path_item_depth" + 1, fromFlow."root_id", positionId);
  
          FOR toFlow
          IN (
            -- ILTD ONLY DIFFERENCE!!!
            -- find all nodes of link flows next
            SELECT
            DISTINCT ON (nodesFlowPath."item_id") nodesFlowPath."item_id",
            nodesFlowPath."id",
            nodesFlowPath."path_item_id",
            nodesFlowPath."path_item_depth",
            nodesFlowPath."root_id",
            nodesFlowPath."position_id"
            FROM "${mpTableName}" as nodesFlowPath
            WHERE
            nodesFlowPath."path_item_id" = NEW."${to_field}"
          )
          LOOP
            SELECT gen_random_uuid() INTO positionId;
  
            -- toFlow."item_id"
  
            -- clone root flow path with move depth
            INSERT INTO "${mpTableName}"
            ("item_id","path_item_id","path_item_depth","root_id","position_id")
            SELECT
            toItemPath."item_id",
            toItemPath."path_item_id",
            toItemPath."path_item_depth" + fromFlow."path_item_depth" + 2,
            fromFlow."root_id",
            positionId
            FROM "${mpTableName}" AS toItemPath
            WHERE
            toItemPath."position_id" = toFlow."position_id" AND
            toItemPath."path_item_depth" >= toFlow."path_item_depth";
  
            INSERT INTO "${mpTableName}"
            ("item_id","path_item_id","path_item_depth","root_id","position_id")
            VALUES
            (toFlow."item_id", NEW."${id_field}", fromFlow."path_item_depth" + 1, fromFlow."root_id", positionId);
  
            -- fill path in moved area
            INSERT INTO "${mpTableName}"
            ("item_id","path_item_id","path_item_depth","root_id","position_id")
            SELECT
            toFlow."item_id",
            fromItemPath."path_item_id",
            fromItemPath."path_item_depth",
            fromItemPath."root_id",
            positionId
            FROM "${mpTableName}" AS fromItemPath
            WHERE
            fromItemPath."item_id" = fromFlow."item_id" AND
            fromItemPath."root_id" = fromFlow."root_id";
  
          END LOOP;
        END LOOP;
      END IF;
    ELSE
      -- IN
      -- INR
      -- INRR
      INSERT INTO "${mpTableName}"
      ("item_id","path_item_id","path_item_depth","root_id","position_id")
      VALUES
      (NEW."${id_field}",NEW."${id_field}",0,NEW."${id_field}",gen_random_uuid());
    END IF;
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;`,
  
  downFunctionWillRoot: () => sql`DROP FUNCTION IF EXISTS ${mpTableName}__will_root;`,
  upFunctionWillRoot: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName}__will_root(node_id ${id_type}, link_id ${id_type}) RETURNS boolean AS $$
  DECLARE
  DECLARE result BOOLEAN;
  BEGIN
    SELECT COUNT("${id_field}") = 0
    INTO result
    FROM
    "${graphTableName}"
    WHERE
    "${to_field}" = node_id AND
    "id" != link_id
    LIMIT 1;
    RETURN result;
  END;
  $$ LANGUAGE plpgsql;`,
  
  downFunctionDeleteNode: () => sql`DROP FUNCTION IF EXISTS ${mpTableName}__delete_node__function;`,
  upFunctionDeleteNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName}__delete_node__function()
  RETURNS TRIGGER AS $trigger$
  DECLARE
    linkFlow RECORD;
    nodesFlow RECORD;
  BEGIN
    IF ((OLD."${from_field}" IS NOT NULL AND OLD."${from_field}" != 0) OR (OLD."${to_field}" IS NOT NULL AND OLD."${to_field}" != 0))
    THEN
      -- DL
      IF (SELECT * FROM ${mpTableName}__will_root(OLD."${to_field}", OLD."id"))
      THEN
        -- DLWRF
        FOR nodesFlow
        IN (
          -- find all nodes of link flows next
          SELECT
          DISTINCT ON (nodesFlowPath."item_id") nodesFlowPath."item_id",
          nodesFlowPath."id",
          nodesFlowPath."path_item_id",
          nodesFlowPath."path_item_depth",
          nodesFlowPath."root_id",
          nodesFlowPath."position_id"
          FROM "${mpTableName}" as nodesFlowPath
          WHERE
          nodesFlowPath."path_item_id" = OLD."id"
        )
        LOOP
          DELETE FROM "${mpTableName}"
          WHERE
          "position_id" = nodesFlow."position_id" AND
          "path_item_depth" <= nodesFlow."path_item_depth";
  
          UPDATE "${mpTableName}"
          SET
          "path_item_depth" = "path_item_depth" - (nodesFlow."path_item_depth" + 1),
          "root_id" = OLD."${to_field}"
          WHERE "position_id" = nodesFlow."position_id";
        END LOOP;
  
        -- DLWRF
        FOR linkFlow
        IN (
          -- find all path items of link next
          SELECT linkFlowPath.*
          FROM "${mpTableName}" as linkFlowPath
          WHERE
          linkFlowPath."path_item_id" = OLD."id"
        )
        LOOP
          DELETE FROM "${mpTableName}"
          WHERE "position_id" = linkFlow."position_id";
        END LOOP;
  
      ELSE
        -- DLWRF
        FOR linkFlow
        IN (
          -- find all path items of link next
          SELECT linkFlowPath.*
          FROM "${mpTableName}" as linkFlowPath
          WHERE
          linkFlowPath."path_item_id" = OLD."id"
        )
        LOOP
          DELETE FROM "${mpTableName}"
          WHERE "position_id" = linkFlow."position_id";
        END LOOP;
  
      END IF;
    ELSE
    END IF;
  
    -- DN
    DELETE FROM "${mpTableName}"
    WHERE "item_id" = OLD."id";
  
    RETURN OLD;
  END;
  $trigger$ LANGUAGE plpgsql;`,
  
  downTriggerDelete: () => sql`DROP TRIGGER IF EXISTS ${mpTableName}__delete_node__trigger ON "${graphTableName}";`,
  upTriggerDelete: () => sql`CREATE TRIGGER ${mpTableName}__delete_node__trigger AFTER DELETE ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName}__delete_node__function();`,

  downTriggerInsert: () => sql`DROP TRIGGER IF EXISTS ${mpTableName}__insert_node__trigger ON "${graphTableName}";`,
  upTriggerInsert: () => sql`CREATE TRIGGER ${mpTableName}__insert_node__trigger AFTER INSERT ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName}__insert_node__function();`,
});
