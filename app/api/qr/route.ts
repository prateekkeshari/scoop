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

    const filename = `QR_Code_${encodeURIComponent(data).replace(/%20/g, '_')}.png`

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Code for ${data}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div class="min-h-screen flex flex-col items-center justify-center p-4">
          <div class="w-full max-w-md">
            <div class="bg-white dark:bg-black rounded-lg shadow-lg overflow-hidden">
              <div class="p-6">
                <h1 class="text-2xl font-bold mb-4 flex items-center">
                  <img src="https://scoop.prateekkeshari.com/icons/scoop.png" alt="Scoop Icon" class="h-6 w-6 mr-2">
                  <span>Scoop QR Code</span>
                </h1>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Scan this QR code to open the link</p>
                <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 flex justify-center">
                  <img src="${qrCodeDataURL}" alt="QR Code" class="max-w-full h-auto">
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p>This QR code leads to:</p>
                  <a href="${data}" class="text-blue-600 dark:text-blue-400 hover:underline break-all" target="_blank" rel="noopener noreferrer">${data}</a>
                </div>
                <div class="flex justify-between items-center">
                  <a href="${qrCodeDataURL}" download="${filename}" id="downloadLink" class="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors duration-200">Download QR Code</a>
                  <a href="https://scoop.prateekkeshari.com" class="text-sm text-gray-600 dark:text-gray-400 hover:underline">Create your own QR code</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <script>
          // Check if the user's preferred color scheme is dark
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
          
          // Trigger download automatically if 'download' parameter is true
          if (${download}) {
            window.onload = function() {
              document.getElementById('downloadLink').click();
            }
          }
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
