
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, RefreshCw, Loader2, Package, Droplets, Wind, Shirt, CheckCircle, Clock, MapPin, User, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { useOrden } from "@/hooks/useOrdenes"
import { QRCodeCanvas } from "qrcode.react"

interface TrackingPageProps {
  params: {
    orderId: string
  }
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const router = useRouter()
  const { data: orden, loading, error, refetch } = useOrden(params.orderId)

  const orderStages = [
    {
      icon: Package,
      label: "Recibido",
      description: "Pedido recibido en lavandería",
      color: "bg-blue-500",
      estado: "pendiente"
    },
    {
      icon: Droplets,
      label: "Lavando",
      description: "En proceso de lavado",
      color: "bg-blue-600",
      estado: "en_lavado"
    },
    {
      icon: Wind,
      label: "Secando",
      description: "En proceso de secado",
      color: "bg-yellow-500",
      estado: "lista_recogida"
    },
    {
      icon: Shirt,
      label: "Planchado",
      description: "En proceso de planchado",
      color: "bg-purple-500",
      estado: "lista_entrega"
    },
    {
      icon: CheckCircle,
      label: "Listo",
      description: "Listo para entrega",
      color: "bg-green-500",
      estado: "entregada"
    },
  ]

  const getCurrentStageIndex = (estado: string) => {
    switch (estado) {
      case "pendiente": return 0
      case "confirmada": return 0
      case "en_proceso": return 1
      case "en_lavado": return 1
      case "lista_recogida": return 2
      case "lista_entrega": return 3
      case "entregada": return 4
      case "cancelada": return -1
      default: return 0
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "confirmada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "en_proceso":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "lista_recogida":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "en_lavado":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      case "lista_entrega":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "entregada":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente"
      case "confirmada": return "Confirmada"
      case "en_proceso": return "En Proceso"
      case "lista_recogida": return "Lista Recogida"
      case "en_lavado": return "En Lavado"
      case "lista_entrega": return "Lista Entrega"
      case "entregada": return "Entregada"
      case "cancelada": return "Cancelada"
      default: return status
    }
  }

  const getStageStatus = (index: number, currentStage: number) => {
    if (index < currentStage) return "completed"
    if (index === currentStage) return "current"
    return "pending"
  }

  const getStageColor = (index: number, currentStage: number) => {
    const status = getStageStatus(index, currentStage)
    if (status === "completed") return "bg-green-500 text-white"
    if (status === "current") return orderStages[index].color + " text-white"
    return "bg-slate-200 dark:bg-slate-600 text-slate-400"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Cargando seguimiento del pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !orden) {
  console.error("Error al cargar pedido:", error)   
  return (
    <div className="...">
      <p className="text-red-500 mb-4">Error al cargar el pedido</p>
      <p className="text-sm text-slate-500">{error}</p>  
      <Button onClick={() => router.push("/cliente")}>
        Volver al inicio
      </Button>
    </div>
  )
}

  const currentStageIndex = getCurrentStageIndex(orden.estado)
  const progressPercentage = currentStageIndex >= 0 ? ((currentStageIndex + 1) / orderStages.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/cliente")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-800 dark:text-white">
            Seguimiento #{orden.id_orden ? orden.id_orden.slice(-6) : 'N/A'}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Estado del Pedido</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Pedido #{orden.id_orden ? orden.id_orden.slice(-6) : 'N/A'}
              </p>
            </div>
            <Badge className={getStatusColor(orden.estado)}>
              {getStatusText(orden.estado)}
            </Badge>
          </div>

          {/* Stage Timeline */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              {orderStages.map((stageInfo, index) => {
                const IconComponent = stageInfo.icon
                const status = getStageStatus(index, currentStageIndex)

                return (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStageColor(index, currentStageIndex)}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <span
                        className={`text-xs font-medium ${
                          status === "pending" ? "text-slate-400" : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {stageInfo.label}
                      </span>
                      {status === "current" && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{stageInfo.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <Progress value={progressPercentage} className="h-2" />

            {orden.tiempo_estimado && currentStageIndex < orderStages.length - 1 && (
              <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                <Clock className="h-4 w-4 mr-1" />
                Tiempo estimado: {orden.tiempo_estimado}
              </div>
            )}
          </div>

          {orden.estado === "entregada" && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-800 dark:text-green-200 font-medium">¡Tu pedido ha sido entregado!</p>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                Gracias por usar nuestros servicios
              </p>
            </div>
          )}
        </Card>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Info */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Información del Servicio</h3>
            </div>
            <div className="space-y-2">
              <p><strong>Tipo de Servicio:</strong> {orden.tipo_servicio}</p>
              <p><strong>Precio Total:</strong> ${orden.precio_total}</p>
              <p><strong>Tiempo Estimado:</strong> {orden.tiempo_estimado || "N/A"}</p>
            </div>
          </Card>

          {/* Delivery Info */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 mr-2 text-orange-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Información de Entrega</h3>
            </div>
            <div className="space-y-2">
              <p><strong>Dirección:</strong> {orden.direccion_entrega || "N/A"}</p>
              <p><strong>Zona:</strong> {orden.zona_entrega || "N/A"}</p>
            </div>
          </Card>
        </div>

        {/* Order History */}
        {orden.historial && orden.historial.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Historial de Estados</h3>
            <div className="space-y-3">
              {orden.historial.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <Badge className={getStatusColor(entry.estado)}>
                      {getStatusText(entry.estado)}
                    </Badge>
                    {entry.observaciones && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {entry.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* QR del pedido */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Código QR del Pedido</h3>
          <QRCodeCanvas
            value={JSON.stringify(orden)} // Toda la info del pedido
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Escanea este código para ver tu pedido en cualquier dispositivo.
          </p>
        </Card>

        {/* Contact Info */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 mr-2 text-green-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white">¿Necesitas ayuda?</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => router.push("/cliente/chat")}>
              Chat de Soporte
            </Button>
            <Button variant="outline">
              Llamar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
