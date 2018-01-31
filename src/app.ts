import * as puppeteer from 'puppeteer';
import {readFileSync} from 'fs';
import * as cherio from 'cheerio';

console.log('Hi im puppeteer and im launching now Chrome (non headless)');
const baseUrl = 'https://strava.com/athletes/{:id}';
// Convert someting into a collection by notation e.g. newspapaer pages -> document.querySelectorAll('div.mv-thumb');
let profile = {
    name: '#athlete-view > div.spans6.athlete-profile > div.inset > div.centered > h1',

    location: '#athlete-view > div.spans6.athlete-profile > div.inset > div.centered > div',

    following: '#athlete-view > div.spans6.athlete-profile > div.inset > div.social.section > h2:nth-child(1) > span',
    followers: '#athlete-view > div.spans6.athlete-profile > div.inset > div.social.section > h2:nth-child(3) > span',

    unit: '#activity-totals > li:nth-child(1) > strong > abbr',

    stats: {
        /*trend: {
            january: '#interval-201701 > div > div',
            february: '#interval-201702 > div > div',
            march: '#interval-201703 > div > div',
            april: '#interval-201704 > div > div',
            may: '#interval-201705 > div > div',
            june: '#interval-201706 > div > div',
            july: '#interval-201707 > div > div',
            august: '#interval-201708 > div > div',
            september: '#interval-201709 > div > div',
            october: '#interval-201710 > div > div',
            november: '#interval-201711 > div > div',
            december: '#interval-201712 > div > div',
        },*/

        prs: [
            {
                discipline: '#overview > section.row.athlete-prs > ul > li:nth-child(1) > div > div',
                time: '#overview > section.row.athlete-prs > ul > li:nth-child(1) > div > strong'
            },
            {
                discipline: '#overview > section.row.athlete-prs > ul > li:nth-child(2) > div > div',
                time: '#overview > section.row.athlete-prs > ul > li:nth-child(2) > div > strong'
            },
            {
                discipline: '#overview > section.row.athlete-prs > ul > li:nth-child(3) > div > div',
                time: '#overview > section.row.athlete-prs > ul > li:nth-child(3) > div > strong'
            },
            {
                discipline: '#overview > section.row.athlete-prs > ul > li:nth-child(4) > div > div',
                time: '#overview > section.row.athlete-prs > ul > li:nth-child(4) > div > strong'
            }
        ],

        total: {
            distance: '#overview > section.row.athlete-records > div:nth-child(2) > table > tbody > tr:nth-child(1) > td',
            hours: '#overview > section.row.athlete-records > div:nth-child(2) > table > tbody > tr:nth-child(2) > td',
            elevation: '#overview > section.row.athlete-records > div:nth-child(2) > table > tbody > tr:nth-child(3) > td',
            tours: '#overview > section.row.athlete-records > div:nth-child(2) > table > tbody > tr:nth-child(4) > td'
        },

        currentYear: {
            distance: '#overview > section.row.athlete-records > div:nth-child(1) > table > tbody > tr:nth-child(1) > td',
            hours: '#overview > section.row.athlete-records > div:nth-child(1) > table > tbody > tr:nth-child(2) > td',
            elevation: '#overview > section.row.athlete-records > div:nth-child(1) > table > tbody > tr:nth-child(3) > td',
            tours: '#overview > section.row.athlete-records > div:nth-child(1) > table > tbody > tr:nth-child(4) > td'
        },

        currentMonth: {
            distance: '#activity-totals > li:nth-child(1) > strong',
            hours: '#activity-totals > li:nth-child(2) > strong',
            elevation: '#activity-totals > li:nth-child(3) > strong'
        }
    },

    network: {
        following: '#athlete-view > div.spans6.athlete-profile > div.inset > div.social.section > h2:nth-child(1) > span',
        followers: '#athlete-view > div.spans6.athlete-profile > div.inset > div.social.section > h2:nth-child(3) > span'
    }


    // make it recursice DONE
    // if not a string DONE
    // if Object check if props vals are string DONE


    // if Array iterate again and determine until prop val type equals string

    // apply cleaners (e.g. regexp)
    // specify data types
};

//let queue = Array.apply(null, {length: 3650287}).map(Number.call, Number);
//let startIndex = 3650287;
let startIndex = 3650287;
let items = 1;
let viaBrowser = true;

async function crawler(startIndex, items, viaBrwoser = false) {

    async function crawlViaBrowser(number, page) {

        let link = baseUrl.replace(/{:id}/, number.toString());
        let extractedData;

        console.log('Opening ' + link);

        try {
            await page.goto(link);
            await page.waitForSelector(profile.name, {timeout: 2000});

            extractedData = await page.evaluate((selectors) => {

                let extractor = (selectors, record = {}) => {
                    Object
                        .keys(selectors)
                        .forEach((property) => {

                            let domTarget = selectors[property];
                            let isString = typeof  domTarget === 'string';
                            let isArray = !!domTarget && !isString && domTarget instanceof Array;

                            if (!isString && !isArray) {
                                record[property] = extractor(domTarget);
                            } else if (!isString && isArray) {
                                record[property] = [];
                                domTarget.forEach((domTargetSubCollection, index) => {
                                    record[property][index] = extractor(domTargetSubCollection);
                                });
                            } else if (isString && domTarget.length > 0) {

                                let queriedElement = document.querySelector(domTarget);

                                if (!!queriedElement) {
                                    record[property] = queriedElement.innerText;
                                }
                            }
                        });

                    return record;
                };

                let data = extractor(selectors);

                return data;

            }, profile);

        } catch (e) {
            console.log(e);
        }


        console.log(JSON.stringify(extractedData, null, '\t'));

        startIndex++;

        // Here continoance is controlled
        if (startIndex < endIndex) {
            await crawlViaBrowser(startIndex);
        } else {
            await page.close();
        }
    }

    if (viaBrwoser) {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        page.setViewport({width: 1440, height: 900});

        await crawlViaBrowser(startIndex, page);

        await browser.close();
    } else {
        // Request -> cheerio -> extract  -> return
        let html = readFileSync('/Users/bernhard.behrendt/profile.html', 'UTF-8');
        let $ = cherio.load(html);
        console.log($('#overview > section.row.athlete-records > div:nth-child(2) > table > tbody > tr:nth-child(1) > td').text());
    }
}

process.nextTick(() => {
    crawler(startIndex, items, viaBrowser);
    startIndex += items;
});



