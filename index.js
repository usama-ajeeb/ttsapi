const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// const {dataExtractor} = require('../functions/utils/users')

// test
function extractItems() {
  // const extractedElements = document.querySelectorAll('.user-name');
  const extractedElements = document.querySelectorAll('.tiktok-yz6ijl-DivWrapper > a');
  // const extractedVideos = document.querySelectorAll('.tiktok-yz6ijl-DivWrapper > a')


  const items = [];
  for (let element of extractedElements) {
    items.push(element.getAttribute('href'));
  }
  return items;
}


async function scrapeItems(
    page,
    extractItems,
    itemCount,
    scrollDelay = 1500,
  ) {
    let items = [];
    try {
      let previousHeight;
      while (items.length < itemCount) {
        items = await page.evaluate(extractItems);
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
        await page.waitForTimeout(scrollDelay);
      }
    } catch(e) { }

    const uniqueProfiles = items.filter((c, index) => {
        return items.indexOf(c) === index
      })

      return uniqueProfiles
    // return items;
  }

// str.split('/').slice(3,4)

   async function dataExtractor(page) {
    const profiles = await scrapeItems(page, extractItems, 250);

    console.log(profiles.length);
    const tiktokData = []
    const totalData = []  
    for (const profile of profiles.slice(0, 50)) {
      await page.goto(`https://www.tiktok.com/${profile.split('/').slice(3,4)}`)
      await page.waitForTimeout(500)
      const profileLink = `https://www.tiktok.com/@${profile.split('/').slice(3,4)}`
      const VideoLink = profile
      const userName = `@${profile}`
      const followers = await page
        .$eval(
          '.tiktok-7k173h-H2CountInfos.e1457k4r0 > div:nth-child(2) > strong',
          (el) => el.textContent
        )
        .catch((err) => console.log(err))
      const Likes = await page
        .$eval(
          '.tiktok-7k173h-H2CountInfos.e1457k4r0 > div:nth-child(3) > strong',
          (el) => el.textContent
        )
        .catch((err) => console.log(err))

      const Bio = await page
        .$eval(
          '.tiktok-1g04lal-DivShareLayoutHeader-StyledDivShareLayoutHeaderV2.elmjn4l2 > h2.tiktok-b1wpe9-H2ShareDesc.e1457k4r3',
          (el) => el.textContent.trim()
        )
        .catch((err) => console.log(err))
      const Link = await page
        .$eval(
          '.tiktok-1g04lal-DivShareLayoutHeader-StyledDivShareLayoutHeaderV2.elmjn4l2 > div.tiktok-kk9x8q-DivShareLinks.eht0fek0 > a > span',
          (el) => el.textContent
        )
        .catch((err) => console.log(err))

      const totalVideosViewsTemp = await page.$$eval(
        '.video-count.tiktok-1p23b18-StrongVideoCount.e148ts222',
        (options) => options.map((option) => option.textContent)
      )
    
      const convertToNumber = (str) => {
        if (str.includes('M')) {
          return parseFloat(str.replace('M', '')) * 1000000
        }
        if (str.includes('K')) {
          return parseFloat(str.replace('K', '')) * 1000
        }
        return parseFloat(str)
      }
    
      const totalVideosViews = totalVideosViewsTemp
        .map((i) => convertToNumber(i))
        .reduce((a, b) => a + b, 0)

      const averageVideoPerView =
        totalVideosViews / totalVideosViewsTemp.length || 0
        console.log({followers, Bio, Likes, Link,averageVideoPerView });
      tiktokData.push({
        profileLink,
        VideoLink,
        userName,
        followers,
        Likes,
        Link,
        Bio,
        averageVideoPerView,
      })


      await page.waitForTimeout(500)
    }
    console.log(profiles);
    totalData.push(tiktokData, profiles.slice(50, profiles.length))
    return totalData
  }
// end test

puppeteer.use(StealthPlugin())

const app = express()

app.use(cors({ origin: true }))
app.use(express.json())

app.get('/', (req, res) => res.status(200).send('hello world'))

app.post('/tiktok-scraper', async (req, res) => {
  const keyword = req.body.keyword
  puppeteer.launch({ headless: true }).then(async (browser) => {

    const page = await browser.newPage(keyword)

    await page.goto(`https://www.tiktok.com/tag/${keyword}`);
    
      const tiktokData = await dataExtractor(page)
    // await browser.close()
    res.status(200).json(tiktokData)
  })
  //   res.json(tagsArray)
})

// NextHandler

app.post('/tiktok-scraper-next', async (req, res) => {
  const profiles = req.body.profiles
  puppeteer.launch({ headless: true }).then(async (browser) => {

    const page = await browser.newPage()

    const tiktokData = []
    for (const profile of profiles) {
      await page.goto(`https://www.tiktok.com/@${profile}`)
      await page.waitForTimeout(500)
      const profileLink = `https://www.tiktok.com/@${profile}`
      const userName = `@${profile}`
      const followers = await page
        .$eval(
          '.tiktok-7k173h-H2CountInfos.e1457k4r0 > div:nth-child(2) > strong',
          (el) => el.textContent
        )
        .catch((err) => console.log(err))
      const Likes = await page
        .$eval(
          '.tiktok-7k173h-H2CountInfos.e1457k4r0 > div:nth-child(3) > strong',
          (el) => el.textContent
        )
        .catch((err) => console.log(err))

      const Bio = await page
        .$eval(
          '.tiktok-1g04lal-DivShareLayoutHeader-StyledDivShareLayoutHeaderV2.elmjn4l2 > h2.tiktok-b1wpe9-H2ShareDesc.e1457k4r3',
          (el) => el.textContent.trim()
        )
        .catch((err) => console.log(err))
      const Link = await page
        .$eval(
          '.tiktok-1g04lal-DivShareLayoutHeader-StyledDivShareLayoutHeaderV2.elmjn4l2 > div.tiktok-kk9x8q-DivShareLinks.eht0fek0 > a > span',
          (el) => el.textContent
        )
        .catch((err) => console.log(err))

      const totalVideosViewsTemp = await page.$$eval(
        '.video-count.tiktok-1p23b18-StrongVideoCount.e148ts222',
        (options) => options.map((option) => option.textContent)
      )
    
      const convertToNumber = (str) => {
        if (str.includes('M')) {
          return parseFloat(str.replace('M', '')) * 1000000
        }
        if (str.includes('K')) {
          return parseFloat(str.replace('K', '')) * 1000
        }
        return parseFloat(str)
      }
    
      const totalVideosViews = totalVideosViewsTemp
        .map((i) => convertToNumber(i))
        .reduce((a, b) => a + b, 0)

      const averageVideoPerView =
        totalVideosViews / totalVideosViewsTemp.length || 0
      tiktokData.push({
        profileLink,
        userName,
        followers,
        Likes,
        Link,
        Bio,
        averageVideoPerView,
      })

    }


    await browser.close()
    
    res.status(200).json(tiktokData)
  })
})


app.listen('5001', ()=>{
  console.log('Server is listening');
})