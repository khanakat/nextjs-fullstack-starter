"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  // Calendar,
  Clock,
  // Mail,
  Play,
  Pause,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  Search,
  // Filter,
  // Download,
  Users,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
// import { CreateScheduledReportDialog } from './create-scheduled-report-dialog';
// import { EditScheduledReportDialog } from './edit-scheduled-report-dialog';

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportId: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  recipients: string[];
  format: "pdf" | "xlsx" | "csv";
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  report: {
    id: string;
    name: string;
    description?: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduledReportsListProps {
  organizationId: string;
}

export function ScheduledReportsList({
  organizationId,
}: ScheduledReportsListProps) {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(
  //   null,
  // );
  // const [showCreateDialog, setShowCreateDialog] = useState(false);
  // const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchScheduledReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const response = await fetch(`/api/scheduled-reports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch scheduled reports");

      const data = await response.json();
      setScheduledReports(data.scheduledReports);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching scheduled reports:", error);
      toast({
        title: "Error - No se pudieron cargar los reportes programados",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, statusFilter, toast]);

  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports]);

  const handleToggleStatus = async (
    reportId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: `Éxito - Reporte ${!currentStatus ? "activado" : "desactivado"} correctamente`,
        type: "success",
      });

      fetchScheduledReports();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error - No se pudo actualizar el estado del reporte",
        type: "error",
      });
    }
  };

  const handleExecuteNow = async (reportId: string) => {
    try {
      const response = await fetch(
        `/api/scheduled-reports/${reportId}/execute`,
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to execute report");

      toast({
        title: "Éxito - Reporte ejecutado correctamente",
        type: "success",
      });
    } catch (error) {
      console.error("Error executing report:", error);
      toast({
        title: "Error - No se pudo ejecutar el reporte",
        type: "error",
      });
    }
  };

  const handleDelete = async (reportId: string) => {
    if (
      !confirm("¿Estás seguro de que quieres eliminar este reporte programado?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      toast({
        title: "Éxito - Reporte programado eliminado correctamente",
        type: "success",
      });

      fetchScheduledReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error - No se pudo eliminar el reporte programado",
        type: "error",
      });
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
      quarterly: "Trimestral",
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const getFormatBadgeColor = (format: string) => {
    const colors = {
      pdf: "bg-red-100 text-red-800",
      xlsx: "bg-green-100 text-green-800",
      csv: "bg-blue-100 text-blue-800",
    };
    return colors[format as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredReports = scheduledReports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Reportes Programados
          </h2>
          <p className="text-muted-foreground">
            Gestiona la generación automática de reportes
          </p>
        </div>
        <Button onClick={() => console.log("Create new report")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Reporte Programado
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Programados ({filteredReports.length})</CardTitle>
          <CardDescription>
            Lista de todos los reportes programados para tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay reportes programados
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer reporte programado para automatizar la generación
                de informes
              </p>
              <Button onClick={() => console.log("Create new report")}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Reporte Programado
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Reporte Base</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Próxima Ejecución</TableHead>
                  <TableHead>Destinatarios</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        {report.description && (
                          <div className="text-sm text-gray-500">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{report.report.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {getFrequencyLabel(report.schedule.frequency)}
                        </span>
                        <span className="text-sm text-gray-500">
                          a las {report.schedule.time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.nextRun ? (
                        <div>
                          <div className="font-medium">
                            {format(
                              new Date(report.nextRun),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(report.nextRun), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{report.recipients.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getFormatBadgeColor(report.format)}>
                        {report.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={report.isActive ? "default" : "secondary"}
                      >
                        {report.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleExecuteNow(report.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Ejecutar Ahora
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // setSelectedReport(report);
                              // setShowEditDialog(true);
                              console.log("Edit report", report);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(report.id, report.isActive)
                            }
                          >
                            {report.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {/* Create Dialog */}
      {/* <CreateScheduledReportDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        organizationId={organizationId}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchScheduledReports();
        }}
      /> */}

      {/* Edit Dialog */}
      {/* <EditScheduledReportDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        scheduledReport={selectedReport}
        onSuccess={() => {
          setShowEditDialog(false);
          setSelectedReport(null);
          fetchScheduledReports();
        }}
      /> */}
    </div>
  );
}
