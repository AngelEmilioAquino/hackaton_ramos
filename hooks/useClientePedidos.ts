import { useState, useEffect } from 'react'
import { useApi } from './useApi'

export interface ClientePedido {
  id_orden: string
  id_usuario: string
  id_repartidor?: string
  fecha_creacion: string
  estado: string
  tipo_servicio: string
  extras_orden?: any
  precio_total: number
  tiempo_estimado?: string
  direccion_entrega?: string
  zona_entrega?: string
  created_at: string
  updated_at?: string
  cliente_nombre?: string
  cliente_email?: string
  cliente_telefono?: string
}

export interface ClientePedidosResponse {
  data: ClientePedido[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    estado?: string
    usuario_id?: string
    search?: string
  }
}

// Hook para obtener pedidos del cliente
export function useClientePedidos(page = 1, limit = 10, filters: {
  estado?: string
  usuario_id?: string
  search?: string
} = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value
      return acc
    }, {} as Record<string, string>),
  })

  return useApi<ClientePedidosResponse>(`/api/cliente/pedidos?${params}`)
}

// Hook para gestión de estado local de pedidos del cliente
export function useClientePedidosState() {
  const [pedidos, setPedidos] = useState<ClientePedido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPedidos = async (page = 1, limit = 10, filters: {
    estado?: string
    usuario_id?: string
    search?: string
  } = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value
          return acc
        }, {} as Record<string, string>),
      })

      const response = await fetch(`/api/cliente/pedidos?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ClientePedidosResponse = await response.json()
      setPedidos(result.data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }

  const addPedido = (pedido: ClientePedido) => {
    setPedidos(prev => [pedido, ...prev])
  }

  const updatePedido = (updatedPedido: ClientePedido) => {
    setPedidos(prev => 
      prev.map(pedido => 
        pedido.id_orden === updatedPedido.id_orden ? updatedPedido : pedido
      )
    )
  }

  const removePedido = (id: string) => {
    setPedidos(prev => prev.filter(pedido => pedido.id_orden !== id))
  }

  return {
    pedidos,
    loading,
    error,
    fetchPedidos,
    addPedido,
    updatePedido,
    removePedido,
  }
}
