# Remix of 骨安

骨安项目的流程梳理：

确认住院的患者需通过【骨安】小程序中的住院版模块扫码进入手术待入院状态，科室秘书身份的角色根据待入院患者清单挨个拨打电话沟通确认入院时间。护士会在患者入院前一天进行宣教由【骨安】小程序推送宣教内容，在入院办理完成入院办理手续后，由护士进行住院宣教（主要包括入院注意事项等宣教内容）。

在安排好的手术前一天患者的“术前检查结果量表”由小程序推送给值班医生，值班医生将汇总后的“术前检查结果量表”通过小程序OCR录入，将当天患者的检查量表数据推送至手术医疗团队成员并由手术医疗团队根据“术前检查结果量表”数据决定是否如期手术，其中异常数据需高亮展示，治疗师端同步展示，治疗师可将该患者退回至手术待排状态。

如正常手术则在手术当天给治疗患者的给医生团队推送“术中量表”填写一些患者手术中的具体情况信息（治疗组团队会根据实际的情况团队任一成员自由填写，只支持他们进行内容调整修改），治疗师根据医疗团队填写的“术中量表”的医生建议来制定患者的治疗方案。

接下来患者则进入术后观察阶段，治疗师及护士会分别定期去记录患者的术后详细的一些情况。达到康复目标则由治疗师进行康复出院确认，确认康复完成后则治疗师手术患者中则不再进行患者管理，由系统推送出院智能随访问卷，填写完成后根据问卷结论推送至不同角色，形成待办事项。如患者超时未填写则由人工电话干预随访结果。以上业务流程角色 主要 要分为：护士（科室秘书）、治疗师、手术医疗团队、值班医生。请依次帮我生成各角色对应的用户端，预览效果请在一个各角色聚合页面，我可自由查看不同的角色对应的用户端。用户端的生成核心逻辑就是以工作台然后就是一些患者管理之类的，主要还是这些角色当天需要做哪些事。目前这个流程主要针对的是住院的患者管理，还要有门诊的患者管理，请做一下区别

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ae60afa-ac90-443e-91ac-c953ca3daf61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
