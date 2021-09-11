import { sql } from '@deepcase/hasura/sql';

export interface IOptions {
  mpTableName?: string;
  graphTableName?: string;
  id_field?: string;
  to_field?: string;
  from_field?: string;
  id_type?: string;
  iteratorInsertDeclare?: string;
  iteratorInsertBegin?: string;
  iteratorInsertEnd?: string;
  iteratorDeleteArgumentSend?: string;
  iteratorDeleteArgumentGet?: string;
  iteratorDeleteDeclare?: string;
  iteratorDeleteBegin?: string;
  iteratorDeleteEnd?: string;
  groupInsert?: string;
  groupDelete?: string;
  additionalFields?: string;
  additionalData?: string;
}

export const Trigger = ({
  mpTableName = 'links__mp',
  graphTableName = 'links',
  id_field = 'id',
  to_field = 'to_id',
  from_field = 'from_id',
  id_type = 'integer',
  iteratorInsertDeclare = '',
  iteratorInsertBegin = '',
  iteratorInsertEnd = '',
  iteratorDeleteArgumentSend = '',
  iteratorDeleteArgumentGet = '',
  iteratorDeleteDeclare = '',
  iteratorDeleteBegin = '',
  iteratorDeleteEnd = '',
  groupInsert = '',
  groupDelete = '',
  additionalFields = '',
  additionalData = '',
}: IOptions) => ({
  downFunctionInsertNode: () => sql`
    DROP FUNCTION IF EXISTS ${mpTableName}__insert_link__function;
    DROP FUNCTION IF EXISTS ${mpTableName}__insert_link__function_core;
  `,
  upFunctionInsertNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName}__insert_link__function_core(NEW RECORD)
  RETURNS VOID AS $trigger$
  DECLARE
    fromInFlow RECORD;
    toOutFlow RECORD;
    currentFlow RECORD;
    positionId TEXT;
    ${iteratorInsertDeclare}
  BEGIN
    ${iteratorInsertBegin}
      IF EXISTS (
        SELECT * FROM "${graphTableName}" as fromInFlowLink, "${mpTableName}" as mp WHERE
        mp."group_id" = ${groupInsert} AND
        mp."path_item_id" = NEW."${id_field}" AND
        (
          (
            fromInFlowLink."${id_field}" = NEW."${from_field}" AND
            mp."item_id" = fromInFlowLink."${id_field}"
          ) OR (
            fromInFlowLink."${to_field}" = NEW."${id_field}" AND
            mp."item_id" = fromInFlowLink."${id_field}"
          )
        )
      ) THEN
        RAISE EXCEPTION 'recursion detected for %', NEW."${id_field}"; 
      END IF;

      FOR fromInFlow
      IN (
        SELECT fromInFlowItem.*
        FROM "${graphTableName}" as fromInFlowLink, "${mpTableName}" as fromInFlowItem
        WHERE
        (
          fromInFlowLink."${id_field}" = NEW."${from_field}" AND
          fromInFlowItem."item_id" = fromInFlowLink."${id_field}" AND
          fromInFlowItem."path_item_id" = fromInFlowLink."${id_field}" AND
          fromInFlowItem."group_id" = ${groupInsert}
        ) OR (
          fromInFlowLink."${to_field}" = NEW."${id_field}" AND
          fromInFlowItem."item_id" = fromInFlowLink."${id_field}" AND
          fromInFlowItem."path_item_id" = fromInFlowLink."${id_field}" AND
          fromInFlowItem."group_id" = ${groupInsert}
        )
      )
      LOOP
        SELECT gen_random_uuid() INTO positionId;

        INSERT INTO "${mpTableName}"
        ("item_id","path_item_id","path_item_depth","root_id","position_id","group_id"${additionalFields})
        SELECT
        NEW."${id_field}",
        fromInItemPath."path_item_id",
        fromInItemPath."path_item_depth",
        fromInItemPath."root_id",
        positionId,
        ${groupInsert}
        ${additionalData}
        FROM "${mpTableName}" AS fromInItemPath
        WHERE
        fromInItemPath."item_id" = fromInFlow."item_id";

        INSERT INTO "${mpTableName}"
        ("item_id","path_item_id","path_item_depth","root_id","position_id","group_id"${additionalFields})
        VALUES
        (NEW."${id_field}",NEW."${id_field}",fromInFlow."path_item_depth" + 1,fromInFlow."root_id",positionId,${groupInsert}${additionalData});
      END LOOP;

      IF (
        SELECT COUNT("id") = 0
        FROM "${mpTableName}"
        WHERE
        "item_id" = NEW."${id_field}" AND
        "group_id" = ${groupInsert}
        LIMIT 1
      )
      THEN
        INSERT INTO "${mpTableName}"
        ("item_id","path_item_id","path_item_depth","root_id","position_id","group_id"${additionalFields})
        VALUES
        (NEW."${id_field}",NEW."${id_field}",0,NEW."${id_field}",gen_random_uuid(),${groupInsert}${additionalData});
      END IF;

      FOR currentFlow
      IN (
        SELECT currentFlowItem.*
        FROM "${mpTableName}" as currentFlowItem
        WHERE
        currentFlowItem."item_id" = NEW."${id_field}" AND
        currentFlowItem."path_item_id" = NEW."${id_field}" AND
        currentFlowItem."group_id" = ${groupInsert}
      )
      LOOP
        FOR toOutFlow
        IN (
          SELECT
          DISTINCT toOutFlowItem."path_item_id", toOutFlowItem."path_item_depth", toOutFlowItem."group_id", toOutFlowItem."position_id",toOutFlowItem."item_id"
          FROM "${graphTableName}" as toOutFlowLink, "${mpTableName}" as toOutFlowItem
          WHERE
          (
            toOutFlowLink."${id_field}" = NEW."${to_field}" AND
            toOutFlowItem."item_id" = toOutFlowLink."${id_field}" AND
            toOutFlowItem."path_item_id" = toOutFlowLink."${id_field}" AND
            toOutFlowItem."group_id" = ${groupInsert}
          ) OR (
            toOutFlowLink."${from_field}" = NEW."${id_field}" AND
            toOutFlowItem."item_id" = toOutFlowLink."${id_field}" AND
            toOutFlowItem."path_item_id" = toOutFlowLink."${id_field}" AND
            toOutFlowItem."group_id" = ${groupInsert}
          )
        )
        LOOP
          
          SELECT gen_random_uuid() INTO positionId;

          -- add prev flows current to to/out flow
          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id","group_id"${additionalFields})
          SELECT
          toOutFlowDown."item_id",
          spreadingFlows."path_item_id",
          spreadingFlows."path_item_depth",
          spreadingFlows."root_id",
          positionId,
          ${groupInsert}
          ${additionalData}
          FROM "${mpTableName}" AS spreadingFlows, "${mpTableName}" AS toOutFlowDown
          WHERE
          spreadingFlows."position_id" = currentFlow."position_id" AND
          spreadingFlows."item_id" = currentFlow."item_id" AND
          spreadingFlows."group_id" = currentFlow."group_id" AND
          toOutFlowDown."group_id" = toOutFlow."group_id" AND
          toOutFlowDown."path_item_id" = toOutFlow."path_item_id" AND
          toOutFlowDown."id" IN (
            SELECT toOutFlowDownPath."id"
            FROM
            "${mpTableName}" AS toOutFlowDownPath,
            "${mpTableName}" AS toOutFlowPath
            WHERE
            toOutFlowPath."position_id" = toOutFlow."position_id" AND
            toOutFlowPath."item_id" = toOutFlow."item_id" AND
            toOutFlowPath."path_item_depth" <= toOutFlow."path_item_depth" AND
            toOutFlowDownPath."position_id" = toOutFlowDown."position_id" AND
            toOutFlowDownPath."item_id" = toOutFlowDown."item_id" AND
            toOutFlowDownPath."path_item_depth" <= toOutFlow."path_item_depth" AND
            toOutFlowPath."path_item_id" = toOutFlowDownPath."path_item_id" AND
            toOutFlowPath."path_item_depth" = toOutFlowDownPath."path_item_depth"
          );

          -- clone exists flows of to/out
          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id","group_id"${additionalFields})
          SELECT
          toOutItems."item_id",
          toOutItems."path_item_id",
          toOutItems."path_item_depth" + currentFlow."path_item_depth" + 1 - toOutFlow."path_item_depth",
          currentFlow."root_id",
          positionId,
          ${groupInsert}
          ${additionalData}
          FROM "${mpTableName}" AS toOutFlowDown, "${mpTableName}" AS toOutItems
          WHERE
          toOutFlowDown."group_id" = toOutFlow."group_id" AND
          toOutFlowDown."path_item_id" = toOutFlow."path_item_id" AND
          toOutItems."item_id" = toOutFlowDown."item_id" AND
          toOutItems."position_id" = toOutFlowDown."position_id" AND
          toOutItems."path_item_depth" >= toOutFlow."path_item_depth" AND
          toOutItems."group_id" = toOutFlowDown."group_id" AND
          toOutFlowDown."id" IN (
            SELECT toOutFlowDownPath."id"
            FROM
            "${mpTableName}" AS toOutFlowDownPath,
            "${mpTableName}" AS toOutFlowPath
            WHERE
            toOutFlowPath."position_id" = toOutFlow."position_id" AND
            toOutFlowPath."item_id" = toOutFlow."item_id" AND
            toOutFlowPath."path_item_depth" <= toOutFlow."path_item_depth" AND
            toOutFlowDownPath."position_id" = toOutFlowDown."position_id" AND
            toOutFlowDownPath."item_id" = toOutFlowDown."item_id" AND
            toOutFlowDownPath."path_item_depth" <= toOutFlow."path_item_depth" AND
            toOutFlowPath."path_item_id" = toOutFlowDownPath."path_item_id" AND
            toOutFlowPath."path_item_depth" = toOutFlowDownPath."path_item_depth"
          );

          -- delete trash roots
          DELETE FROM "${mpTableName}"
          WHERE "root_id" = toOutFlow."path_item_id";
        END LOOP;
      END LOOP;
    ${iteratorInsertEnd}
  END;
  $trigger$ LANGUAGE plpgsql;
  CREATE OR REPLACE FUNCTION ${mpTableName}__insert_link__function()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    PERFORM ${mpTableName}__insert_link__function_core(NEW);
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;`,
  
  downFunctionDeleteNode: () => sql`
    DROP FUNCTION IF EXISTS ${mpTableName}__delete_link__function;
    DROP FUNCTION IF EXISTS ${mpTableName}__delete_link__function_core;
  `,
  upFunctionDeleteNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName}__delete_link__function_core(OLD RECORD${iteratorDeleteArgumentGet ? `,${iteratorDeleteArgumentGet}` : ''})
  RETURNS VOID AS $trigger$
  DECLARE
    linkFlow RECORD;
    toOutItems RECORD;
    inFromFlow RECORD;
  BEGIN
    FOR toOutItems
    IN (
      SELECT toOutFlowItem.*
      FROM "${graphTableName}" as toOutFlowLink, "${mpTableName}" as toOutFlowItem
      WHERE
      (
        toOutFlowLink."${id_field}" = OLD."${to_field}" AND
        toOutFlowItem."item_id" = toOutFlowLink."${id_field}" AND
        toOutFlowItem."path_item_id" = toOutFlowLink."${id_field}" AND
        toOutFlowItem."group_id" = ${groupDelete}
      ) OR (
        toOutFlowLink."${from_field}" = OLD."${id_field}" AND
        toOutFlowItem."item_id" = toOutFlowLink."${id_field}" AND
        toOutFlowItem."path_item_id" = toOutFlowLink."${id_field}" AND
        toOutFlowItem."group_id" = ${groupDelete}
      )
    )
    LOOP
      IF (
        (
          SELECT COUNT(*) FROM "${mpTableName}" WHERE "item_id" = "path_item_id" AND "item_id" = OLD."${id_field}"
        ) = (
          SELECT COUNT(*) FROM "${mpTableName}" WHERE "item_id" = "path_item_id" AND "item_id" = toOutItems."item_id"
        )
      ) THEN

        SELECT inFromItems.* INTO inFromFlow
        FROM "${mpTableName}" as inFromItems
        WHERE
        "item_id" = toOutItems."path_item_id" AND
        "path_item_id" = toOutItems."path_item_id" AND
        "group_id" = ${groupDelete} LIMIT 1;

        UPDATE "${mpTableName}"
        SET
        "path_item_depth" = "path_item_depth" - (inFromFlow."path_item_depth"),
        "root_id" = toOutItems."path_item_id"
        WHERE
        "id" IN (
          SELECT toUpdate."id"
          FROM "${mpTableName}" as toOutDown, "${mpTableName}" as toUpdate
          WHERE
          toOutDown."path_item_id" = inFromFlow."path_item_id" AND
          toUpdate."position_id" = toOutDown."position_id"
        );

        DELETE FROM "${mpTableName}"
        WHERE
        "id" IN (
          SELECT toDelete."id"
          FROM "${mpTableName}" as toOutDown, "${mpTableName}" as toDelete
          WHERE
          toOutDown."path_item_id" = inFromFlow."path_item_id" AND
          toOutDown."group_id" = ${groupDelete} AND
          toDelete."position_id" = toOutDown."position_id" AND
          toDelete."path_item_depth" < 0 AND
          toDelete."group_id" = ${groupDelete}
        );
      ELSE
        DELETE FROM "${mpTableName}"
        WHERE
        "id" IN (
          SELECT toDelete."id"
          FROM
          "${mpTableName}" as toDelete,
          "${mpTableName}" as childs
          WHERE
          childs."group_id" = ${groupDelete} AND
          childs."path_item_id" = OLD."${id_field}" AND
          toDelete."position_id" = childs."position_id"
        );
      END IF;
    END LOOP;
  
    -- DN
    DELETE FROM "${mpTableName}"
    WHERE "item_id" = OLD."id";
  END;
  $trigger$ LANGUAGE plpgsql;
  CREATE OR REPLACE FUNCTION ${mpTableName}__delete_link__function()
  RETURNS TRIGGER AS $trigger$
  DECLARE
    ${iteratorDeleteDeclare}
  BEGIN
    ${iteratorDeleteBegin}
      PERFORM ${mpTableName}__delete_link__function_core(OLD${iteratorDeleteArgumentSend ? `,${iteratorDeleteArgumentSend}` : ''});
    ${iteratorDeleteEnd}

    RETURN OLD;
  END;
  $trigger$ LANGUAGE plpgsql;`,
  
  downTriggerDelete: () => sql`DROP TRIGGER IF EXISTS ${mpTableName}__delete_link__trigger ON "${graphTableName}";`,
  upTriggerDelete: () => sql`CREATE TRIGGER ${mpTableName}__delete_link__trigger AFTER DELETE ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName}__delete_link__function();`,

  downTriggerInsert: () => sql`DROP TRIGGER IF EXISTS ${mpTableName}__insert_link__trigger ON "${graphTableName}";`,
  upTriggerInsert: () => sql`CREATE TRIGGER ${mpTableName}__insert_link__trigger AFTER INSERT ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName}__insert_link__function();`,
});
