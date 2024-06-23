import { NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { URL } from 'url'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid or missing URL' }, { status: 400 })
    }

    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PreviewBot/1.0; +http://example.com/bot)'
      }
    })

    const html = response.data
    const $ = cheerio.load(html)

    const preview = {
      title: getContent($, 'title') || getContent($, 'meta[property="og:title"]', 'content') || getContent($, 'meta[name="twitter:title"]', 'content') || '',
      description: getContent($, 'meta[name="description"]', 'content') || getContent($, 'meta[property="og:description"]', 'content') || getContent($, 'meta[name="twitter:description"]', 'content') || '',
      ogImage: getContent($, 'meta[property="og:image"]', 'content') || getContent($, 'meta[name="twitter:image"]', 'content') || '',
      favicon: getFavicon($, url),
      siteName: getContent($, 'meta[property="og:site_name"]', 'content') || '',
      url: url
    }

    return NextResponse.json(preview)
  } catch (error) {
    console.error('Error fetching preview:', error)
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ error: `Failed to fetch preview: ${error.response.status} ${error.response.statusText}` }, { status: error.response.status })
    }
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 })
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}


function getContent($: cheerio.CheerioAPI, selector: string, attr?: string): string {
  const element = $(selector).first()
  return attr ? element.attr(attr) || '' : element.text().trim()
}

function getFavicon($: cheerio.CheerioAPI, baseUrl: string): string {
  const favicon = $('link[rel="icon"]').attr('href') || 
                  $('link[rel="shortcut icon"]').attr('href') || 
                  '/favicon.ico'
  return new URL(favicon, baseUrl).toString()
}