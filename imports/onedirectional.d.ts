export declare const insertNode: (type_id: number, idType?: string) => Promise<any>;
export declare const insertNodes: (nodes: any) => Promise<any>;
export declare const insertLink: (fromId: number, toId: number, type_id: number, idType?: string) => Promise<any>;
export declare const clear: (type_id: number, idType?: string) => Promise<void>;
export declare const deleteNode: (id: number, idType?: string) => Promise<any>;
export declare const generateTree: (initialId: any, count?: number) => {
    array: any[];
    paths: {
        [x: number]: any[];
    };
};
export declare const findNoParent: (notId: number, type_id: number, idType?: string) => Promise<{
    nodes: any;
}>;
export declare const countMp: () => Promise<any>;
export declare const generateMultiparentalTree: (array: any, nodesHash: any, count?: number) => Promise<void>;
export declare let type_id: any;
export declare const beforeAllHandler: () => Promise<any>;
export declare const prepare: () => Promise<any>;
export declare const testPlus1: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus1: (needCheck?: boolean) => () => Promise<void>;
export declare const testPlus2: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus2: (needCheck?: boolean) => () => Promise<void>;
export declare const testPlus3: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus3: (needCheck?: boolean) => () => Promise<void>;
export declare const testPlus4: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus4: (needCheck?: boolean) => () => Promise<void>;
export declare const testPlus5: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus5: (needCheck?: boolean) => () => Promise<void>;
export declare const testPlus7: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus7: (needCheck?: boolean) => () => Promise<void>;
export declare const testtree: (needCheck?: boolean) => () => Promise<void>;
export declare const testMultipleWays: (needCheck?: boolean) => () => Promise<void>;
export declare const testMultiparentalTree: (needCheck?: boolean) => () => Promise<void>;
export declare const test8: (needCheck?: boolean) => () => Promise<void>;
export declare const test9: (needCheck?: boolean) => () => Promise<void>;
export declare const test10: (needCheck?: boolean) => () => Promise<void>;
export declare const test11: (needCheck?: boolean) => () => Promise<void>;
export declare const test12: (needCheck?: boolean) => () => Promise<void>;
export declare const test13: (needCheck?: boolean) => () => Promise<void>;
export declare const test14: (needCheck?: boolean) => () => Promise<void>;
export declare const testDeeplinksDemoTree: (needCheck?: boolean) => () => Promise<void>;
export declare const testRecursive: (needCheck?: boolean) => () => Promise<void>;
export declare const testRecursiveSameRoot: (needCheck?: boolean) => () => Promise<void>;
export declare const testRecursiveLong: (needCheck?: boolean) => () => Promise<void>;