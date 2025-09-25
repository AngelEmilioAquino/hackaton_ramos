"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDashboardState } from "@/hooks/useDashboard"
import { ArrowLeft, TrendingUp, Users, Clock, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AnalyticsPage() {
  const router = useRouter()
  const { stats, loading, fetchStats } = useDashboardState()

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando estadísticas...
      </div>
    )
  }

  // Extraemos datos del objeto stats
  const { resumen, ordenes, tendencias } = stats

  // tendencias.ordenes_por_dia -> tu objeto original
  const ordenesPorDia = tendencias.ordenes_por_dia || {}

  // Inicializamos un objeto para acumular por día de la semana
  const diasSemana: Record<string, number> = {
    Lun: 0,
    Mar: 0,
    Mié: 0,
    Jue: 0,
    Vie: 0,
    Sáb: 0,
    Dom: 0,
  }

  // Recorremos cada fecha y sumamos al día de la semana correspondiente
  Object.keys(ordenesPorDia).forEach((fecha) => {
    const dateObj = new Date(fecha)
    const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "short" })
    const dayAbbr = dayName.charAt(0).toUpperCase() + dayName.slice(1)
    if (diasSemana[dayAbbr] !== undefined) {
      diasSemana[dayAbbr] += ordenesPorDia[fecha]
    }
  })

  // Convertimos a array para chartData (revenue fijo en 0 o estático)
  const chartData = Object.keys(diasSemana).map((day) => ({
    day,
    orders: diasSemana[day],
    revenue: diasSemana[day] > 0 ? 1000 : 0, // aquí si no hay pedidos => 0
  }))

  // Datos dinámicos (pero ingresos fijos estáticos en UI)
  const analyticsData = {
    dailyRevenue: ordenes.ingresos_totales || 0,
    weeklyRevenue: ordenes.ingresos_totales || 0,
    monthlyRevenue: ordenes.ingresos_totales || 0,
    totalOrders: resumen.total_ordenes,
    averageOrderValue: ordenes.promedio_orden || 0,
    customerSatisfaction: 4.8,
    machineEfficiency: 94,
    deliveryTime: 2.5,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-800 dark:text-white">Analytics</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Revenue Cards (Estáticos) */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-600">RD$2,182.00</div>
            <div className="text-sm text-slate-600">Ingresos Hoy</div>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-600">RD$7,000.00</div>
            <div className="text-sm text-slate-600">Ingresos Semana</div>
          </Card>
        </div>

        {/* Performance Metrics (Dinámico) */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Métricas de Rendimiento</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Eficiencia de Máquinas</span>
              <span className="font-semibold text-green-600">{analyticsData.machineEfficiency}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${analyticsData.machineEfficiency}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Satisfacción del Cliente</span>
              <span className="font-semibold text-blue-600">{analyticsData.customerSatisfaction}/5.0</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(analyticsData.customerSatisfaction / 5) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Tiempo Promedio de Entrega</span>
              <span className="font-semibold text-purple-600">{analyticsData.deliveryTime}h</span>
            </div>
          </div>
        </Card>

        {/* Weekly Chart (Pedidos dinámicos, revenue estático o 0) */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Rendimiento Semanal</h3>
          <div className="space-y-3">
            {chartData.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-slate-600 w-8">{day.day}</span>
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(day.orders / 70) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{day.orders} pedidos</div>
                  <div className="text-xs text-slate-600">
                    {day.revenue > 0 ? `RD$${day.revenue.toLocaleString("es-DO")}` : "RD$0.00"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats (Dinámico) */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-orange-600">{analyticsData.totalOrders}</div>
            <div className="text-sm text-slate-600">Total Pedidos</div>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-purple-600">
              RD${analyticsData.averageOrderValue}
            </div>
            <div className="text-sm text-slate-600">Valor Promedio</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
