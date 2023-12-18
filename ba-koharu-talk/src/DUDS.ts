import { Context } from "koishi";





const schale_db_url = 'https://schale.gg/data/'

export interface stu_data {
    Id: string,
    Id_db: number,
    FirstName_jp: string,
    FirstName_zh: string,
    Name_jp: string,
    Name_en: string,
    Name_zh_tw: string,
    Name_kr: string,
    Name_zh_cn: string,
    Name_zh_ft: string
}




export const duds =
    async function apply(ctx: Context) {
        let url = 'https://schale.gg/data/zh/students.min.json'
        const all_data = await ctx.http.get(url)

        // GPT4的对象键匹配函数
        function obj_key_match(obj, keyToFind, ids = []) {
            for (let key in obj) {
                if (key === keyToFind) {
                    // 找到 keyToFind，添加到数组中
                    ids.push(obj[key]);
                } else if (obj[key] && typeof obj[key] === 'object') {
                    // 如果是对象或数组，递归调用
                    obj_key_match(obj[key], keyToFind, ids); // 确保传递 ids 数组和 keyToFind
                }
            }
            return ids;
        }
        const all_id = obj_key_match(all_data, 'Id')
        const all_name = obj_key_match(all_data,'PersonalName')

    }