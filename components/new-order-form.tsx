"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Plus, Minus, Calendar, MapPin, Check, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useServicios } from "@/hooks/useServicios"
import { useCreateOrden } from "@/hooks/useOrdenes"
import { useCreateUsuario } from "@/hooks/useUsuarios"
import Webcam from "react-webcam";

interface DetectedItem {
  id: number;
  name: string;
  price: number;
  confidence: string;
  quantity: number;
  icon: string;
}

const CameraCapture = ({ onDetected }: { onDetected: (item: DetectedItem) => void }) => {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setLoading(true);

    try {
      const base64 = imageSrc.split(",")[1];

      const res = await fetch("/api/clarifai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });

      const data = await res.json();
      const concept = data.outputs[0].data.concepts[0];

      // Mapeo de precio
      const priceMap: Record<string, number> = {
        shirt: 250,
        pants: 400,
        dress: 500,
        jacket: 600,
      };
      const price = priceMap[concept.name.toLowerCase()] || 300;

      const detectedItem: DetectedItem = {
        id: Date.now(),
        name: concept.name,
        price,
        confidence: (concept.value * 100).toFixed(1),
        quantity: 1,
        icon: "👕",
      };

      onDetected(detectedItem);
      toast.success(`Prenda detectada: ${concept.name} (${detectedItem.confidence}% confianza)`);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo detectar la prenda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="rounded-lg w-full"
      />
      <button
        onClick={capture}
        disabled={loading}
        className="p-2 bg-blue-500 text-white rounded w-full"
      >
        {loading ? "Analizando..." : "📸 Tomar Foto"}
      </button>
    </div>
  );
};

interface NewOrderFormProps {
  onClose: () => void
  onOrderCreated: (order: any) => void
}

export default function NewOrderForm({ onClose, onOrderCreated }: NewOrderFormProps) {
  const [step, setStep] = useState(1)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [address, setAddress] = useState("")
  const [customerData, setCustomerData] = useState({
    nombre: "",
    email: "",
    telefono: "",
  })

  // Función para convertir Date a formato compatible con datetime-local

  const toLocalDateTimeInput = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

useEffect(() => {
  const now = new Date();
  setPickupDate(toLocalDateTimeInput(now));

  const delivery = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  setDeliveryDate(toLocalDateTimeInput(delivery));
}, []);

  // API hooks
  const { data: serviciosData, loading: serviciosLoading } = useServicios()
  const { data: extrasData, loading: extrasLoading } = useServicios()
  const createOrden = useCreateOrden()
  const createUsuario = useCreateUsuario()

  // Mock clothing items (estos podrían venir de una API también)
  const clothingItems = [
    { id: 1, name: "Camisa", price: 15, icon: "👔" },
    { id: 2, name: "Pantalón", price: 20, icon: "👖" },
    { id: 3, name: "Vestido", price: 25, icon: "👗" },
    { id: 4, name: "Chaqueta", price: 30, icon: "🧥" },
    { id: 5, name: "Falda", price: 18, icon: "👗" },
    { id: 6, name: "Blusa", price: 16, icon: "👚" },
  ]

  // Servicios predefinidos
  const predefinedServices = [
    {
      id_servicio: "lavar",
      nombre: "Lavar",
      descripcion: "Servicio completo de lavado",
      precio_base: 0,
      icon: "🧽"
    },
    {
      id_servicio: "planchar",
      nombre: "Planchar",
      descripcion: "Servicio de planchado",
      precio_base: 0,
      icon: "👔"
    },
    {
      id_servicio: "solo_planchar",
      nombre: "Solo Planchar",
      descripcion: "Solo servicio de planchado (sin lavado)",
      precio_base: 0,
      icon: "✨"
    }
  ]

  // Usar servicios reales de la API + servicios predefinidos
  const apiServices = serviciosData?.data || []
  const services = [...predefinedServices, ...apiServices]
  const extras = extrasData?.data || []

  const addItem = (item: any) => {
    const existingItem = selectedItems.find((selected) => selected.id === item.id)
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((selected) =>
          selected.id === item.id ? { ...selected, quantity: selected.quantity + 1 } : selected,
        ),
      )
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }])
    }
    toast.success(`${item.name} ha sido agregado`)
  }

  const removeItem = (itemId: number) => {
    const existingItem = selectedItems.find((selected) => selected.id === itemId)
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(
        selectedItems.map((selected) =>
          selected.id === itemId ? { ...selected, quantity: selected.quantity - 1 } : selected,
        ),
      )
    } else {
      setSelectedItems(selectedItems.filter((selected) => selected.id !== itemId))
    }
    toast.error(`El articulo ha sido Borrado`)
  }

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0)
    const servicePrice = services.find((s) => s.id_servicio.toString() === selectedService)?.precio_base || 0
    return itemsTotal + servicePrice
  }

  const handleCreateOrder = async () => {
    try {
      // Validar datos del cliente
      if (!customerData.nombre || !customerData.email) {
        toast.error("Por favor completa los datos del cliente")
        return
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customerData.email)) {
        toast.error("Por favor ingresa un email válido")
        return
      }

      // Validar que se haya seleccionado un servicio
      if (!selectedService) {
        toast.error("Por favor selecciona un servicio")
        return
      }

      // Validar que se haya seleccionado al menos un artículo
      if (selectedItems.length === 0) {
        toast.error("Por favor selecciona al menos un artículo")
        return
      }

      // Crear usuario primero
      console.log("Creating usuario with data:", {
        nombre: customerData.nombre,
        email: customerData.email,
        telefono: customerData.telefono,
        direccion: address,
        rol: "cliente"
      })
      
      const usuario = await createUsuario.post({
        nombre: customerData.nombre,
        email: customerData.email,
        telefono: customerData.telefono,
        direccion: address,
        rol: "cliente"
      })

      console.log("Usuario creation result:", usuario)
      console.log("Usuario creation error:", createUsuario.error)

      if (!usuario) {
        const errorMessage = createUsuario.error || "Error al crear el usuario"
        toast.error(errorMessage)
        console.error("Error creating usuario:", createUsuario.error)
        return
      }

      // Crear orden
      const ordenData = {
        id_usuario: usuario.id_usuario,
        tipo_servicio: services.find((s) => s.id_servicio.toString() === selectedService)?.nombre || "Lavado Regular",
        direccion_entrega: address,
        zona_entrega: "Centro", // Esto podría venir de una API de cobertura
        precio_total: calculateTotal(),
        estado: "pendiente",
        extras_orden: selectedItems.map(item => ({
          nombre: item.name,
          cantidad: item.quantity,
          precio: item.price
        })),
        tiempo_estimado: "2 horas 30 min"
      }

      console.log("Creating orden with data:", ordenData)
      
      const nuevaOrden = await createOrden.post(ordenData)

      console.log("Orden creation result:", nuevaOrden)
      console.log("Orden creation error:", createOrden.error)

      if (!nuevaOrden) {
        const errorMessage = createOrden.error || "Error al crear la orden"
        toast.error(errorMessage)
        console.error("Error creating orden:", createOrden.error)
        return
      }

      // Crear objeto de orden para el frontend
      const newOrder = {
        id: nuevaOrden.id_orden,
        items: selectedItems.map((item) => ({
          type: item.name,
          quantity: item.quantity,
          service: services.find((s) => s.id_servicio.toString() === selectedService)?.nombre || selectedService,
        })),
        status: nuevaOrden.estado,
        total: nuevaOrden.precio_total,
        pickupDate,
        deliveryDate,
        pickupAddress: address,
        deliveryAddress: address,
        createdAt: nuevaOrden.created_at,
        cliente_nombre: usuario.nombre,
        cliente_email: usuario.email,
      }

      toast.success("¡Pedido creado exitosamente!")
      onOrderCreated(newOrder)
      onClose()
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Error al crear el pedido")
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Datos del Cliente</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={customerData.nombre}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="Ingresa tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={customerData.telefono}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="300 123 4567"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Toma una foto de tu prenda
            </h3>

            <CameraCapture
              onDetected={(item) => setSelectedItems([...selectedItems, item])}
            />

            {selectedItems.length > 0 && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-medium text-slate-800 dark:text-white mb-3">
                  Prendas detectadas:
                </h4>
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>${item.price}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Selecciona el servicio</h3>

            {serviciosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando servicios...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <Card
                    key={service.id_servicio}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedService === service.id_servicio.toString()
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedService(service.id_servicio.toString())}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {service.icon && (
                          <div className="text-2xl">{service.icon}</div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 dark:text-white">{service.nombre}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{service.descripcion || "Servicio de lavandería"}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <p className="font-medium text-slate-800 dark:text-white">
                          {service.precio_base > 0 ? `$${service.precio_base}` : "Incluido"}
                        </p>
                        {selectedService === service.id_servicio.toString() && <Check className="h-5 w-5 text-blue-500" />}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Programar servicio y entrega</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha de servicio
                </label>
                <input
                  type="datetime-local"
                  value={pickupDate}
                  readOnly
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha de entrega
                </label>
                <input
                  type="datetime-local"
                  value={deliveryDate}
                  readOnly
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ingresa tu dirección completa..."
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Resumen del pedido</h3>

            <Card className="p-4 space-y-4">
              <div>
                <h4 className="font-medium text-slate-800 dark:text-white mb-2">Prendas:</h4>
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span>Servicio: {services.find((s) => s.id_servicio.toString() === selectedService)?.nombre}</span>
                  <span>+${services.find((s) => s.id_servicio.toString() === selectedService)?.precio_base || 0}</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <p>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Recogida: {pickupDate ? new Date(pickupDate).toLocaleString() : 'No seleccionada'}
                </p>
                <p>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Entrega: {deliveryDate ? new Date(deliveryDate).toLocaleString() : 'No seleccionada'}
                </p>
                <p>
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección: {address}
                </p>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nuevo Pedido</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-400"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div
                    className={`w-8 h-1 mx-2 ${step > stepNumber ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-600"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          {renderStep()}

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onClose())}>
              {step > 1 ? "Anterior" : "Cancelar"}
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!customerData.nombre || !customerData.email)) ||
                  (step === 2 && selectedItems.length === 0) ||
                  (step === 3 && !selectedService) ||
                  (step === 4 && (!pickupDate || !deliveryDate || !address))
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button 
                onClick={handleCreateOrder} 
                className="bg-green-500 hover:bg-green-600"
                disabled={createOrden.loading || createUsuario.loading}
              >
                {createOrden.loading || createUsuario.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Crear Pedido
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
