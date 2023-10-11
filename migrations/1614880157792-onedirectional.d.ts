export declare const up: ({ SCHEMA, MP_TABLE, GRAPH_TABLE, ID_TYPE, trigger, }?: {
    SCHEMA?: string;
    MP_TABLE?: string;
    GRAPH_TABLE?: string;
    ID_TYPE?: string;
    trigger?: any;
}) => Promise<void>;
export declare const down: ({ SCHEMA, MP_TABLE, GRAPH_TABLE, trigger, }?: {
    SCHEMA?: string;
    MP_TABLE?: string;
    GRAPH_TABLE?: string;
    trigger?: any;
}) => Promise<void>;
