"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, RefreshCw, Loader2, Eye, Package, Calendar, DollarSign, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useClientePedidosState } from "@/hooks/useClientePedidos"

export default function ClientePedidos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPedido, setSelectedPedido] = useState("")
  const [searchByNombre, setSearchByNombre] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const router = useRouter()

  const { pedidos, loading, error, fetchPedidos } = useClientePedidosState()
  console.log('Pedidos state:', { pedidos, loading, error })

  useEffect(() => {
    // Solo hacer fetch si no estamos en modo búsqueda
    if (searchResults.length === 0) {
      fetchPedidos(1, 20, {
        estado: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
      })
    }
  }, [statusFilter, searchTerm, searchResults.length])

  // Mostrar resultados de búsqueda, pedidos pendientes, o pedidos normales
  let baseOrders = pedidos
  if (searchResults.length > 0) {
    baseOrders = searchResults
  } else if (showPendingOnly && pendingOrders.length > 0) {
    baseOrders = pendingOrders
  }
  
  // Aplicar filtro de estado a los pedidos base (solo si no estamos en modo pendiente)
  const filteredOrders = baseOrders.filter(pedido => {
    if (showPendingOnly) return true // Ya están filtrados por pendiente
    if (statusFilter === "all") return true
    return pedido.estado === statusFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "en_proceso":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "listo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "entregado":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente": return "⏳"
      case "en_proceso": return "🔄"
      case "listo": return "✅"
      case "entregado": return "🎉"
      case "cancelado": return "❌"
      default: return "📋"
    }
  }

  const handleRefresh = () => {
    fetchPedidos(1, 20, {
      estado: statusFilter === "all" ? undefined : statusFilter,
      search: searchTerm || undefined,
    })
  }

  const handleSearchByNombre = async () => {
    if (!searchByNombre.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/ordenes/buscar?nombre=${encodeURIComponent(searchByNombre)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setSearchResults(result.data)
    } catch (error) {
      console.error('Error searching by nombre:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleShowPendingOnly = async () => {
    try {
      setShowPendingOnly(true)
      const response = await fetch('/api/orders/pending')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setPendingOrders(result.data)
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      setPendingOrders([])
    }
  }

  const handleShowAllOrders = () => {
    setShowPendingOnly(false)
    setPendingOrders([])
    setSearchResults([])
    setSearchByNombre("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/cliente")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-800 dark:text-white">
            {showPendingOnly ? 'Pedidos Pendientes' : 'Mis Pedidos'}
          </h1>
          <div className="flex items-center space-x-2">
            {!showPendingOnly ? (
              <Button onClick={handleShowPendingOnly} variant="outline" size="sm" className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                <Package className="h-4 w-4 mr-1" />
                Pendientes
              </Button>
            ) : (
              <Button onClick={handleShowAllOrders} variant="outline" size="sm" className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100">
                <RefreshCw className="h-4 w-4 mr-1" />
                Todos
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Búsqueda por nombre de usuario */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Búsqueda Avanzada por Nombre de Usuario
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ingresa el nombre del usuario..."
                  value={searchByNombre}
                  onChange={(e) => setSearchByNombre(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearchByNombre} 
                  disabled={isSearching || !searchByNombre.trim()}
                  variant="outline"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✅ Encontrados {searchResults.length} pedidos para "{searchByNombre}"
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setSearchResults([])
                      setSearchByNombre("")
                    }}
                    className="text-xs"
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              )}
            </div>

            {/* Filtros regulares */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por ID o servicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={statusFilter !== "all" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="listo">Listo</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {statusFilter !== "all" && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Filtro activo: {statusFilter}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Orders List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {searchResults.length > 0 
                ? `Resultados de búsqueda para "${searchByNombre}" (${filteredOrders.length})`
                : showPendingOnly
                  ? `Pedidos Pendientes (${filteredOrders.length})`
                  : statusFilter !== "all" 
                    ? `Pedidos - Estado: ${statusFilter} (${filteredOrders.length})`
                    : `Mis Pedidos (${filteredOrders.length})`
              }
            </h2>
            {loading && (
              <div className="flex items-center text-blue-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando...
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">
              Error al cargar pedidos: {error}
            </div>
          )}

          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {/* Select Dropdown para pedidos */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona un pedido para ver detalles:
                </label>
                <Select value={selectedPedido} onValueChange={setSelectedPedido}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un pedido..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrders.map((pedido) => (
                      <SelectItem key={pedido.id_orden} value={pedido.id_orden}>
                        <div className="flex items-center justify-between w-full">
                          <span>Pedido #{pedido.id_orden ? pedido.id_orden.slice(-6) : 'N/A'}</span>
                          <Badge className={`ml-2 ${getStatusColor(pedido.estado)}`}>
                            {getStatusText(pedido.estado)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Detalles del pedido seleccionado */}
              {selectedPedido && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  {(() => {
                    const pedido = filteredOrders.find(p => p.id_orden === selectedPedido)
                    if (!pedido) return null
                    
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getStatusIcon(pedido.estado)}</span>
                            <div>
                              <h3 className="font-semibold text-slate-800 dark:text-white">
                                Pedido #{pedido.id_orden ? pedido.id_orden.slice(-6) : 'N/A'}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {pedido.tipo_servicio}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(pedido.estado)}>
                            {getStatusText(pedido.estado)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(pedido.created_at || pedido.fecha_creacion).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>${pedido.precio_total}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Package className="h-4 w-4 mr-2" />
                            <span>{pedido.tiempo_estimado || "N/A"}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{pedido.zona_entrega || "N/A"}</span>
                          </div>
                        </div>

                        {/* Información adicional para resultados de búsqueda */}
                        {/* {searchResults.length > 0 && (
                          <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-600 rounded-lg">
                            <h4 className="font-medium text-slate-800 dark:text-white mb-2">Información del Cliente:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Cliente:</span> {pedido.nombre_usuario || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {pedido.email || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Teléfono:</span> {pedido.telefono || 'N/A'}
                              </div>
                              {pedido.monto_pago && (
                                <div>
                                  <span className="font-medium">Pago:</span> ${pedido.monto_pago} ({pedido.metodo_pago})
                                </div>
                              )}
                              {pedido.reclamo_asunto && (
                                <div>
                                  <span className="font-medium">Reclamo:</span> {pedido.reclamo_asunto}
                                </div>
                              )}
                              {pedido.puntuacion && (
                                <div>
                                  <span className="font-medium">Reseña:</span> {pedido.puntuacion}/5 ⭐
                                </div>
                              )}
                            </div>
                          </div>
                        )} */}

                        {pedido.direccion_entrega && (
                          <div className="mb-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Dirección de entrega:</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{pedido.direccion_entrega}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Creado: {new Date(pedido.created_at).toLocaleString()}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/tracking/${pedido.id_orden}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Seguimiento
                          </Button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Lista compacta de todos los pedidos */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800 dark:text-white mb-3">Todos los pedidos:</h4>
                {filteredOrders.map((pedido) => (
                  <div 
                    key={pedido.id_orden} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPedido === pedido.id_orden 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedPedido(pedido.id_orden)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusIcon(pedido.estado)}</span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Pedido #{pedido.id_orden ? pedido.id_orden.slice(-6) : 'N/A'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {pedido.tipo_servicio} • ${pedido.precio_total}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(pedido.estado)}>
                        {getStatusText(pedido.estado)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
                No tienes pedidos aún
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchTerm || (statusFilter && statusFilter !== "all")
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Crea tu primer pedido para comenzar"
                }
              </p>
              {!searchTerm && (!statusFilter || statusFilter === "all") && (
                <Button onClick={() => router.push("/cliente")}>
                  Crear Pedido
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}