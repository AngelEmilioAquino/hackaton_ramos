import { NextResponse } from 'next/server'
import { getAllOrdenes, getAllUsuarios, getAllServicios } from '../../../lib/database'

// GET /api/dashboard - Get dashboard statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30' // days
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')

    // Get all data
    const [ordenes, usuarios, servicios] = await Promise.all([
      getAllOrdenes(),
      getAllUsuarios(),
      getAllServicios()
    ])

    console.log(Array.isArray(ordenes), ordenes)
    console.log(Array.isArray(usuarios), usuarios)
    console.log(Array.isArray(servicios), servicios)

    if (!Array.isArray(ordenes) || !Array.isArray(usuarios) || !Array.isArray(servicios)) {
      throw new Error('Data fetched is not in expected array format')
    }
    
    // Calculate date range
    const now = new Date()
    const startDate = fecha_desde 
      ? new Date(fecha_desde)
      : new Date(now.getTime() - (parseInt(periodo) * 24 * 60 * 60 * 1000))
    const endDate = fecha_hasta ? new Date(fecha_hasta) : now

    // Filter ordenes by date range
    const ordenesFiltradas = ordenes.filter(orden => {
      const ordenDate = new Date(orden.created_at)
      return ordenDate >= startDate && ordenDate <= endDate
    })

    // Calculate statistics
    const estadisticas = {
      resumen: {
        total_ordenes: ordenesFiltradas.length,
        total_usuarios: usuarios.length,
        total_servicios: servicios.length,
        periodo_dias: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      ordenes: {
        por_estado: {
          pendiente: ordenesFiltradas.filter(o => o.estado === 'pendiente').length,
          confirmada: ordenesFiltradas.filter(o => o.estado === 'confirmada').length,
          en_proceso: ordenesFiltradas.filter(o => o.estado === 'en_proceso').length,
          lista_recogida: ordenesFiltradas.filter(o => o.estado === 'lista_recogida').length,
          en_lavado: ordenesFiltradas.filter(o => o.estado === 'en_lavado').length,
          lista_entrega: ordenesFiltradas.filter(o => o.estado === 'lista_entrega').length,
          entregada: ordenesFiltradas.filter(o => o.estado === 'entregada').length,
          cancelada: ordenesFiltradas.filter(o => o.estado === 'cancelada').length
        },
        ingresos_totales: ordenesFiltradas.reduce((sum, orden) => sum + parseFloat(orden.total || 0), 0),
        promedio_orden: ordenesFiltradas.length > 0 
          ? ordenesFiltradas.reduce((sum, orden) => sum + parseFloat(orden.total || 0), 0) / ordenesFiltradas.length 
          : 0
      },
      tendencias: {
        ordenes_por_dia: calcularTendenciasPorDia(ordenesFiltradas, startDate, endDate),
        ingresos_por_dia: calcularIngresosPorDia(ordenesFiltradas, startDate, endDate)
      }
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// Helper functions
function calcularTendenciasPorDia(ordenes, startDate, endDate) {
  const tendencias = {}
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    tendencias[dateKey] = ordenes.filter(orden => {
      const ordenDate = new Date(orden.created_at).toISOString().split('T')[0]
      return ordenDate === dateKey
    }).length
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return tendencias
}

function calcularIngresosPorDia(ordenes, startDate, endDate) {
  const ingresos = {}
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    ingresos[dateKey] = ordenes
      .filter(orden => {
        const ordenDate = new Date(orden.created_at).toISOString().split('T')[0]
        return ordenDate === dateKey
      })
      .reduce((sum, orden) => sum + parseFloat(orden.total || 0), 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return ingresos
}