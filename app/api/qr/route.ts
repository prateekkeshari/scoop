import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createCanvas, loadImage } from 'canvas'

function getFaviconUrl(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
    const domain = url.hostname
    // Use Google's favicon service with larger size for better quality
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
  } catch (error) {
    // Fallback to GetYourGuide favicon if URL parsing fails
    return 'https://www.google.com/s2/favicons?sz=128&domain=getyourguide.com'
  }
}

async function createBrandedQRCode(data: string, options: {
  text?: string;
  frameColor?: string;
  gradientColor?: string;
  textColor?: string;
  showFrame?: boolean;
}): Promise<string> {
  const qrSize = 300 // Define outside try block for use in catch
  
  try {
    const { text, frameColor = '#00d4aa', gradientColor, textColor = '#ffffff', showFrame = false } = options
    
    // Calculate canvas size based on whether we need frame and text
    const frameThickness = showFrame ? 20 : 0
    const textHeight = text ? 60 : 0
    const canvasWidth = qrSize + (frameThickness * 2)
    const canvasHeight = qrSize + (frameThickness * 2) + textHeight
    
    // Generate QR code as buffer with high error correction for logo embedding
    const qrBuffer = await QRCode.toBuffer(data, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'H', // High error correction allows for logo embedding
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    // Create canvas and load QR code image
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')
    
    // Fill background color if frame is enabled
    if (showFrame) {
      // Create gradient or solid color fill
      if (gradientColor) {
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
        gradient.addColorStop(0, frameColor)
        gradient.addColorStop(1, gradientColor)
        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = frameColor
      }
      
      // Create rounded rectangle manually
      const radius = 20
      ctx.beginPath()
      ctx.moveTo(radius, 0)
      ctx.lineTo(canvasWidth - radius, 0)
      ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, radius)
      ctx.lineTo(canvasWidth, canvasHeight - radius)
      ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - radius, canvasHeight)
      ctx.lineTo(radius, canvasHeight)
      ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - radius)
      ctx.lineTo(0, radius)
      ctx.quadraticCurveTo(0, 0, radius, 0)
      ctx.closePath()
      ctx.fill()
    }
    
    // Add white background for QR code if frame is enabled
    if (showFrame) {
      ctx.fillStyle = '#ffffff'
      const qrBackgroundRadius = 10
      const qrBackgroundX = frameThickness - 5
      const qrBackgroundY = frameThickness - 5
      const qrBackgroundSize = qrSize + 10
      
      ctx.beginPath()
      ctx.moveTo(qrBackgroundX + qrBackgroundRadius, qrBackgroundY)
      ctx.lineTo(qrBackgroundX + qrBackgroundSize - qrBackgroundRadius, qrBackgroundY)
      ctx.quadraticCurveTo(qrBackgroundX + qrBackgroundSize, qrBackgroundY, qrBackgroundX + qrBackgroundSize, qrBackgroundY + qrBackgroundRadius)
      ctx.lineTo(qrBackgroundX + qrBackgroundSize, qrBackgroundY + qrBackgroundSize - qrBackgroundRadius)
      ctx.quadraticCurveTo(qrBackgroundX + qrBackgroundSize, qrBackgroundY + qrBackgroundSize, qrBackgroundX + qrBackgroundSize - qrBackgroundRadius, qrBackgroundY + qrBackgroundSize)
      ctx.lineTo(qrBackgroundX + qrBackgroundRadius, qrBackgroundY + qrBackgroundSize)
      ctx.quadraticCurveTo(qrBackgroundX, qrBackgroundY + qrBackgroundSize, qrBackgroundX, qrBackgroundY + qrBackgroundSize - qrBackgroundRadius)
      ctx.lineTo(qrBackgroundX, qrBackgroundY + qrBackgroundRadius)
      ctx.quadraticCurveTo(qrBackgroundX, qrBackgroundY, qrBackgroundX + qrBackgroundRadius, qrBackgroundY)
      ctx.closePath()
      ctx.fill()
    }

    // Load QR code image
    const qrImage = await loadImage(qrBuffer)
    const qrX = frameThickness
    const qrY = frameThickness
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

    // Calculate center area to excavate
    const centerX = qrX + (qrSize / 2)
    const centerY = qrY + (qrSize / 2)
    const excavationRadius = 35 // Size of the area to clear in the center

    // Excavate the center area (make it white/empty)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(centerX, centerY, excavationRadius, 0, 2 * Math.PI)
    ctx.fill()

    // Load and overlay brand logo (favicon from the website)
    try {
      const faviconUrl = getFaviconUrl(data)
      const brandLogo = await loadImage(faviconUrl)
      
              // Calculate logo size to fit nicely in the excavated area
        const logoSize = 50
        const logoX = centerX - (logoSize / 2)
        const logoY = centerY - (logoSize / 2)
        const backgroundRadius = logoSize / 2 + 6



      // Create circular clipping path for the logo
      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, logoSize / 2 - 2, 0, 2 * Math.PI)
      ctx.clip()

      // Draw the brand logo (clipped to circle)
      ctx.drawImage(brandLogo, logoX, logoY, logoSize, logoSize)
      
      // Restore context
      ctx.restore()
    } catch (logoError) {
      console.warn('Failed to load website favicon, using excavated QR code:', logoError)
      
      // Even without logo, keep the excavated center clean
      ctx.fillStyle = '#f8f8f8'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Add text at the bottom if provided
    if (text && showFrame) {
      ctx.fillStyle = textColor
      ctx.font = 'bold 24px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const textY = qrY + qrSize + (textHeight / 2)
      ctx.fillText(text, canvasWidth / 2, textY)
    }

    // Convert canvas to data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error creating branded QR code:', error)
    // Fallback to regular QR code if branding fails
    return await QRCode.toDataURL(data, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const fullPath = url.pathname + url.search
  const dataStartIndex = fullPath.indexOf('data=') + 5
  const data = fullPath.slice(dataStartIndex)

  if (!data) {
    return NextResponse.json({ error: 'Missing data parameter' }, { status: 400 })
  }

  try {
    const decodedData = decodeURIComponent(data)
    
    // Define color schemes
    const colorSchemes = [
      { name: 'Orange', color: '#ff5533', gradient: '#ff8f65', button: 'from-orange-500 to-red-500' },
      { name: 'Ocean', color: '#3b82f6', gradient: '#1d4ed8', button: 'from-blue-500 to-blue-700' },
      { name: 'Purple', color: '#8b5cf6', gradient: '#7c3aed', button: 'from-purple-500 to-purple-700' },
      { name: 'Emerald', color: '#10b981', gradient: '#059669', button: 'from-emerald-500 to-emerald-700' },
      { name: 'Rose', color: '#f43f5e', gradient: '#e11d48', button: 'from-rose-500 to-rose-700' },
      { name: 'Sunset', color: '#f97316', gradient: '#dc2626', button: 'from-orange-500 to-red-600' }
    ]

    // Generate basic version
    const basicQrCodeDataURL = await createBrandedQRCode(decodedData, {
      showFrame: false
    })
    
    // Generate all framed versions
    const framedVersions = await Promise.all(
      colorSchemes.map(async (scheme) => ({
        ...scheme,
        dataURL: await createBrandedQRCode(decodedData, {
          frameColor: scheme.color,
          gradientColor: scheme.gradient,
          textColor: '#ffffff',
          showFrame: true
        })
      }))
    )

        const domain = decodedData.split('?')[0].replace(/^https?:\/\//, '').replace(/^www\./, '')
    const basicFilename = `${domain}_Logo_QR.png`

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Logo QR Codes for ${decodedData.split('?')[0]}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div class="min-h-screen flex flex-col items-center justify-center p-4">
          <div class="w-full max-w-6xl">
            <div class="text-center mb-8">
              <div class="flex items-center justify-center gap-2 mb-2">
                <div class="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <h1 class="text-xl font-semibold">Your Logo QR Codes</h1>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p>This QR code leads to:</p>
                <a href="${decodedData}" class="text-blue-600 dark:text-blue-400 hover:underline break-all" target="_blank" rel="noopener noreferrer">${decodedData}</a>
              </div>
            </div>
            
            <!-- Basic QR Code -->
            <div class="mb-12">
              <h2 class="text-lg font-semibold mb-4 text-center">Basic Logo QR</h2>
              <div class="bg-white dark:bg-black rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 flex justify-center">
                  <img src="${basicQrCodeDataURL}" alt="Basic Logo QR Code" class="max-w-full h-auto rounded-lg" style="max-width: 200px;">
                </div>
                <div class="text-center">
                  <a href="${basicQrCodeDataURL}" download="${basicFilename}" class="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors duration-200 inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Logo QR
                  </a>
                </div>
              </div>
            </div>

            <!-- Framed QR Codes -->
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-6 text-center">Choose Your Frame Style</h2>
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${framedVersions.map(version => `
                  <div class="bg-white dark:bg-black rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <div class="p-4">
                      <h3 class="text-md font-medium mb-3 text-center">${version.name}</h3>
                      <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4 flex justify-center">
                        <img src="${version.dataURL}" alt="${version.name} QR Code" class="max-w-full h-auto rounded-lg" style="max-width: 180px;">
                      </div>
                      <div class="text-center">
                        <a href="${version.dataURL}" download="${domain}_${version.name}_QR.png" class="bg-gradient-to-r ${version.button} text-white px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-colors duration-200 inline-flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Download ${version.name}
                        </a>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="text-center mt-8">
              <a href="https://scoop.prateekkeshari.com" class="text-sm text-gray-600 dark:text-gray-400 hover:underline">Create a new one</a>
            </div>
          </div>
        </div>
        <script>
          // Check if the user's preferred color scheme is dark
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
          
          // No auto-download - let users choose their preferred style
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
    console.error('Error generating logo QR code:', error)
    return NextResponse.json({ error: 'Failed to generate logo QR code' }, { status: 500 })
  }
}
