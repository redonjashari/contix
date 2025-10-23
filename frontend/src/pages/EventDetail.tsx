import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { eventsApi, holdsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, MapPin, Clock, Music, Users, Ticket, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [isCreatingHold, setIsCreatingHold] = useState(false)

  const { data: event, isLoading } = useQuery(
    ['event', id],
    () => eventsApi.getEvent(id!),
    { enabled: !!id }
  )

  const { data: seats } = useQuery(
    ['event-seats', id],
    () => eventsApi.getEventSeats(id!),
    { enabled: !!id }
  )

  const eventData = event?.data
  const seatsData = seats?.data

  const handleSeatSelect = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId))
    } else {
      setSelectedSeats([...selectedSeats, seatId])
    }
  }

  const handleCreateHold = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }

    setIsCreatingHold(true)
    try {
      const seatCodes = selectedSeats.map(seatId => {
        const seat = seatsData?.sections[Object.keys(seatsData.sections)[0]]?.find(s => s.id === seatId)
        return `${seat?.section}-${seat?.row}-${seat?.number}`
      }).filter(Boolean)

      const response = await holdsApi.createHold(id!, {
        seats: seatCodes,
        ttlSeconds: 600, // 10 minutes
      })

      toast.success('Seats held successfully!')
      navigate('/checkout', { state: { holdToken: response.data.holdToken } })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to hold seats')
    } finally {
      setIsCreatingHold(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!eventData) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Event not found</h3>
        <p className="text-gray-600">The event you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Event Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border overflow-hidden"
      >
        <div className="relative">
          {eventData.posterPath ? (
            <img
              src={eventData.posterPath}
              alt={eventData.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
              <Music className="w-24 h-24 text-white" />
            </div>
          )}
          {eventData.genre && (
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              {eventData.genre}
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {eventData.title}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {eventData.description}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-primary-600">
              <Star className="w-5 h-5" />
              <span className="font-medium">Featured Event</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-medium text-gray-900">{eventData.venue.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(eventData.startAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(eventData.startAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seat Selection */}
      {seatsData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Your Seats</h2>
            <div className="text-sm text-gray-600">
              {seatsData.summary.available} seats available
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(seatsData.sections).map(([section, seats]) => (
              <div key={section}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Section {section}
                </h3>
                <div className="grid grid-cols-10 gap-2">
                  {seats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatSelect(seat.id)}
                      disabled={seat.status !== 'AVAILABLE'}
                      className={`w-12 h-12 rounded-lg text-sm font-medium transition-colors ${
                        seat.status === 'AVAILABLE'
                          ? selectedSeats.includes(seat.id)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-primary-100'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  ${seats[0]?.price || 0} per seat
                </div>
              </div>
            ))}
          </div>

          {selectedSeats.length > 0 && (
            <div className="mt-8 p-6 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600">Selected Seats</p>
                  <p className="text-lg font-semibold text-primary-900">
                    {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  onClick={handleCreateHold}
                  disabled={isCreatingHold}
                  className="btn btn-primary btn-lg"
                >
                  {isCreatingHold ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Holding seats...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Continue to Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
