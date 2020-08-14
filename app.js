const puppeteer = require('puppeteer');
const sql = require('mssql');

var config = {
    user: 'sa',
    password: 'viet1997',
    server: 'ADMIN\\SQLEXPRESS',
    database: 'APIVNEXPRESS',
    options: {
        encrypt: false,
        enableArithAbort: true
    }
};


(async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://vnexpress.net/');
    const postLinks = await page.evaluate(() => {// get link and title from home page
            let postElement = document.querySelectorAll(".description > a");
            postElement = [...postElement];
            let postLinks = postElement.map( function (i) {
                let link = i.getAttribute('href');
                let title = i.getAttribute('title');
                return {
                    url: link,
                    title: title,
                    content: ""
                };
            }
        );
        return postLinks ;
    });
    for(let link of postLinks) {// access link get content
        await page.goto(link.url);
        let content = await page.evaluate(() => {
            let paragraphAll = document.querySelectorAll('p.Normal');
            paragraphAll = [...paragraphAll];// create array contain paragraph get from querySelector
            let paragraphArr = paragraphAll.map(function (paragraph) {// get element of array to get content in element(element is object)
                let textContent = paragraph.textContent;
                return textContent;
            });
            return paragraphArr;
        });
        link.content = content.toString();
    }
    for (let link of postLinks){
        sql.connect(config, function (err) {
            if (err) console.log(err) ;
            var request = new sql.Request();
            let sqlREq = "EXEC save_data @url = "+"\"" + link.url +"\"" +",@title = N"+"\'" + link.title+ "\'" + ",@content= N" +"\'"+link.content +"\'"+" ,@api = N"+"\'"+ JSON.stringify(link)+"\'" ;
            request.query(sqlREq, function (err,result) {
                if (err) console.log(err);
                // send records as a response
                console.log(result);
            });
        });
    }
    await browser.close();
})();
