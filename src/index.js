const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs-extra-promise')
const GoogleSpreadsheet = require('google-spreadsheet')

fs.ensureDirSync('logs')

const checkAndLog = async (profileId) => {
    const profile = await axios.get(`https://bitcointalk.org/index.php?action=profile;u=${profileId}`)

    const $ = cheerio.load(profile.data)

    const signature = $('.signature').html()

    const hasBlockFoodSignature = /blockfood\.io/.test(signature)

    await fs.writeJsonAsync(`logs/${profileId}_${Date.now()}_${hasBlockFoodSignature}.json`, hasBlockFoodSignature, 'utf-8')

    console.log(profileId, 'is', hasBlockFoodSignature)
}

const go = async () => {
    try {
        const doc = new GoogleSpreadsheet('1QGAbT925lrCuXukF4YguGbyO-F1Td7nIbPc5cPcHOvw')
        const sheet = await new Promise((resolve, reject) => {
            doc.getInfo((err, info) => err ? reject(err) : resolve(info.worksheets[0]))
        })

        const rows = await new Promise((resolve, reject) => {
            sheet.getRows(1, (err, data) => err ? reject(err) : resolve(data))
        })

        const profileIds = rows
            .map(row => row.bitcointalkprofileurl)
            .map(bttProfileUrl => /u=([0-9]+)/.exec(bttProfileUrl)[1])

        await Promise.all(profileIds.map(profileId => checkAndLog(profileId)))
    } catch(e) {
        console.log('Error', e)
    } finally {
        const nextCheck = Math.random()*1000000
        console.log('Next check will be in ', ~~(nextCheck/1000), 'seconds')
        setTimeout(go, nextCheck)
    }
}

go().catch(e => console.log(e))
