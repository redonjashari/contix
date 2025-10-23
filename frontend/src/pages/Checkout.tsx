import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { holdsApi, paymentsApi } from '../services/api'
import { CreditCard, Lock, ArrowLeft, Loader } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export const Checkout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [holdToken, setHoldToken] = useState<string | null>(null)

  useEffect(() => {
    const token = location.state?.holdToken
    if (!token) {
      navigate('/events')
      return
    }
    setHoldToken(token)
  }, [location.state, navigate])

  const { data: hold, isLoading } = useQuery(
    ['hold', holdToken],
    () => holdsApi.getHold(holdToken!),
    { enabled: !!holdToken }
  )

  const handlePayment = async () => {
    if (!holdToken) return

    setIsProcessing(true)
    try {
      const response = await paymentsApi.createPaymentIntent(holdToken)
      
      // In a real app, you would integrate with Stripe Elements here
      // For now, we'll simulate a successful payment
      toast.success('Payment successful! Your tickets have been issued.')
      navigate('/tickets')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!hold?.data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hold expired</h3>
        <p className="text-gray-600">Your seat hold has expired. Please try again.</p>
      </div>
    )
  }

  const totalAmount = hold.data.totalAmount

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border p-8"
      >
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/events')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600">Complete your ticket purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            
            <div className="space-y-4">
              {hold.data.heldSeats.map((seat, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">
                      Section {seat.section}, Row {seat.row}, Seat {seat.number}
                    </p>
                    <p className="text-sm text-gray-600">General Admission</p>
                  </div>
                  <span className="font-semibold text-gray-900">${seat.price}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>${totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="input"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="input"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="input"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Payment</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Your payment information is encrypted and secure.
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="btn btn-primary btn-lg w-full"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
