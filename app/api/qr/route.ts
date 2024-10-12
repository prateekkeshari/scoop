import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')
  const size = parseInt(searchParams.get('size') || '300', 10)
  const download = searchParams.get('download') === 'true'

  if (!data) {
    return NextResponse.json({ error: 'Missing data parameter' }, { status: 400 })
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64')

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
    }

    const filename = `QR_Code_${encodeURIComponent(data).replace(/%20/g, '_')}.png`

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`
    } else {
      headers['Content-Disposition'] = `inline; filename="${filename}"`
    }

    return new NextResponse(qrCodeBuffer, { headers })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
