export const isPhone = (phone: string, area: 'zh' = 'zh'): boolean => {
    //可根据实际需要拓展
    const phoneRegex = {
        //中国大陆11位数字手机号规则
        zh: /^1[3-9]\d{9}$/
    }
    return phoneRegex[area].test(phone)
}