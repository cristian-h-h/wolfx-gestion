import { useState } from "react";
import { Plus, Search, Package, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Color para diferenciar visualmente los contenedores de registro
const registroBg = "bg-[#e3f2fd]"; // Azul claro
const listadoBg = "bg-[#f8f8fa]";  // Igual que otros módulos

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  codigoBarras: string;
  stock: number;
  proveedor: string;
  precioCompra: number;
  precioVenta: number;
  unidad: string;
  imagen?: string; // URL local de la imagen
}

const categorias = ["Coloración", "Cuidado Capilar", "Herramientas", "Manicure", "Barbería", "Otro"];
const initialProveedores = ["Proveedor 1", "Proveedor 2", "Proveedor 3"];

const initialProductos: Producto[] = [
  {
    id: 1,
    nombre: "Shampoo Reparador",
    categoria: "Cuidado Capilar",
    codigoBarras: "1234567890123",
    stock: 15,
    proveedor: "Proveedor 1",
    precioCompra: 2500,
    precioVenta: 4000,
    unidad: "Unidad",
    imagen: "",
  },
  {
    id: 2,
    nombre: "Tijeras Profesionales",
    categoria: "Herramientas",
    codigoBarras: "9876543210987",
    stock: 5,
    proveedor: "Proveedor 2",
    precioCompra: 8000,
    precioVenta: 12000,
    unidad: "Unidad",
    imagen: "",
  },
];

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [proveedores, setProveedores] = useState<string[]>(initialProveedores);
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockAction, setStockAction] = useState<"entrada" | "salida">("entrada");
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    codigoBarras: "",
    stock: 0,
    proveedor: "",
    precioCompra: "",
    precioVenta: "",
    unidad: "",
    imagen: null as File | null,
    imagenPreview: "",
  });
  const [stockForm, setStockForm] = useState({
    cantidad: "",
    descripcion: "",
    codigoBarras: "",
    fecha: "",
    factura: "",
    imagenProducto: "",
  });

  // Buscar producto por nombre o código de barras
  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoBarras.includes(searchTerm)
  );

  // Formatear precios CLP
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);

  // Agregar proveedor
  const handleAddProveedor = () => {
    if (
      nuevoProveedor.trim() &&
      !proveedores.includes(nuevoProveedor.trim())
    ) {
      setProveedores((prev) => [...prev, nuevoProveedor.trim()]);
      setNuevoProveedor("");
    }
  };

  // Agregar producto
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    let imagenUrl = "";
    if (form.imagen) {
      imagenUrl = URL.createObjectURL(form.imagen);
    }
    setProductos([
      ...productos,
      {
        id: productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1,
        nombre: form.nombre,
        categoria: form.categoria,
        codigoBarras: form.codigoBarras,
        stock: Number(form.stock),
        proveedor: form.proveedor,
        precioCompra: Number(form.precioCompra),
        precioVenta: Number(form.precioVenta),
        unidad: form.unidad,
        imagen: imagenUrl,
      },
    ]);
    setForm({
      nombre: "",
      categoria: "",
      codigoBarras: "",
      stock: 0,
      proveedor: "",
      precioCompra: "",
      precioVenta: "",
      unidad: "",
      imagen: null,
      imagenPreview: "",
    });
  };

  // Registrar entrada/salida de stock usando código de barras
  const handleStockDialogOpen = (action: "entrada" | "salida") => {
    setStockAction(action);
    setStockForm({
      cantidad: "",
      descripcion: "",
      codigoBarras: "",
      fecha: new Date().toISOString().slice(0, 10),
      factura: "",
      imagenProducto: "",
    });
    setIsStockDialogOpen(true);
  };

  // Al ingresar código de barras, mostrar imagen producto si existe
  const handleStockCodigoChange = (value: string) => {
    const producto = productos.find(p => p.codigoBarras === value);
    setStockForm(f => ({
      ...f,
      codigoBarras: value,
      imagenProducto: producto?.imagen || "",
    }));
  };

  const handleStockChange = (e: React.FormEvent) => {
    e.preventDefault();
    const producto = productos.find(p => p.codigoBarras === stockForm.codigoBarras);
    if (!producto) {
      alert("Producto no encontrado. Verifique el código de barras.");
      return;
    }
    const cantidad = Number(stockForm.cantidad);
    setProductos((prev) =>
      prev.map((p) =>
        p.id === producto.id
          ? {
              ...p,
              stock:
                stockAction === "entrada"
                  ? p.stock + cantidad
                  : Math.max(0, p.stock - cantidad),
            }
          : p
      )
    );
    setIsStockDialogOpen(false);
  };

  // Manejar imagen en formulario de producto
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setForm(f => ({
        ...f,
        imagen: file,
        imagenPreview: URL.createObjectURL(file),
      }));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Registro de producto */}
        <div className={`rounded-lg shadow p-6 ${registroBg}`}>
          <h2 className="text-lg font-bold mb-4 text-blue-900 flex items-center gap-2">
            <Package className="w-5 h-5" /> Registrar nuevo producto
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleAddProduct}>
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                required
              >
                <option value="">Seleccionar</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Código de barras</Label>
              <Input
                value={form.codigoBarras}
                onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                placeholder="Escanea o ingresa el código"
                required
              />
            </div>
            <div>
              <Label>Stock inicial</Label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Proveedor</Label>
              <div className="flex gap-2">
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={form.proveedor}
                  onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar</option>
                  {proveedores.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
                <Input
                  value={nuevoProveedor}
                  onChange={e => setNuevoProveedor(e.target.value)}
                  placeholder="Nuevo proveedor"
                  className="w-32"
                />
                <Button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-700 text-white"
                  onClick={handleAddProveedor}
                >
                  +
                </Button>
              </div>
            </div>
            <div>
              <Label>Unidad</Label>
              <Input
                value={form.unidad}
                onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
                placeholder="Ej: Unidad, Caja, Pack"
                required
              />
            </div>
            <div>
              <Label>Precio compra</Label>
              <Input
                type="number"
                min={0}
                value={form.precioCompra}
                onChange={e => setForm(f => ({ ...f, precioCompra: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Precio venta</Label>
              <Input
                type="number"
                min={0}
                value={form.precioVenta}
                onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Imagen del producto</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {form.imagenPreview && (
                <img
                  src={form.imagenPreview}
                  alt="Vista previa"
                  className="mt-2 rounded max-h-24"
                />
              )}
            </div>
            <div className="flex items-end">
              <Button
                className="bg-blue-700 hover:bg-blue-800 text-white"
                type="submit"
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar producto
              </Button>
            </div>
          </form>
        </div>

        {/* Registro de entrada/salida de stock */}
        <div className={`rounded-lg shadow p-6 flex flex-col md:flex-row gap-4 ${registroBg}`}>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2 text-blue-900 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5" /> Entrada de stock
            </h2>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleStockDialogOpen("entrada")}
            >
              Registrar entrada
            </Button>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2 text-blue-900 flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" /> Salida de stock
            </h2>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleStockDialogOpen("salida")}
            >
              Registrar salida
            </Button>
          </div>
        </div>

        {/* Listado y búsqueda */}
        <div className={`flex items-center ${listadoBg} rounded-lg shadow p-4`}>
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre o código de barras..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className={`rounded-md border ${listadoBg} shadow`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Código de barras</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Precio compra</TableHead>
                <TableHead>Precio venta</TableHead>
                <TableHead>Unidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...filteredProductos]
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} className="max-h-12 rounded" />
                      ) : (
                        <span className="text-xs text-gray-400">Sin imagen</span>
                      )}
                    </TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.categoria}</TableCell>
                    <TableCell>{p.codigoBarras}</TableCell>
                    <TableCell>
                      <span
                        className={
                          p.stock <= 5
                            ? "text-red-600 font-bold"
                            : p.stock <= 10
                            ? "text-green-600 font-bold"
                            : "text-gray-900"
                        }
                      >
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell>{p.proveedor}</TableCell>
                    <TableCell>{formatPrice(p.precioCompra)}</TableCell>
                    <TableCell>{formatPrice(p.precioVenta)}</TableCell>
                    <TableCell>{p.unidad}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Diálogo para registrar entrada/salida de stock */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {stockAction === "entrada" ? "Registrar entrada de stock" : "Registrar salida de stock"}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleStockChange}>
              <div>
                <Label>Código de barras</Label>
                <Input
                  value={stockForm.codigoBarras}
                  onChange={e => handleStockCodigoChange(e.target.value)}
                  placeholder="Escanea o ingresa el código"
                  autoFocus
                  required
                />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={stockForm.fecha}
                  onChange={e => setStockForm(f => ({ ...f, fecha: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>N° Factura / Boleta</Label>
                <Input
                  value={stockForm.factura}
                  onChange={e => setStockForm(f => ({ ...f, factura: e.target.value }))}
                  placeholder="Número de factura o boleta"
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={stockForm.cantidad}
                  onChange={e => setStockForm(f => ({ ...f, cantidad: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Descripción / Comentario</Label>
                <Input
                  value={stockForm.descripcion}
                  onChange={e => setStockForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Compra, venta, merma, uso interno..."
                  required
                />
              </div>
              <div className="flex justify-end items-center space-x-4 pt-4">
                <div>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsStockDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className={stockAction === "entrada" ? "bg-green-600 hover:bg-green-700 text-white ml-2" : "bg-red-600 hover:bg-red-700 text-white ml-2"}
                    type="submit"
                  >
                    Registrar
                  </Button>
                </div>
                {stockForm.imagenProducto && (
                  <div className="border rounded bg-white p-2 flex justify-center items-center" style={{ minWidth: 100, minHeight: 100 }}>
                    <img
                      src={stockForm.imagenProducto}
                      alt="Producto"
                      className="object-contain max-h-24 max-w-24"
                    />
                  </div>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}