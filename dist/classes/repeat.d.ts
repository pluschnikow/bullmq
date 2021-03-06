import { JobsOptions, RepeatOptions } from '../interfaces';
import { Job, QueueBase } from './';
export declare class Repeat extends QueueBase {
    addNextRepeatableJob(name: string, data: any, opts: JobsOptions, skipCheckExists?: boolean): Promise<Job>;
    private createNextJob;
    removeRepeatable(name: string, repeat: RepeatOptions, jobId?: string): Promise<any>;
    removeRepeatableByKey(repeatJobKey: string): Promise<any>;
    _keyToData(key: string): {
        key: string;
        name: string;
        id: string;
        endDate: number;
        tz: string;
        cron: string;
    };
    getRepeatableJobs(start?: number, end?: number, asc?: boolean): Promise<{
        key: any;
        name: any;
        id: any;
        endDate: number;
        tz: any;
        cron: any;
        next: number;
    }[]>;
    getRepeatableCount(): Promise<number>;
}
