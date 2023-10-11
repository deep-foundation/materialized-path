export declare const insertNode: (type_id: number, dir: string, idType?: string) => Promise<any>;
export declare const insertNodes: (nodes: any) => Promise<any>;
export declare const insertLink: (fromId: number, toId: number, type_id: number, dir: string, idType?: string) => Promise<any>;
export declare const clear: (type_id: number, idType?: string) => Promise<void>;
export declare const deleteNode: (id: number, idType?: string) => Promise<any>;
export declare const findNoParent: (notId: number, type_id: number, idType?: string) => Promise<{
    nodes: any;
}>;
export declare const countMp: () => Promise<any>;
export declare let type_id: any;
export declare const beforeAllHandler: () => Promise<void>;
export declare const prepare: () => Promise<any>;
export declare const testPlus15: (needCheck?: boolean) => () => Promise<void>;
export declare const testMinus15: (needCheck?: boolean) => () => Promise<void>;
export declare const testRecursive: (needCheck?: boolean) => () => Promise<void>;
export declare const testRecursiveSameRoot: (needCheck?: boolean) => () => Promise<void>;
export declare const testSeparation1: (needCheck?: boolean) => () => Promise<void>;
export declare const testSeparation2: (needCheck?: boolean) => () => Promise<void>;
