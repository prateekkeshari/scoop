import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')
  const size = parseInt(searchParams.get('size') || '300', 10)

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

    const filename = `QR_Code_${encodeURIComponent(data).replace(/%20/g, '_')}.png`

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Code for ${data}</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; flex-direction: column; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <h1>QR Code for ${data}</h1>
        <img src="${qrCodeDataURL}" alt="QR Code" />
        <p>Your download should start automatically. If it doesn't, <a href="${qrCodeDataURL}" download="${filename}">click here</a>.</p>
        <script>
          // Trigger download
          const link = document.createElement('a');
          link.href = '${qrCodeDataURL}';
          link.download = '${filename}';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        </script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
