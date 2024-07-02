import { Context, Schema } from 'koishi';
export declare const inject: {
    required: string[];
};
export declare const name = "ba-koharu-talk";
export declare const usage = "\n<div style=\"font-size:30px; font-weight:bold;\">\n<span style=\"color: #FFD2ED;\">koharu</span>-talk\n<div style=\"border:1px solid #CCC\"></div> \n\n<h6>0.3.0-rc</h6>\n<h6>\u65E5\u5FD7\u51FA\u73B0\u62A5\u9519\u53EF\u5C1D\u8BD5\u91CD\u542F\u63D2\u4EF6</h6>\n<h6>\u6307\u4EE4\u6CA1\u52A0\u8F7D\u51FA\u6765\u53EF\u5C1D\u8BD5\u91CD\u542Fcommands\u63D2\u4EF6</h6>\n\n<div style=\"border:1px solid #CCC\"></div> \n";
export interface Config {
    font: string;
    resolution: 0.25 | 0.5 | 1;
    draw_modle: "canvas" | "puppeteer";
    auto_update: boolean;
    help_model: boolean;
    save_img: boolean;
    input_time: number;
    inte: {
        returns: string;
        type: '百度审核' | '自定义审核';
        id?: string;
        APIKey?: string;
        SKey?: string;
        urls?: string;
    };
}
export declare const Config: Schema<Config>;
export declare const json_file_name = "sms_studata_main_talk.json";
export declare function apply(ctx: Context, config: Config): Promise<void>;
