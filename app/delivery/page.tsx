"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Star, Navigation, Phone, CheckCircle, Moon, Sun, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import RouteMap from "@/components/route-map"
import { useClientePedidosState } from "@/hooks/useClientePedidos"


export default function DeliveryDashboard() {
  const [isDark, setIsDark] = useState(false)
  const [showRouteMap, setShowRouteMap] = useState(false)
  const router = useRouter()

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const deliveryStats = {
    todayDeliveries: 8,
    earnings: 145.5,
    rating: 4.9,
    progress: 65,
  }

  // Estado adicional para pedidos escaneados por QR
  const [scannedOrders, setScannedOrders] = useState<any[]>([])

  // Estado de pedidos desde tu hook
  const { pedidos, loading, error, fetchPedidos } = useClientePedidosState()
  console.log('Pedidos state:', { pedidos, loading, error })

  // Filtros básicos (puedes adaptarlos si usas search o pending)
  useEffect(() => {
    fetchPedidos(1, 10) // traer pedidos al montar
  }, [])

  // Función para manejar el QR
  const handleQRScanned = (orderData: any) => {
    setScannedOrders((prev) => [orderData, ...prev])
  }

  // Combinar pedidos reales + escaneados
  const allOrders = [...scannedOrders, ...pedidos]

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente"
      case "en_proceso": return "En Proceso"
      case "listo": return "Listo"
      case "entregado": return "Entregado"
      case "cancelado": return "Cancelado"
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Normal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Baja":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En ruta":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Pendiente":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (showRouteMap) {
    return <RouteMap onBack={() => setShowRouteMap(false)} />
  }

  // Calcular ganancias totales con comisión

  const commissionPercentage = 0.10; 

  const totalEarnings = allOrders.reduce((sum, order) => {
    return sum + Number(order.precio_total || 0) * commissionPercentage;
  }, 0)

  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter(order => order.estado === "entregado").length;
  const progress = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;


  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-800 dark:text-white">Delivery</h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">¡Hola, Roberto! 🚚</h2>
          <p className="text-slate-600 dark:text-slate-300">Tienes {pedidos.length} entregas pendientes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pedidos.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Entregas hoy</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Ganancias</div>
          </Card>
        </div>

        {/* Rating and Progress */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-xl font-bold text-slate-800 dark:text-white">{deliveryStats.rating}</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Rating promedio</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-1" />
              <span className="text-xl font-bold text-slate-800 dark:text-white">{progress}%</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Progreso del día</div>
          </Card>
        </div>

        {/* Route Button */}
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg font-semibold"
          onClick={() => setShowRouteMap(true)}
        >
          <Navigation className="h-5 w-5 mr-2" />
          Ver Ruta
        </Button>

      </div>

      <div className="p-4 space-y-6">
        {/* Lista de pedidos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">Pedidos Asignados</h3>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {allOrders.length} pedidos
            </Badge>
          </div>

          {loading && <p className="text-slate-600">Cargando pedidos...</p>}
          {error && <p className="text-red-600">Error al cargar pedidos</p>}

          <div className="space-y-4">
            {allOrders.map((order: any, index: number) => (
              <Card key={order.id_orden || index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        {order.cliente_nombre}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {order.id_orden}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.estado)}>
                    {getStatusText(order.estado)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="h-4 w-4 mr-2" />
                    {order.direccion_entrega}
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                    <Clock className="h-4 w-4 mr-2" />
                    {order.tiempo_estimado}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Total: ${order.precio_total}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completar
                  </Button>
                </div>
              </Card>
            ))}
            <div>
          </div>
          </div>
        </div>

        {/* Performance Today */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Rendimiento de Hoy</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-300">Entregas completadas</span>
              <span className="font-semibold text-slate-800 dark:text-white">8 / 12</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "65%" }}></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">98%</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Puntualidad</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">2.5km</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Distancia</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">4h 30m</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Tiempo activo</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}