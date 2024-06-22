'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const CompoundCalculator = () => {

  const [principal, setPrincipal] = useState(1000)
  const [rate, setRate] = useState(5)
  const [time, setTime] = useState(10)
  const [compound, setCompound] = useState(12)
  const [result, setResult] = useState(0)
  const [data, setData] = useState<{ year: number; amount: number }[]>([])
  const [currency, setCurrency] = useState('USD')
  const [additionalContribution, setAdditionalContribution] = useState(0)
  const [contributionFrequency, setContributionFrequency] = useState('monthly')

  const currentYear = new Date().getFullYear()

  const calculateCompoundInterest = useMemo(() => {
    return () => {
      const r = rate / 100
      const n = compound
      const t = time
      const P = principal
      const PMT = additionalContribution

      let amount = P
      let totalContributions = 0
      const newData = []

      for (let i = 0; i <= t; i++) {
        if (i > 0) {
          amount = amount * (1 + r / n)
          const contributionsPerYear = contributionFrequency === 'monthly' ? 12 : contributionFrequency === 'quarterly' ? 4 : 1
          for (let j = 0; j < contributionsPerYear; j++) {
            amount += PMT
            totalContributions += PMT
            amount = amount * (1 + r / n) ** (1 / contributionsPerYear)
          }
        }
        newData.push({
          year: currentYear + i,
          amount: Number(amount.toFixed(2))
        })
      }

      setResult(Number(amount.toFixed(2)))
      setData(newData)
      return totalContributions
    }
  }, [principal, rate, time, compound, currentYear, additionalContribution, contributionFrequency])

  const [totalContributions, setTotalContributions] = useState(0)

  useEffect(() => {
    const contributions = calculateCompoundInterest()
    setTotalContributions(contributions)
  }, [calculateCompoundInterest])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
  }

 return (
  <div className="w-full max-w-7xl mx-auto px-4 py-16 font-inter text-gray-800">
      <motion.h1  
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-extrabold mb-12 text-center text-gray-800"
      >
        Compound calculator.
      </motion.h1>
      <Card className="shadow-lg bg-white rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-8 space-y-8 bg-gray-100 rounded-l-xl">
              <div className="space-y-6">
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Label htmlFor="principal" className="text-sm font-semibold text-gray-700">Initial Investment</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full rounded-lg bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Label htmlFor="rate" className="text-sm font-semibold text-gray-700">Annual Interest Rate (%)</Label>
                  <Slider
                    id="rate"
                    min={0}
                    max={20}
                    step={0.1}
                    value={[rate]}
                    onValueChange={(value) => setRate(value[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600 block text-right">{rate}%</span>
                </motion.div>
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Label htmlFor="time" className="text-sm font-semibold text-gray-700">Investment Period (Years)</Label>
                  <Slider
                    id="time"
                    min={1}
                    max={30}
                    step={1}
                    value={[time]}
                    onValueChange={(value) => setTime(value[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600 block text-right">{time} years</span>
                </motion.div>
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Label htmlFor="compound" className="text-sm font-semibold text-gray-700">Compound Frequency</Label>
                  <Select onValueChange={(value) => setCompound(Number(value))} defaultValue={compound.toString()}>
                    <SelectTrigger className="w-full bg-white border-gray-300 text-gray-800">
                      <SelectValue placeholder="Select compound frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 text-gray-800">
                      <SelectItem value="1">Annually</SelectItem>
                      <SelectItem value="2">Semi-Annually</SelectItem>
                      <SelectItem value="4">Quarterly</SelectItem>
                      <SelectItem value="12">Monthly</SelectItem>
                      <SelectItem value="365">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <Label htmlFor="currency" className="text-sm font-semibold text-gray-700">Currency</Label>
                  <Select onValueChange={setCurrency} defaultValue={currency}>
                    <SelectTrigger className="w-full bg-white border-gray-300 text-gray-800">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 text-gray-800">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                  <Label htmlFor="additionalContribution" className="text-sm font-semibold text-gray-700">Additional Contribution (Optional)</Label>
                  <Input
                    id="additionalContribution"
                    type="number"
                    value={additionalContribution}
                    onChange={(e) => setAdditionalContribution(Number(e.target.value))}
                    className="w-full rounded-lg bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  <Label htmlFor="contributionFrequency" className="text-sm font-semibold text-gray-700">Contribution Frequency</Label>
                  <Select onValueChange={setContributionFrequency} defaultValue={contributionFrequency}>
                    <SelectTrigger className="w-full bg-white border-gray-300 text-gray-800">
                      <SelectValue placeholder="Select contribution frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 text-gray-800">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
            </div>
            <div className="col-span-2 p-8 bg-white rounded-r-xl">
              <motion.div 
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 50, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#666"
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis 
                      stroke="#666"
                      tickFormatter={(value) => formatCurrency(value)}
                      domain={['auto', 'auto']}
                      padding={{ top: 20, bottom: 20 }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', color: '#333' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#000000" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8, fill: '#000000' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

export default CompoundCalculator