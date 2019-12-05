export declare const errorObject: {
    [index: string]: any;
};
export declare function tryCatch(fn: (...args: any) => any, ctx: any, args: any[]): any;
export declare function isEmpty(obj: object): boolean;
export declare function array2obj(arr: string[]): {
    [index: string]: string;
};
export declare function delay(ms: number): Promise<void>;
