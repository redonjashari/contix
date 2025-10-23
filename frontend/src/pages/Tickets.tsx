import React from 'react'
import { useQuery } from 'react-query'
import { ticketsApi } from '../services/api'
import { Ticket, Calendar, MapPin, QrCode, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import QRCode from 'react-qr-code'

export const Tickets: React.FC = () => {
  const { data: tickets, isLoading } = useQuery('my-tickets', ticketsApi.getMyTickets)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tickets?.data?.length) {
    return (
      <div className="text-center py-12">
        <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
        <p className="text-gray-600">You haven't purchased any tickets yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Tickets</h1>
        <p className="text-lg text-gray-600">Your upcoming concert tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.data.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-600">Ticket #{ticket.ticketCode.slice(-8)}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.isScanned 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {ticket.isScanned ? 'Used' : 'Valid'}
                </div>
              </div>

              <div className="text-center mb-6">
                <QRCode
                  value={ticket.qrData}
                  size={120}
                  className="mx-auto"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ticket.order.event.title}</h3>
                  <p className="text-sm text-gray-600">{ticket.order.event.venue.name}</p>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(ticket.order.event.startAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Section {ticket.seat.section}, Row {ticket.seat.row}, Seat {ticket.seat.number}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="font-semibold text-gray-900">${ticket.seat.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
