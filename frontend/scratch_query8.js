const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-9000-btu-wifi-inclus-lampa-uv-msagau-09hrfn8-qrd1gw-mox133-09hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // Find h1
    const h1 = $('h1').first();
    const parentContainerId = h1.parent().attr('id');
    const parentContainerClass = h1.parent().attr('class');
    const grandParentId = h1.parent().parent().attr('id');
    const grandParentClass = h1.parent().parent().attr('class');
    
    console.log({ parentContainerId, parentContainerClass, grandParentId, grandParentClass });
})
.catch(console.error);
