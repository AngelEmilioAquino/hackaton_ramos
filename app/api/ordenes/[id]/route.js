import { NextResponse } from 'next/server'
import { getOrdenById, updateOrdenEstado, getPrendasByOrdenId, getExtrasByOrdenId, getHistorialByOrdenId, getPagosByOrdenId, addEstadoToHistorial } from '../../../../lib/database'

// GET /api/ordenes/[id] - Get orden by ID with complete details
export async function GET(request, { params }) {
  try {
    const { id } = params
    
    const orden = await getOrdenById(id)
    console.log('Fetched orden:', orden)
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden not found' },
        { status: 404 }
      )
    }

    // Get all related data
    const [prendas, extras, historial, pagos] = await ([
      getPrendasByOrdenId(id),
      getExtrasByOrdenId(id),
      getHistorialByOrdenId(id),
      getPagosByOrdenId(id)
    ])

    const ordenCompleta = {
      ...orden,
      prendas,
      extras,
      historial,
      pagos
    }

    return NextResponse.json(ordenCompleta)
  } catch (error) {
    console.error('Error in GET /api/ordenes/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orden' },
      { status: 500 }
    )
  }
}

// PATCH /api/ordenes/[id] - Update orden estado
export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { estado, observaciones, usuario_id } = body

    if (!estado) {
      return NextResponse.json(
        { error: 'Estado is required' },
        { status: 400 }
      )
    }

    // Valid estados
    const validEstados = ['pendiente', 'confirmada', 'en_proceso', 'lista_recogida', 'en_lavado', 'lista_entrega', 'entregada', 'cancelada']
    if (!validEstados.includes(estado)) {
      return NextResponse.json(
        { error: `Invalid estado. Must be one of: ${validEstados.join(', ')}` },
        { status: 400 }
      )
    }

    const orden = await updateOrdenEstado(id, estado)
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden not found' },
        { status: 404 }
      )
    }

    // Add to historial if observaciones or usuario_id provided
    if (observaciones || usuario_id) {
      await addEstadoToHistorial(id, {
        estado,
        observaciones: observaciones || '',
        id_usuario: usuario_id || null
      })
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error in PATCH /api/ordenes/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update orden' },
      { status: 500 }
    )
  }
}

// DELETE /api/ordenes/[id] - Cancel orden (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    // Update estado to 'cancelada' instead of hard delete
    const orden = await updateOrdenEstado(id, 'cancelada')
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden not found' },
        { status: 404 }
      )
    }

    // Add to historial
    await addEstadoToHistorial(id, {
      estado: 'cancelada',
      observaciones: 'Orden cancelada',
      id_usuario: null
    })

    return NextResponse.json({ message: 'Orden cancelled successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/ordenes/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to cancel orden' },
      { status: 500 }
    )
  }
}
