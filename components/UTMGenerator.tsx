"use client";
import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "next-themes"
import dynamic from 'next/dynamic'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, XCircle } from "lucide-react"

// Dynamically import icon components
const Copy = dynamic(() => import('lucide-react').then(mod => mod.Copy), { ssr: false })
const CheckCircle = dynamic(() => import('lucide-react').then(mod => mod.CheckCircle), { ssr: false })
const Download = dynamic(() => import('lucide-react').then(mod => mod.Download), { ssr: false })
const Sun = dynamic(() => import('lucide-react').then(mod => mod.Sun), { ssr: false })
const Moon = dynamic(() => import('lucide-react').then(mod => mod.Moon), { ssr: false })

// Dynamically import QRCode with ssr option set to false
const QRCode = dynamic(() => import('qrcode.react'), { ssr: false })

const UTMLinkForge = () => {
  const [url, setUrl] = useState('')
  const [utmValues, setUtmValues] = useState({
    source: '', medium: '', campaign: '', term: '', content: ''
  })
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [logo, setLogo] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    generateUTMUrl()
  }, [url, utmValues])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown as any)

    return () => {
      document.removeEventListener('keydown', handleKeyDown as any)
    }
  }, [isDrawerOpen])

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch (e) {
      return false
    }
  }

  const generateUTMUrl = () => {
    if (url && !isValidUrl(url)) {
      setErrorMessage('Invalid URL. Please enter a valid URL.')
      return
    }
    setErrorMessage('')
    const params = new URLSearchParams()
    Object.entries(utmValues).forEach(([key, value]) => {
      if (value) params.append(`utm_${key}`, value)
    })
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    const utmUrl = `${urlWithProtocol}${params.toString() ? '?' + params.toString() : ''}`
    setGeneratedUrl(utmUrl)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchPreview = async () => {
    if (!generatedUrl) {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return
    }
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/preview?url=${encodeURIComponent(generatedUrl)}`)
      setPreview(response.data)
    } catch (error) {
      console.error('Error fetching preview:', error)
      setPreview(null)
      setErrorMessage(
        'Unable to fetch preview. Please check the URL and try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUtmValueChange = (key: keyof typeof utmValues, value: string) => {
    setUtmValues(prev => ({ ...prev, [key]: value }))
  }

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qr-code.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!url) {
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 3000)
        return
      }
      fetchPreview();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (!url) {
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 3000)
        return
      }
      setIsDrawerOpen(true);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string;
        try {
          const grayscaleImage = await applyGrayscale(imageDataUrl);
          setLogo(grayscaleImage);
        } catch (error) {
          console.error('Error applying grayscale:', error);
          setLogo(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyGrayscale = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL());
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-8 font-inter text-gray-900 dark:text-gray-100">
      {showAlert && (
        <Alert variant="destructive" className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-md">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <AlertTitle className="text-lg font-semibold text-red-700">Oops.</AlertTitle>
              <AlertDescription className="text-red-600 mt-1">
                Please enter a valid URL before generating QR or preview.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold mb-2 flex items-center"
          >
            <img src="icons/scoop.png" alt="Icon" className="h-6 w-6 mr-2" />
            <span className="drop-shadow-[0_1px_12px_rgba(255,255,255,0.7)]">Scoop</span>
          </motion.h1>
          <p className="text-md text-gray-400 dark:text-gray-500">
            Generate UTM links, QR, and meta preview.
          </p>
        </div>
        <Button onClick={toggleTheme} variant="outline" size="icon" className="mt-4 sm:mt-0">
          {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </div>
  
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
        <Card className="shadow-sm bg-white dark:bg-black rounded-lg overflow-hidden mb-4 sm:mb-8 flex-1 w-full">
          <CardContent className="p-4 sm:p-6 flex flex-col h-full">
            <div className="space-y-4 sm:space-y-6 flex-grow">
              <div>
                <Label htmlFor="url" className="text-sm font-medium mb-1 block pb-2">Enter URL *</Label>
                <Input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full transition-all duration-200 ${url && isValidUrl(url) ? 'border-green-500' : 'border-gray-300 dark:border-gray-700'}`}
                  placeholder="https://prateekkeshari.com"
                  required
                />
                {errorMessage && url && (
                  <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(utmValues).map((key) => (
                  <div key={key}>
                    <Label htmlFor={`utm_${key}`} className="text-sm font-medium mb-1 capitalize flex items-center pb-2">
                      {key}
                    </Label>
                    <Input
                      id={`utm_${key}`}
                      placeholder={`e.g., ${key === 'source' ? 'google' : key === 'medium' ? 'cpc' : key === 'campaign' ? 'summer_sale' : key === 'term' ? 'running+shoes' : 'blue_banner'}`}
                      value={utmValues[key as keyof typeof utmValues]}
                      onChange={(e) => handleUtmValueChange(key as keyof typeof utmValues, e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
  
              <div className="space-y-2">
                <Label className="text-sm font-medium">UTM Link</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-grow bg-gray-50 dark:bg-black"
                    placeholder="https://prateekkeshari.com?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className={`transition-all duration-200 ${copied ? 'bg-green-100 dark:bg-green-900' : ''}`}
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col sm:flex-row justify-between mt-auto pt-4 sm:pt-6 gap-4">
              <Button variant="default" className="group relative w-full sm:w-auto" onClick={() => {
                if (!url) {
                  setShowAlert(true)
                  setTimeout(() => setShowAlert(false), 3000)
                  return
                }
                setIsDrawerOpen(true)
              }}>
                Generate QR <span className="text-gray-400 ml-2 hidden sm:inline">⌘ + ↵</span>
              </Button>
              <Button onClick={fetchPreview} variant="outline" className="group relative w-full sm:w-auto">
               See Preview <span className="text-gray-400 ml-2 hidden sm:inline">↵</span>
              </Button>
            </div>
          </CardContent>
        </Card>
  
        <Card 
          className="shadow-sm bg-white dark:bg-black rounded-lg overflow-hidden mb-4 sm:mb-8 flex-1 cursor-pointer w-full" 
          onClick={() => window.open(generatedUrl || url || 'https://prateekkeshari.com', '_blank')}
        >
          <CardContent className="p-4 sm:p-6 flex flex-col h-full">
            {isLoading ? (
              <div className="space-y-2 flex-grow flex flex-col justify-center">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : preview ? (
              <div className="space-y-4 flex flex-col h-full">
                <img src={preview.ogImage} alt="OG Image" className="w-full h-48 object-cover rounded-lg" />
                <div className="flex items-center space-x-2">
                  <img src={preview.favicon} alt="Favicon" className="w-4 h-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'prateekkeshari.com'}
                  </p>
                </div>
                <h3 className="text-lg font-semibold">{preview.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow">{preview.description}</p>
                <Button variant="outline" className="mt-auto w-full">
                  Visit {url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'prateekkeshari.com'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col h-full">
                <img src="https://framerusercontent.com/assets/DaNDLs98SHLZEDquWqOFa2Fvsc.png" alt="OG Image" className="w-full h-48 object-cover rounded-lg" />
                <div className="flex items-center space-x-2">
                  <img src="https://framerusercontent.com/images/41z34GiRLR8yFGBI0derDTlNWA.png" alt="Favicon" className="w-4 h-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">prateekkeshari.com</p>
                </div>
                <h3 className="text-lg font-semibold">Prateek Keshari | Marketer and Creative | Berlin</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow">Prateek Keshari is a product marketer, AI enthusiast, and creative based in Berlin. He currently works for GetYourGuide. Previously, he led Employer Brand at Agoda.</p>
                <Button variant="outline" className="mt-auto w-full">
                  Visit prateekkeshari.com
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
            onClick={() => setIsDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-[#0A0A0B] p-6 rounded-t-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex flex-col items-center mb-4">
                  <div className="text-center">
                    <h2 className="text-md font-semibold pb-1">QR opens {url?.replace(/^(https?:\/\/)?(www\.)?/, '') || 'prateekkeshari.com'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add logo to customize</p>
                  </div>
                </div>
                <div className="mt-4 mb-4 w-1/2 mx-auto flex justify-center">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const imageDataUrl = reader.result as string;
                          try {
                            const grayscaleImage = await applyGrayscale(imageDataUrl);
                            setLogo(grayscaleImage);
                          } catch (error) {
                            console.error('Error applying grayscale:', error);
                            setLogo(null);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-center"
                  />
                </div>
                <Card className="p-4 rounded-lg shadow-sm flex flex-col items-center">
                  {typeof window !== 'undefined' && (
                    <QRCode
                      id="qr-code"
                      value={generatedUrl || 'https://prateekkeshari.com'}
                      size={200}
                      level="H"
                      imageSettings={logo ? {
                        src: logo,
                        excavate: true,
                        width: 40,
                        height: 40,
                        x: undefined,
                        y: undefined,
                      } : undefined}
                    />
                  )}
                </Card>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Button 
                    onClick={downloadQR} 
                    className="w-full mt-4 text-white bg-black dark:bg-white dark:text-black flex items-center justify-center"
                  >
                    <Download className="mr-2" size={18} />
                    Download QR
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        Made by <a href="https://prateekkeshari.com" className="relative inline-block transition-all duration-300">
          <span className="transition-all duration-300 hover:text-orange-500">
            Prateek Keshari
          </span>
          <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
        </a> in Berlin.
      </footer>
    </div>
  )
}

export default dynamic(() => Promise.resolve(UTMLinkForge), { ssr: false })
