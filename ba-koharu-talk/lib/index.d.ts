import { Context, Schema } from 'koishi';
export declare const name = "ba-koharu-talk";
export declare const usage: string;
export interface Config {
    reminders: number;
    font: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
