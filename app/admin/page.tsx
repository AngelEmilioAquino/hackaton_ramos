"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BarChart3, CheckCircle, Clock, Moon, Sun, Activity, Scan, Loader2, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import OrderScanner from "@/components/order-scanner"
import { useDashboardState } from "@/hooks/useDashboard"
import { useOrdenesState } from "@/hooks/useOrdenes"

export default function AdminDashboard() {
  const [isDark, setIsDark] = useState(false)
  const [showOrderScanner, setShowOrderScanner] = useState(false)
  const router = useRouter()

  // Usar hooks de API para datos reales
  const { stats, loading: statsLoading, error: statsError, fetchStats } = useDashboardState()
  const { ordenes, loading: ordenesLoading, fetchOrdenes } = useOrdenesState()
  console.log('Dashboard stats:', stats)
  console.log('Ordenes state:', { ordenes, ordenesLoading })

  useEffect(() => {
    // Cargar estadísticas y órdenes al montar el componente
    fetchStats(7) // Últimos 7 días
    fetchOrdenes(1, 10) // Primera página, 10 órdenes
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const dailyIncomeFromOrders = ordenes.reduce((total, orden) => {
  // Convertir precio_total a número por si viene como string
  const price = parseFloat(String(orden.precio_total)) || 0
  return total + price
}, 0)

// Formatear el ingreso diario como moneda local (DOP)  

const formattedIncome = dailyIncomeFromOrders.toLocaleString("es-DO", {
  style: "currency",
  currency: "DOP", 
  minimumFractionDigits: 2
})

  // Usar datos reales o valores por defecto
  const dashboardStats = stats ? {
    activeOrders: stats.resumen.total_ordenes,
    completedToday: stats.ordenes.por_estado.entregada,
    dailyIncome: formattedIncome,
    uniqueClients: stats.resumen.total_usuarios,
  } : {
    activeOrders: 0,
    completedToday: 0,
    dailyIncome: 0,
    uniqueClients: 0,
  }

  const machineStatus = [
    { id: 1, name: "Lavadora #1", status: "Activa", timeRemaining: "12 min" },
    { id: 2, name: "Lavadora #2", status: "Libre", timeRemaining: null },
    { id: 3, name: "Secadora #1", status: "Mantenimiento", timeRemaining: null },
  ]

  // Usar órdenes reales de la API
  const pendingOrders = ordenes.slice(0, 3).map(orden => ({
    id: orden.id_orden,
    customer: orden.cliente_nombre || "Cliente",
    items: orden.tipo_servicio,
    stage: getStageFromEstado(orden.estado),
    priority: "Normal",
    timeInStage : Date.now() - new Date(orden.fecha_creacion).getTime() > 48 * 60 * 60 * 1000
  ? "48h+"
  : "menos de 48h"
  }))

  function getStageFromEstado(estado: string) {
    switch (estado) {
      case "pendiente": return "Recibido"
      case "confirmada": return "Confirmado"
      case "en_proceso": return "Lavando"
      case "lista_recogida": return "Secando"
      case "en_lavado": return "Lavando"
      case "lista_entrega": return "Planchado"
      case "entregada": return "Listo"
      case "cancelada": return "Cancelado"
      default: return estado
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activa":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Libre":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "Mantenimiento":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgente":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Lavando":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Secando":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Planchado":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-800 dark:text-white">Admin Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Panel de Control 📊</h2>
          <p className="text-slate-600 dark:text-slate-300">Gestión y supervisión en tiempo real</p>
          
          {statsError && (
            <div className="mt-2 text-red-500 text-sm">
              Error al cargar estadísticas: {statsError}
            </div>
          )}
          
          {statsLoading && (
            <div className="mt-2 flex items-center text-blue-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Cargando estadísticas...
            </div>
          )}
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dashboardStats.activeOrders}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Pedidos activos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dashboardStats.completedToday}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Completados hoy</div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dashboardStats.dailyIncome}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Ingresos del día</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {dashboardStats.uniqueClients}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Clientes únicos</div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white py-6"
            onClick={() => router.push("/admin/order-management")}
          >
            <Package className="h-5 w-5 mr-2" />
            Gestión de Pedidos
          </Button>
          <Button
            variant="outline"
            className="py-6 border-2 bg-transparent"
            onClick={() => router.push("/admin/analytics")}
          >
            <Activity className="h-5 w-5 mr-2" />
            Analytics
          </Button>
        </div>

        {/* New Order Management Button */}
        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white py-6"
          onClick={() => setShowOrderScanner(true)}
        >
          <Scan className="h-5 w-5 mr-2" />
          Gestionar Estados de Pedidos
        </Button>

        {/* Machine Status */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Estado de Máquinas</h3>
          <div className="space-y-3">
            {machineStatus.map((machine) => (
              <div
                key={machine.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{machine.name}</p>
                    {machine.timeRemaining && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">{machine.timeRemaining}</p>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(machine.status)}>{machine.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">Pedidos en Proceso</h3>
            <div className="flex items-center space-x-2">
              {ordenesLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {dashboardStats.activeOrders} activos
              </Badge>
            </div>
          </div>

          {ordenes.length > 0 ? (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
              <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">{order.customer}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{order.id}</p>
                  </div>
                  <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{order.items}</p>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                    <Clock className="h-4 w-4 mr-1" />
                    {order.timeInStage}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getStageColor(order.stage)}>{order.stage}</Badge>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => router.push(`/admin/order-management/${order.id}`)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Gestionar
                  </Button>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No hay pedidos en proceso</p>
            </div>
          )}
        </Card>

        {/* Analytics Today */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Analytics de Hoy</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-300">Eficiencia de máquinas</span>
              <span className="font-semibold text-slate-800 dark:text-white">94%</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "94%" }}></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">2.5h</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Tiempo promedio</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">98%</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Satisfacción</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">15</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Horas pico (11-14h)</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Delivery Supervision */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">Supervisión de Delivery</h3>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">En ruta</Badge>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-800 dark:text-white">Roberto - Delivery</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">En ruta</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">3 pedidos asignados</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Rating: 4.9 ⭐</span>
              <span className="text-sm text-slate-600 dark:text-slate-300">ETA: 15 min</span>
            </div>
          </div>
        </Card>
      </div>

      {/* OrderScanner Modal Component */}
      <OrderScanner isOpen={showOrderScanner} onClose={() => setShowOrderScanner(false)} />
    </div>
  )
}
