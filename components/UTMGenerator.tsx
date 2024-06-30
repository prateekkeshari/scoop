"use client";
import React, { useState, useEffect, KeyboardEvent, ChangeEvent, useRef } from 'react'
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
import { AlertCircle, Download } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Image from 'next/image';

// Dynamically import icon components
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

  useEffect(() => {
    // Load the URL and UTM values from localStorage when the component mounts
    const savedUrl = localStorage.getItem('savedUrl')
    const savedUtmValues = localStorage.getItem('savedUtmValues')
    const savedPreview = localStorage.getItem('savedPreview')
    if (savedUrl) {
      setUrl(savedUrl)
    }
    if (savedUtmValues) {
      setUtmValues(JSON.parse(savedUtmValues))
    }
    if (savedPreview) {
      setPreview(JSON.parse(savedPreview))
    }
  }, [])

  useEffect(() => {
    generateUTMUrl();
    // Save the URL and UTM values to localStorage whenever they change
    localStorage.setItem('savedUrl', url);
    localStorage.setItem('savedUtmValues', JSON.stringify(utmValues));
  }, [url, utmValues, generateUTMUrl]);

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
      localStorage.setItem('savedPreview', JSON.stringify(response.data))
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
      const img = new window.Image(); // Explicitly use window.Image
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        
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
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-8 font-inter text-gray-900 dark:text-gray-100 mt-40">
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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold mb-2 flex items-center"
          >
            <img src="icons/scoop.png" alt="Scoop Logo" className="h-6 w-6 mr-2" />
            <span className="drop-shadow-[0_1px_12px_rgba(255,255,255,0.7)]">Scoop</span>
          </motion.h1>
          <p className="text-md text-gray-400 dark:text-gray-500">
            Free UTM Builder, QR Code Generator, and Link Preview Tool
          </p>
        </div>
        <Button onClick={toggleTheme} variant="outline" size="icon" className="mt-4 sm:mt-0">
          {theme === 'dark' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </header>
  
      <section className="flex flex-col lg:flex-row gap-4 sm:gap-8 mb-12">
        <Card className="shadow-sm bg-white dark:bg-black rounded-lg overflow-hidden mb-4 sm:mb-8 flex-1 w-full">
          <CardContent className="p-4 sm:p-6 flex flex-col h-full">

            <div className="space-y-4 sm:space-y-6 flex-grow">
              <div>
                <Label htmlFor="url"                 className="text-sm font-medium mb-1 block pb-2">Enter URL *</Label>
                <Input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full transition-all duration-200 ${url && isValidUrl(url) ? 'border-green-500' : 'border-gray-300 dark:border-gray-700'}`}
                  placeholder="stripe.com"
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
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : preview ? (
              <div className="space-y-4 flex-grow">
                {preview.ogImage && (
                  <Image src={preview.ogImage} alt="Preview" width={600} height={300} className="w-full h-48 object-cover rounded-lg" />
                )}
                <div className="flex items-center space-x-2">
                  {preview.favicon && (
                    <Image src={preview.favicon} alt="Favicon" width={16} height={16} className="w-4 h-4" />
                  )}
                  <p className="text-sm text-gray-500 truncate">{new URL(preview.url).hostname}</p>
                </div>
                <h3 className="text-lg font-semibold">{preview.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{preview.description}</p>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Enter a URL and click "See Preview" to view the link preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-[#0A0A0B] p-6 rounded-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                <Label htmlFor="qr-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  QR code URL
                </Label>
                <Input
                  id="qr-text"
                  type="text"
                  value={generatedUrl || url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                  placeholder="Enter text for QR code"
                />
              </div>
              <div className="flex justify-center mb-6">
                <QRCode
                  id="qr-code"
                  value={generatedUrl || url}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={logo ? {
                    src: logo,
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  } : undefined}
                />
              </div>
              
              <div className="flex justify-between mb-6">
                <Button onClick={() => document.getElementById('logo-upload')?.click()} variant="outline" className="w-1/2 mr-2">
                  Upload Logo
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button onClick={downloadQR} variant="default" className="w-1/2 ml-2">
                  <Download className="mr-2 h-4 w-4" /> Download QR
                </Button>
              </div>
              <Button onClick={() => setIsDrawerOpen(false)} variant="outline" className="w-full">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 mb-12">
        Made by <a href="https://prateekkeshari.com" className="relative inline-block transition-all duration-300">
          <span className="transition-all duration-300 hover:text-orange-500">
            Prateek Keshari
          </span>
          <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
        </a> in Berlin.
      </footer>
      <section className="space-y-12 text-sm text-gray-600 dark:text-gray-400">
        
        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Free UTM Builder, QR Code Generator, and Meta Tag Preview Tool</h3>
          <p className="mb-4">Scoop is a free, all-in-one tool designed to simplify and enhance your digital marketing efforts. Built by Prateek Keshari, Scoop combines a UTM builder, QR code generator, and meta tag optimizer into one user-friendly platform.</p>
          <p className="mb-4">With Scoop, you can easily create trackable links with UTM parameters, generate customizable QR codes, and optimize your meta tags for better SEO and social sharing. Whether you're a small business owner, a marketing professional, or a content creator, Scoop provides the tools you need to improve your online presence and track your marketing campaigns effectively.</p>
          <p className="mt-4">Best of all, Scoop is completely free to use. We believe in making powerful marketing tools accessible to everyone, helping businesses of all sizes compete in the digital landscape. Start using Scoop today to streamline your marketing efforts and gain valuable insights into your online campaigns.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">UTM Parameters: Definition and Usage</h3>
          <p className="mb-4">UTM parameters are tags added to website links to track visitor sources. They help you understand which marketing efforts are most effective. With UTM parameters, you can identify which ads, emails, or social media posts are bringing visitors to your site.</p>
          <p className="mb-4">There are five main UTM parameters: source, medium, campaign, term, and content. Source indicates where the traffic comes from, such as Google or Facebook. Medium shows how visitors arrived, like through an email or a paid ad. Campaign name groups related marketing efforts. Term and content are more specific, tracking things like keywords or individual links within a larger campaign.</p>
          <p className="mt-4">Using UTM parameters allows you to make informed decisions about your marketing efforts. You can see which strategies are working well and which ones need improvement or should be discontinued.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">QR Codes: Function and Marketing Applications</h3>
          <p className="mb-4">QR codes are square, pixelated images that can be scanned with a smartphone camera. When scanned, they quickly direct users to a specific webpage or display information.</p>
          <p className="mb-4">In marketing, QR codes connect physical and digital experiences. For example, you can add a QR code to a product poster, allowing people to easily access more information, make a purchase, or sign up for updates by scanning the code.</p>
          <p className="mb-4">QR codes also provide tracking capabilities. You can monitor how many people scanned your code, when they did it, and their location. This helps you assess the effectiveness of your offline marketing. Additionally, you can update the destination of the QR code without changing the code itself, providing flexibility in your marketing efforts.</p>
          <p className="mt-4">When using QR codes in marketing, ensure the linked page is mobile-friendly. It's also beneficial to provide an incentive for scanning, such as a discount or exclusive content. This approach adds value for your customers beyond just using the technology.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Meta Tags: Definition and SEO Benefits</h3>
          <p className="mb-4">Meta tags are text snippets in a website's code that describe the page's content. While not visible on the page itself, search engines and social media platforms use these tags to understand and display your content.</p>
          <p className="mb-4">The title tag and meta description are crucial for SEO. The title tag appears as the clickable headline in search results, while the meta description is the summary below it. These elements are your opportunity to make a good first impression and encourage clicks on your link.</p>
          <p className="mb-4">Open Graph (OG) tags are special meta tags that control how your content appears when shared on social media. They ensure that your page displays with the correct image, title, and description when shared on platforms like Facebook or Twitter.</p>
          <p className="mt-4">Optimizing your meta tags helps search engines understand your page content, potentially improving your rankings. It also makes your links more appealing in search results and on social media, which can lead to increased clicks and site visits.</p>
        </div>

      

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Frequently Asked Questions about UTMs, QR Codes, and Meta Tags
          </h3>
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How do meta tags affect SEO and social sharing?
              </AccordionTrigger>
              <AccordionContent>
                <p>Meta tags help SEO and social sharing by:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Making your site show up better in search results</li>
                  <li>Encouraging more people to click on your links</li>
                  <li>Making your content look good when shared on social media</li>
                  <li>Helping search engines understand your content better</li>
                  <li>Improving your site's visibility in both search and social</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                What's the best length for meta tags?
              </AccordionTrigger>
              <AccordionContent>
                <p>Here are the ideal lengths for meta tags:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Title tags: 50-60 characters</li>
                  <li>Meta descriptions: 150-160 characters</li>
                  <li>OG title: 60-90 characters</li>
                  <li>OG description: 200-250 characters</li>
                  <li>Twitter title: 70 characters</li>
                  <li>Twitter description: 200 characters</li>
                </ul>
                <p className="mt-2">Remember, these are guidelines. Focus on writing clear, compelling content within these limits.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                How do I use UTM parameters effectively?
              </AccordionTrigger>
              <AccordionContent>
                <p>To use UTM parameters effectively:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Be consistent with your naming</li>
                  <li>Use them for all external marketing efforts</li>
                  <li>Don't use them for internal links on your site</li>
                  <li>Check your UTM data regularly in your analytics</li>
                  <li>Use a URL shortener for cleaner links</li>
                  <li>Create a guide for your team to ensure everyone uses them the same way</li>
                  <li>Use lowercase letters to avoid issues with some analytics tools</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                What are the best practices for creating QR codes?
              </AccordionTrigger>
              <AccordionContent>
                <p>Best practices for QR codes:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Make sure the linked page works well on mobile</li>
                  <li>Include a call-to-action near the QR code</li>
                  <li>Test the code on different devices and in different lighting</li>
                  <li>Make it big enough to scan easily (at least 2x2 cm)</li>
                  <li>Add your logo or brand colors to make it recognizable</li>
                  <li>Offer something valuable when people scan it</li>
                  <li>Track scans using UTM parameters or QR code analytics</li>
                  <li>Check and update the linked content regularly</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                How can I optimize meta tags for both search engines and social media?
              </AccordionTrigger>
              <AccordionContent>
                <p>To optimize meta tags for search and social:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Write unique titles and descriptions for each page</li>
                  <li>Include relevant keywords naturally</li>
                  <li>Make your descriptions compelling with a clear benefit or call-to-action</li>
                  <li>Use Open Graph tags for better control on social media</li>
                  <li>Add Twitter Card meta tags for Twitter sharing</li>
                  <li>Keep your meta tags consistent with your page content</li>
                  <li>Update meta tags for seasonal content or time-sensitive offers</li>
                  <li>Use schema markup to give search engines more context</li>
                  <li>Monitor your click-through rates and adjust as needed</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                What are some advanced digital marketing strategies?
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>A/B testing meta descriptions: Create two versions of a meta description and test which one performs better in terms of click-through rates.</li>
                  <li>Dynamic UTM parameters: Use server-side scripts to automatically generate UTM parameters based on user behavior or campaign specifics.</li>
                  <li>QR codes with augmented reality: QR codes can trigger AR experiences, enhancing engagement and providing immersive content.</li>
                  <li>Structured data markup: A standardized format for providing information about a page and classifying its content; it helps search engines understand your content better and can result in rich snippets in search results.</li>
                  <li>Hreflang tags for international SEO: These tags tell search engines which language you are using on a specific page, so the search engine can serve that result to users searching in that language.</li>
                  <li>Canonical tags: These tags help search engines understand which version of a URL you want to appear in search results, useful for avoiding duplicate content issues.</li>
                  <li>AMP pages: Accelerated Mobile Pages are a web component framework for building fast-loading mobile web pages, improving user experience and potentially boosting search rankings.</li>
                  <li>Meta robots tags: These tags provide instructions to search engine crawlers about how to crawl or index page content, giving you more control over your site's appearance in search results.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left">
                10 Steps to Improve Your Digital Marketing
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Audit your website's meta tags quarterly to ensure they're up-to-date and optimized.</li>
                  <li>Use tools like Google Optimize to A/B test meta descriptions, focusing on one variable at a time.</li>
                  <li>Create a UTM parameter guide document and train your team on consistent usage.</li>
                  <li>Use QR codes on physical products, in-store displays, or event materials to bridge offline and online experiences.</li>
                  <li>Use Open Graph tags to control how your content appears when shared on social platforms.</li>
                  <li>Add schema markup for your organization, products, and key content types to enhance search visibility.</li>
                  <li>Set up a UTM tracking dashboard in Google Analytics or your preferred analytics tool.</li>
                  <li>Regularly update the content linked to QR codes and use dynamic QR codes for easier management.</li>
                  <li>Use tools like SEMrush or Ahrefs to analyze competitors' meta tags and identify opportunities.</li>
                  <li>Maintain a log of meta tag changes to track their impact on search performance over time.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
          <h3 className="text-2xl font-bold mb-3 text-white">Use Scoop for Free</h3>
          <p className="mb-4 text-gray-100">Unlock powerful digital marketing tools with Scoop's free UTM builder, QR code generator, and meta tag preview. Optimize your campaigns, track performance, and boost online visibility effortlessly. Perfect for marketers, businesses, and content creators looking to enhance their digital strategy without cost.</p>
          <Button 
            className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-300 font-semibold py-3 rounded-lg shadow-md"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="mr-2">🚀</span> Start Using Scoop Now
          </Button>
        </div>
      </section>
    </div>
    </div>
  )
}



export default dynamic(() => Promise.resolve(UTMLinkForge), { ssr: false });