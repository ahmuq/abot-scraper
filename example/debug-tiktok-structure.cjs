const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function debugTiktokHTML() {
  try {
    const url = 'https://vt.tiktok.com/ZSfYKCPAQ/';
    
    console.log('Fetching TikTok HTML...\n');
    
    const headers = {
      'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    const data = new URLSearchParams({
      id: url,
      locale: 'en',
      tt: 'WmNzZDk_',
    });

    const response = await axios.post('https://ssstik.io/abc?url=dl', data, { headers });
    
    // Save full HTML
    fs.writeFileSync('debug-html.html', response.data);
    console.log('✅ HTML saved to debug-html.html\n');
    
    const $ = cheerio.load(response.data);
    
    console.log('📊 Download Links Found:\n');
    
    console.log('1. a#hd_download:');
    const hdDownload = $('a#hd_download');
    console.log('   - attr(data-directurl):', hdDownload.attr('data-directurl'));
    console.log('   - attr(href):', hdDownload.attr('href'));
    console.log('   - all attrs:', hdDownload.attr());
    
    console.log('\n2. a.download_link.without_watermark_hd:');
    const wwHd = $('a.download_link.without_watermark_hd');
    console.log('   - count:', wwHd.length);
    console.log('   - attr(href):', wwHd.attr('href'));
    console.log('   - attr(data-directurl):', wwHd.attr('data-directurl'));
    
    console.log('\n3. a.download_link.without_watermark:');
    const ww = $('a.download_link.without_watermark');
    console.log('   - count:', ww.length);
    console.log('   - attr(href):', ww.attr('href'));
    console.log('   - attr(data-directurl):', ww.attr('data-directurl'));
    
    console.log('\n4. All a tags with download_link class:');
    $('a.download_link').each((i, elem) => {
      const classes = $(elem).attr('class');
      const href = $(elem).attr('href');
      const dataDirectUrl = $(elem).attr('data-directurl');
      console.log(`   [${i}] class="${classes}"`);
      console.log(`       href: ${href}`);
      console.log(`       data-directurl: ${dataDirectUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTiktokHTML();
