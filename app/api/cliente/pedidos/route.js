import { NextResponse } from 'next/server'
import { getAllOrdenes } from '../../../../lib/database'

// GET /api/cliente/pedidos - Get orders for a specific client
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const estado = searchParams.get('estado') || ''
    const usuario_id = searchParams.get('usuario_id') || ''
    const search = searchParams.get('search') || ''

    // Por ahora, obtenemos todas las órdenes y las filtramos
    // En un sistema real, esto debería filtrarse por el usuario autenticado
    let ordenes = await getAllOrdenes()
    
    // Filter by usuario_id if provided
    if (usuario_id) {
      ordenes = ordenes.filter(orden => orden.id_usuario === usuario_id)
    }
    
    // Filter by estado
    if (estado) {
      ordenes = ordenes.filter(orden => orden.estado === estado)
    }
    
    // Filter by search term
    if (search) {
      ordenes = ordenes.filter(orden => 
        orden.id_orden.toLowerCase().includes(search.toLowerCase()) ||
        orden.tipo_servicio.toLowerCase().includes(search.toLowerCase()) ||
        (orden.cliente_nombre && orden.cliente_nombre.toLowerCase().includes(search.toLowerCase()))
      )
    }

    // Sort by created_at descending (most recent first)
    ordenes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedOrdenes = ordenes.slice(startIndex, endIndex)

    return NextResponse.json({
      data: paginatedOrdenes,
      pagination: {
        page,
        limit,
        total: ordenes.length,
        totalPages: Math.ceil(ordenes.length / limit)
      },
      filters: {
        estado,
        usuario_id,
        search
      }
    })
  } catch (error) {
    console.error('Error in GET /api/cliente/pedidos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pedidos' },
      { status: 500 }
    )
  }
}