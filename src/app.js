var cheerio = require('cheerio')
var Koa = require('koa')
// var Router = require('koa-router')
var logger = require('koa-logger')
var bodyParser = require('koa-bodyparser')
var request = require('superagent')
var charset = require('superagent-charset')
// import Router from 'koa-router'

const app = new Koa()
// var router = new Router()

app.use(logger())
app.use(bodyParser())
charset(request)

app.use(async (ctx, next) => {
  const start = new Date()
  let ctxQuery = ctx.query
  let json = {}
  try {
    await request
      .post('http://www.chinapesticide.gov.cn/myquery/queryselect')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .charset()
      .send({
        pageNo: ctxQuery.pageNo || 1,
        pageSize: ctxQuery.pageSize || 20,
        djzh: ctxQuery.djzh || '',
        cjmc: ctxQuery.cjmc || '',
        sf: ctxQuery.sf || '',
        nylb: ctxQuery.nylb || '',
        zhl: ctxQuery.zhl || '',
        jx: ctxQuery.jx || '',
        zwmc: ctxQuery.zwmc || '',
        fzdx: ctxQuery.fzdx || '',
        syff: ctxQuery.syff || '',
        dx: ctxQuery.dx || '',
        yxcf: ctxQuery.yxcf || '',
        yxcf_en: ctxQuery.yxcf_en || '',
        yxcfhl: ctxQuery.yxcfhl || '',
        yxcf2: ctxQuery.yxcf2 || '',
        yxcf2_en: ctxQuery.yxcf2_en || '',
        yxcf2hl: ctxQuery.yxcf2hl || '',
        yxcf3: ctxQuery.yxcf3 || '',
        yxcf3_en: ctxQuery.yxcf3_en || '',
        yxcf3hl: ctxQuery.yxcf3hl || '',
        yxqs_start: ctxQuery.yxqs_start || '',
        yxqs_end: ctxQuery.yxqs_end || '',
        yxjz_start: ctxQuery.yxjz_start || '',
        yxjz_end: ctxQuery.yxjz_end || ''
      })
      .then(res => {
      // 获得农药等级列表
        let $ = cheerio.load(res.text.toString(), { decodeEntities: false })
        let table = $('.web_ser_body_right_main_search table').eq(3).find('tr')
        let list = []
        for (let i = 1; i < table.length; i++) {
          let node = $(table).eq(i)
          // 登记证号
          let djzhUrl = $(node).find('td').eq(0).find('span').find('a').attr('href').replace(')', '').replace('javascript:open(', '')
            .replace(/[']/g, '').split(',')
          let djzh = {
            name: $(node).find('td').eq(0).find('span').find('a').text(),
            url: `http://www.chinapesticide.gov.cn/myquery/querydetail?pdno=${djzhUrl[0]}&pdrgno=${djzhUrl[1]}`
          }
          // 登记名称
          let djmc = $(node).find('td').eq(1).find('span').text().replace(/[ \r\n\t]/g, '')
          // 农药类别
          let nylx = $(node).find('td').eq(2).find('span').text()
          // 剂型
          let jx = $(node).find('td').eq(3).find('span').text()
          // 总含量
          let zhl = $(node).find('td').eq(4).find('span').text()
          // 有效期至
          let yxq = $(node).find('td').eq(5).find('span').text()
          // 生产企业
          let scqyUrl = $(node).find('td').eq(6).find('span').find('a').attr('href')
            .replace('javascript:opencompany(', '').replace(')', '').replace(/[']/g, '').split(',')
          let scqy = {
            name: $(node).find('td').eq(6).find('span').text(),
            url: `http://www.chinapesticide.gov.cn/myquery/companydetail?cid=${scqyUrl[0]}&c_id=${scqyUrl[0]}`
          }
          let data = {
            djzh,
            djmc,
            nylx,
            jx,
            zhl,
            yxq,
            scqy
          }
          list.push(data)
        }
        // 总条数
        let count = ($('.pagination').find('li').last().text().split('，'))[1].replace(/[共.*条]/g, '').trim()
        json = {
          list,
          count: Number(count)
        }
      })
  } catch (error) {
    ctx.body = (JSON.stringify({
      code: '401',
      msg: '出错了'
    }))
  }
  const ms = new Date() - start
  ctx.body = (JSON.stringify({
    ...json,
    time: ms,
    ctxQuery
  }))
})

app.listen(3000)
