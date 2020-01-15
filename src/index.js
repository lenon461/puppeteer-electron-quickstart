//#region Imports
// Library ----------------------------------------------------------------------------------
import { Logger } from './lib/logger';
import { FilePaths } from './lib/file-paths.js';
import { PuppeteerWrapper } from './lib/puppeteer-wrapper';
import { ftruncate } from 'fs';

const remote = require('electron').remote
const notifier = require('node-notifier')
const path = require('path')
//#endregion

//#region Setup - Dependency Injection-----------------------------------------------
const _logger = new Logger("production");
const _filePaths = new FilePaths(_logger, "puppeteer-electron-quickstart");
const _puppeteerWrapper = new PuppeteerWrapper(_logger, _filePaths,
    { headless: true, width: 1920, height: 1080 });

//#endregion

//#region Main ----------------------------------------------------------------------

let MessagePrevQueue = 0;

async function main(id, passwd) {
    try {
        const page = await _puppeteerWrapper.newPage();
        await Promise.all([
            page.goto('http://gw.korens.com/servlet/UAct?cmd=index'),
            page.waitForNavigation({ waitUntil: 'load', timeout: 10000 })
        ]);
        
        await page.type('body > form > table > tbody > tr > td > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > input', id);
        await page.type('body > form > table > tbody > tr > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > input', passwd);
        // click and wait for navigation
        await Promise.all([
            page.click('body > form > table > tbody > tr > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(3) > a'),
            page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }),
        ]);
        await Promise.all([
            page.click('body > table > tbody > tr > td > form > table:nth-child(3) > tbody > tr:nth-child(1) > td > table > tbody > tr > td > ul > li.approval_Tmenu > a'),
            page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }),
        ]);


        const children = (await page.$eval('#Form > table:nth-child(1) > tbody', e => e.children));
        const tablelist = Object.keys(children);
        if (MessagePrevQueue != tablelist.length) {
            _logger.clean();
            function notice(msg) {
                /** Show Form */
                const window = remote.getCurrentWindow()
                window.restore()
                window.show()
                /** https://github.com/mikaelbr/node-notifier */
                notifier.notify({
                    appID: 'korens-gw-alarm-app',
                    title: 'Alarm Clock',
                    message: msg,
                    icon: path.join(__dirname, 'clock.ico'),
                    sound: true,
                    wait: true,
                })
            }
            notice("새로운 결재가 도착하였습니다.")

            MessagePrevQueue = tablelist.length;

            for (let index = 3; index < tablelist.length; index += 2) {
                _logger.logAlways((await page.$eval(`#Form > table:nth-child(1) > tbody > tr:nth-child(${index})`, e => e.innerHTML)));

            }
        }
    } catch (error) {
        _logger.logAlways("Error가 발생하였습니다. 잠시만 기다려주세요")
        _logger.logAlways(error)
    }

}


setInterval(() => {

    (async () => {
        try {


            const id = document.getElementById("id").value;
            const passwd = document.getElementById("passwd").value;
            const status = document.getElementById("startbutton").value;
            if (status == 'stop') {

                const chromeSet = await _puppeteerWrapper.setup();
                if (!chromeSet) {
                    return;
                }


                const read = await _logger.readpasswd(_filePaths.passwdPath());

                if (read) {
                    const result = await (JSON.parse(String(read)))
                    document.getElementById("id").value = result.id
                    document.getElementById("passwd").value = result.passwd
                    if (status == 'stop') {
                        await main(id, passwd)
                        document.getElementById("explain").innerText = ''
                    }
                }
                else {
                    _logger.logAlways('저장된 아이디와 비밀번호가 없습니다.')
                }


            }
            else if (status == 'start') {

                const save = document.getElementById("save").value;
                if (save == 'save') {
                    _logger.logAlways('아이디와 비밀번호를 확인중입니다. 잠시만 기다려주세요')
                    const write = await _logger.writepasswd(_filePaths.passwdPath(), id, passwd);
                    _logger.logAlways('아이디와 비밀번호를 저장했습니다. Start버튼을 눌러주세요')
                    document.getElementById("save").value = "saved"

                } else if (save == 'saved') {

                } else {
                    _logger.logAlways('저장된 아이디와 비밀번호가 없습니다.')
                }
            }
        } catch (e) {
            _logger.logError('Thrown error:');
            _logger.logError(e);
        } finally {
            await _puppeteerWrapper.cleanup();
        }

        _logger.logInfo('Done. Close window to exit');

        await _logger.exportLogs(_filePaths.logsPath());
    })();

}, 3000 * 1 * 10);

//#endregion