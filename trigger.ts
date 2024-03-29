import { sql } from '@deep-foundation/hasura/sql';

const call = (strOrFn: string | ((action: string) => string), action: string): string => {
  if (typeof(strOrFn) === 'function') return strOrFn(action);
  return strOrFn;
};

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
  additionalFields?: string | ((action: string) => string);
  additionalData?: string | ((action: string) => string);

  isAllowSpreadFromCurrent?: string;
  isAllowSpreadCurrentTo?: string;

  isAllowSpreadToCurrent?: string;
  isAllowSpreadCurrentFrom?: string;

  isAllowSpreadToInCurrent?: string;
  isAllowSpreadCurrentFromOut?: string;

  isAllowSpreadFromOutCurrent?: string;
  isAllowSpreadCurrentToIn?: string;

  postfix?: string;
}

const wrapAnd = (code) => code ? 'AND '+code : '';

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

  isAllowSpreadFromCurrent = '',
  isAllowSpreadCurrentTo = '',

  isAllowSpreadToCurrent = 'FALSE',
  isAllowSpreadCurrentFrom = 'FALSE',

  isAllowSpreadToInCurrent = '',
  isAllowSpreadCurrentFromOut = '',

  isAllowSpreadFromOutCurrent = 'FALSE',
  isAllowSpreadCurrentToIn = 'FALSE',

  postfix = '',
}: IOptions) => {
  const result = {
    downFunctionInsertNode: () => sql`
      DROP FUNCTION IF EXISTS ${mpTableName+postfix}__insert_link__function CASCADE;
      DROP FUNCTION IF EXISTS ${mpTableName+postfix}__insert_link__function_core CASCADE;
    `,
    upFunctionInsertNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName+postfix}__insert_link__function_core(NEW RECORD, groupid ${id_type} DEFAULT 0)
    RETURNS VOID AS $trigger$
    DECLARE
      insertCategory TEXT;
      incomingFlow RECORD;
      outcomingFlow RECORD;
      outcomingFlowDown RECORD;
      currentFlow RECORD;
      positionId TEXT;
      CURRENT RECORD;
      ${iteratorInsertDeclare}
    BEGIN
      ${result.upFunctionInsertNodeCore().toString()}
    END;
    $trigger$ LANGUAGE plpgsql;
    CREATE OR REPLACE FUNCTION ${mpTableName+postfix}__insert_link__function()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      PERFORM ${mpTableName+postfix}__insert_link__function_core(NEW);
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;`,
    upFunctionInsertNodeCore: () => sql`
      CURRENT:=NEW;
      SELECT gen_random_uuid() INTO insertCategory;
      ${iteratorInsertBegin}
        FOR incomingFlow
        IN (
          SELECT flowItem.*
          FROM "${graphTableName}" as flowLink, "${mpTableName}" as flowItem
          WHERE
          (
            -- select: FROM to CURRENT
            flowLink."${id_field}" = NEW."${from_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadFromCurrent)}
          ) OR (
            -- select: TO to CURRENT
            flowLink."${id_field}" = NEW."${to_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadToCurrent)}
          ) OR (
            -- select: IN to CURRENT
            flowLink."${to_field}" = NEW."${id_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadToInCurrent)}
          ) OR (
            -- select: OUT to CURRENT
            flowLink."${from_field}" = NEW."${id_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadFromOutCurrent)}
          )
        )
        LOOP
          -- CURRENT recursion UP?
          IF EXISTS (
            SELECT * FROM "${mpTableName}" AS spreadingFlows WHERE
            spreadingFlows."position_id" = incomingFlow."position_id" AND
            spreadingFlows."item_id" = incomingFlow."item_id" AND
            spreadingFlows."path_item_id" = NEW."${id_field}"
          ) THEN
            RAISE EXCEPTION 'recursion detected for link #% in incomingFlow mp #%', NEW."${id_field}", incomingFlow."id"; 
          END IF;

          SELECT gen_random_uuid() INTO positionId;

          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id","insert_category","group_id"${call(additionalFields, 'fromIn')})
          SELECT
          NEW."${id_field}",
          fromInItemPath."path_item_id",
          fromInItemPath."path_item_depth",
          fromInItemPath."root_id",
          positionId,
          insertCategory,
          ${groupInsert}
          ${call(additionalData, `(SELECT concat('fromIn ',NEW."${id_field}",' ', incomingFlow."id"))`)}
          FROM "${mpTableName}" AS fromInItemPath
          WHERE
          fromInItemPath."item_id" = incomingFlow."item_id" AND
          fromInItemPath."position_id" = incomingFlow."position_id";

          INSERT INTO "${mpTableName}"
          ("item_id","path_item_id","path_item_depth","root_id","position_id","insert_category","group_id"${call(additionalFields, 'current')})
          VALUES
          (NEW."${id_field}",NEW."${id_field}",incomingFlow."path_item_depth" + 1,incomingFlow."root_id",positionId,insertCategory,${groupInsert}${call(additionalData, `(SELECT concat('current ',NEW."${id_field}"))`)});
        END LOOP;

        -- CURRENT has ALL spreaded mp rows now

        -- IF NOT PARENT FLOWS - INSERT ITEM ROOT

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
          ("item_id","path_item_id","path_item_depth","root_id","position_id","insert_category","group_id"${call(additionalFields, 'root')})
          VALUES
          (NEW."${id_field}",NEW."${id_field}",0,NEW."${id_field}",gen_random_uuid(),insertCategory,${groupInsert}${call(additionalData, `(SELECT concat('root ',NEW."${id_field}"))`)});
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
          FOR outcomingFlow
          IN (
            SELECT
            DISTINCT ON (flowItem."item_id") "item_id",flowItem."path_item_id", flowItem."path_item_depth", flowItem."group_id", flowItem."position_id"
            FROM "${graphTableName}" as flowLink, "${mpTableName}" as flowItem
            WHERE
            (
              -- select: CURRENT to TO.
              flowLink."${id_field}" = NEW."${to_field}" AND
              flowItem."item_id" = flowLink."${id_field}" AND
              flowItem."path_item_id" = flowLink."${id_field}" AND
              flowItem."group_id" = ${groupInsert}
              ${wrapAnd(isAllowSpreadCurrentTo)}
            ) OR (
              -- select: CURRENT to FROM.
              flowLink."${id_field}" = NEW."${from_field}" AND
              flowItem."item_id" = flowLink."${id_field}" AND
              flowItem."path_item_id" = flowLink."${id_field}" AND
              flowItem."group_id" = ${groupInsert}
              ${wrapAnd(isAllowSpreadCurrentFrom)}
            ) OR (
              -- select: CURRENT to OUT
              flowLink."${from_field}" = NEW."${id_field}" AND
              flowItem."item_id" = flowLink."${id_field}" AND
              flowItem."path_item_id" = flowLink."${id_field}" AND
              flowItem."group_id" = ${groupInsert}
              ${wrapAnd(isAllowSpreadCurrentFromOut)}
            ) OR (
              -- select: CURRENT to IN
              flowLink."${to_field}" = NEW."${id_field}" AND
              flowItem."item_id" = flowLink."${id_field}" AND
              flowItem."path_item_id" = flowLink."${id_field}" AND
              flowItem."group_id" = ${groupInsert}
              ${wrapAnd(isAllowSpreadCurrentToIn)}
            ) AND
            flowItem."insert_category" != insertCategory
          )
          LOOP
            FOR outcomingFlowDown
            IN (
              SELECT
              DISTINCT ON (toOutFlowDownItems."item_id") "item_id",toOutFlowDownItems."path_item_id", toOutFlowDownItems."path_item_depth", toOutFlowDownItems."group_id", toOutFlowDownItems."position_id", toOutFlowDownItems."id"
              FROM "${mpTableName}" AS toOutFlowDownItems
              WHERE
              toOutFlowDownItems."group_id" = outcomingFlow."group_id" AND
              toOutFlowDownItems."path_item_id" = outcomingFlow."path_item_id" AND
              toOutFlowDownItems."insert_category" != insertCategory AND
              toOutFlowDownItems."id" IN (
                SELECT toOutFlowDownPath."id"
                FROM
                "${mpTableName}" AS toOutFlowDownPath,
                "${mpTableName}" AS toOutFlowPath
                WHERE
                toOutFlowPath."position_id" = outcomingFlow."position_id" AND
                toOutFlowPath."item_id" = outcomingFlow."item_id" AND
                toOutFlowPath."path_item_depth" <= outcomingFlow."path_item_depth" AND
                toOutFlowDownPath."position_id" = toOutFlowDownItems."position_id" AND
                toOutFlowDownPath."item_id" = toOutFlowDownItems."item_id" AND
                toOutFlowDownPath."path_item_depth" <= outcomingFlow."path_item_depth" AND
                toOutFlowPath."path_item_id" = toOutFlowDownPath."path_item_id" AND
                toOutFlowPath."path_item_depth" = toOutFlowDownPath."path_item_depth"
              )
            )
            LOOP
              -- UP recursion DOWN?

              IF EXISTS (
                SELECT * FROM "${mpTableName}" AS spreadingFlows WHERE
                spreadingFlows."position_id" = currentFlow."position_id" AND
                spreadingFlows."item_id" = currentFlow."item_id" AND
                spreadingFlows."group_id" = currentFlow."group_id" AND
                spreadingFlows."path_item_id" = outcomingFlowDown."item_id"
              ) THEN
                RAISE EXCEPTION 'recursion detected for link #% in spreadingFlow mp #% outcomingFlowDown mp #%', NEW."${id_field}", currentFlow."id", outcomingFlowDown."id"; 
              END IF;

              SELECT gen_random_uuid() INTO positionId;

              -- add prev flows current to to/out flow
              INSERT INTO "${mpTableName}"
              ("item_id","path_item_id","path_item_depth","root_id","position_id","insert_category","group_id"${call(additionalFields, 'currentFlow')})
              SELECT
              outcomingFlowDown."item_id",
              spreadingFlows."path_item_id",
              spreadingFlows."path_item_depth",
              spreadingFlows."root_id",
              positionId,
              insertCategory,
              ${groupInsert}
              ${call(additionalData, `(SELECT concat('currentFlow ',NEW."${id_field}"))`)}
              FROM "${mpTableName}" AS spreadingFlows
              WHERE
              spreadingFlows."position_id" = currentFlow."position_id" AND
              spreadingFlows."item_id" = currentFlow."item_id" AND
              spreadingFlows."group_id" = currentFlow."group_id";

              -- clone exists flows of to/out
              INSERT INTO "${mpTableName}"
              ("item_id","path_item_id","path_item_depth","root_id","position_id","insert_category","group_id"${call(additionalFields, 'toOut')})
              SELECT
              toOutItemsI."item_id",
              toOutItemsI."path_item_id",
              toOutItemsI."path_item_depth" + currentFlow."path_item_depth" + 1 - outcomingFlow."path_item_depth",
              currentFlow."root_id",
              positionId,
              insertCategory,
              ${groupInsert}
              ${call(additionalData, `(SELECT concat('toOut ',NEW."${id_field}"))`)}
              FROM "${mpTableName}" AS toOutItemsI
              WHERE
              toOutItemsI."item_id" = outcomingFlowDown."item_id" AND
              toOutItemsI."position_id" = outcomingFlowDown."position_id" AND
              toOutItemsI."path_item_depth" >= outcomingFlow."path_item_depth" AND
              toOutItemsI."group_id" = outcomingFlowDown."group_id";
            END LOOP;
          END LOOP;
        END LOOP;

        -- delete trash roots
        DELETE FROM "${mpTableName}"
        WHERE
        "group_id" = ${groupInsert} AND
        "root_id" IN (
          SELECT flowItem."item_id"
          FROM "${graphTableName}" as flowLink, "${mpTableName}" as flowItem
          WHERE
          (
            -- select: CURRENT to TO.
            flowLink."${id_field}" = NEW."${to_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadCurrentTo)}
          ) OR (
            -- select: CURRENT to FROM.
            flowLink."${id_field}" = NEW."${from_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadCurrentFrom)}
          ) OR (
            -- select: CURRENT to OUT
            flowLink."${from_field}" = NEW."${id_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadCurrentFromOut)}
          ) OR (
            -- select: CURRENT to IN
            flowLink."${to_field}" = NEW."${id_field}" AND
            flowItem."item_id" = flowLink."${id_field}" AND
            flowItem."path_item_id" = flowLink."${id_field}" AND
            flowItem."group_id" = ${groupInsert}
            ${wrapAnd(isAllowSpreadCurrentToIn)}
          )
        );
      ${iteratorInsertEnd}`,
    
    downFunctionDeleteNode: () => sql`
      DROP FUNCTION IF EXISTS ${mpTableName+postfix}__delete_link__function CASCADE;
      DROP FUNCTION IF EXISTS ${mpTableName+postfix}__delete_link__function_core CASCADE;
    `,
    upFunctionDeleteNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName+postfix}__delete_link__function_core(OLD RECORD${iteratorDeleteArgumentGet ? `,${iteratorDeleteArgumentGet}` : ''})
    RETURNS VOID AS $trigger$
    DECLARE
      linkFlow RECORD;
      toOutItems RECORD;
      inFromFlow RECORD;
      CURRENT RECORD;
    BEGIN
      ${result.upFunctionDeleteNodeCore().toString()}
    END;
    $trigger$ LANGUAGE plpgsql;
    CREATE OR REPLACE FUNCTION ${mpTableName+postfix}__delete_link__function()
    RETURNS TRIGGER AS $trigger$
    DECLARE
      ${iteratorDeleteDeclare}
    BEGIN
      ${iteratorDeleteBegin}
        PERFORM ${mpTableName+postfix}__delete_link__function_core(OLD${iteratorDeleteArgumentSend ? `,${iteratorDeleteArgumentSend}` : ''});
      ${iteratorDeleteEnd}

      RETURN OLD;
    END;
    $trigger$ LANGUAGE plpgsql;`,
    upFunctionDeleteNodeCore: () => sql`
      CURRENT:=OLD;
      FOR toOutItems
      IN (
        SELECT flowItem.*
        FROM "${graphTableName}" as flowLink, "${mpTableName}" as flowItem
        WHERE
        (
          -- select: CURRENT to TO.
          flowLink."${id_field}" = OLD."${to_field}" AND
          flowItem."item_id" = flowLink."${id_field}" AND
          flowItem."path_item_id" = flowLink."${id_field}" AND
          flowItem."group_id" = ${groupDelete}
          ${wrapAnd(isAllowSpreadCurrentTo)}
        ) OR (
          -- select: CURRENT to FROM.
          flowLink."${id_field}" = OLD."${from_field}" AND
          flowItem."item_id" = flowLink."${id_field}" AND
          flowItem."path_item_id" = flowLink."${id_field}" AND
          flowItem."group_id" = ${groupDelete}
          ${wrapAnd(isAllowSpreadCurrentFrom)}
        ) OR (
          -- select: CURRENT to OUT
          flowLink."${from_field}" = OLD."${id_field}" AND
          flowItem."item_id" = flowLink."${id_field}" AND
          flowItem."path_item_id" = flowLink."${id_field}" AND
          flowItem."group_id" = ${groupDelete}
          ${wrapAnd(isAllowSpreadCurrentFromOut)}
        ) OR (
          -- select: CURRENT to IN
          flowLink."${to_field}" = OLD."${id_field}" AND
          flowItem."item_id" = flowLink."${id_field}" AND
          flowItem."path_item_id" = flowLink."${id_field}" AND
          flowItem."group_id" = ${groupDelete}
          ${wrapAnd(isAllowSpreadCurrentToIn)}
        )
      )
      LOOP
        IF (
          (
            SELECT COUNT(*) FROM "${mpTableName}" WHERE
            "item_id" = "path_item_id" AND "item_id" = OLD."${id_field}" AND
            "group_id" = ${groupDelete}
          ) = (
            SELECT COUNT(*) FROM "${mpTableName}" WHERE
            "item_id" = "path_item_id" AND "item_id" = toOutItems."item_id" AND
            "group_id" = ${groupDelete}
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
      WHERE "item_id" = OLD."${id_field}" AND "group_id" = ${groupDelete};`,
    
    downTriggerDelete: () => sql`DROP TRIGGER IF EXISTS ${mpTableName+postfix}__delete_link__trigger ON "${graphTableName}" CASCADE;`,
    upTriggerDelete: () => sql`CREATE TRIGGER ${mpTableName+postfix}__delete_link__trigger AFTER DELETE ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName+postfix}__delete_link__function();`,

    downTriggerInsert: () => sql`DROP TRIGGER IF EXISTS ${mpTableName+postfix}__insert_link__trigger ON "${graphTableName}" CASCADE;`,
    upTriggerInsert: () => sql`CREATE TRIGGER ${mpTableName+postfix}__insert_link__trigger AFTER INSERT ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName+postfix}__insert_link__function();`,

    downTriggerUpdate: () => sql`DROP TRIGGER IF EXISTS ${mpTableName+postfix}__update_link__trigger ON "${graphTableName}" CASCADE;`,

    upTriggerUpdate: () => sql`CREATE TRIGGER ${mpTableName+postfix}__update_link__trigger AFTER UPDATE ON "${graphTableName}" FOR EACH ROW EXECUTE PROCEDURE ${mpTableName+postfix}__update_link__function();`,

    downFunctionUpdateNode: () => sql`
      DROP FUNCTION IF EXISTS ${mpTableName+postfix}__update_link__function CASCADE;
      DROP FUNCTION IF EXISTS ${mpTableName+postfix}__update_link__function_core CASCADE;
    `,
    upFunctionUpdateNode: () => sql`CREATE OR REPLACE FUNCTION ${mpTableName+postfix}__update_link__function_core(OLD RECORD, NEW RECORD, groupid ${id_type} DEFAULT 0)
    RETURNS VOID AS $trigger$
    DECLARE
      insertCategory TEXT;
      incomingFlow RECORD;
      outcomingFlow RECORD;
      outcomingFlowDown RECORD;
      currentFlow RECORD;
      positionId TEXT;
      CURRENT RECORD;
      linkFlow RECORD;
      toOutItems RECORD;
      inFromFlow RECORD;
      ${iteratorInsertDeclare}
    BEGIN
      ${iteratorDeleteBegin}
        ${result.upFunctionDeleteNodeCore().toString()}
      ${iteratorDeleteEnd}
      ${result.upFunctionInsertNodeCore().toString()}
    END;
    $trigger$ LANGUAGE plpgsql;
    CREATE OR REPLACE FUNCTION ${mpTableName+postfix}__update_link__function()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      PERFORM ${mpTableName+postfix}__update_link__function_core(OLD, NEW);
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;`,
  };
  return result;
};
