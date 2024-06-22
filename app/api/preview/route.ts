import { NextResponse } from 'next/server'
import axios from 'axios'
import cheerio from 'cheerio'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await axios.get(url)
    const html = response.data
    const $ = cheerio.load(html)

    const preview = {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/favicon.ico',
    }

    return NextResponse.json(preview)
  } catch (error) {
    console.error('Error fetching preview:', error)
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 })
  }
}