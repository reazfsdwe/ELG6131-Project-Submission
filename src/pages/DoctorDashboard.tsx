import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  FileText,
  CheckCircle,
  AlertCircle,
  HeartPulse,
} from 'lucide-react';
import { useReports } from '../context/ReportContext';

const ITEMS_PER_PAGE = 10;

export default function DoctorDashboard() {
  const { reports, isDbReady, deleteReport, toggleHideReport } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const filteredReports = reports.filter(
    (report) =>
      report.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteClick = (id: string) => {
    setReportToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-amber-100 text-black"><AlertCircle className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-700">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF1FF]">

      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/doctor" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-[#1E40AF]" />
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#1E40AF]">MediVoice</div>
                <div className="text-[10px] text-gray-500">Smart Digital Medicine</div>
              </div>
            </Link>
          </div>
          <span className="text-sm font-semibold text-[#1E40AF] bg-[#EBF1FF] px-4 py-1.5 rounded-full">
            Doctor Dashboard
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#1E40AF]">Report Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor all patient reports</p>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, ID, or report code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 rounded-full border-gray-200 focus:border-[#1E40AF]"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
          </div>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Report Code</TableHead>
                <TableHead>Exam Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isDbReady ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 animate-pulse">
                    Loading reports...
                  </TableCell>
                </TableRow>
              ) : paginatedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.patient.name}</TableCell>
                    <TableCell>{report.patient.id}</TableCell>
                    <TableCell className="font-mono text-sm">{report.id}</TableCell>
                    <TableCell>{report.patient.examDate}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {report.isHidden ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <EyeOff className="w-3 h-3 mr-1" />Hidden
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">
                          <Eye className="w-3 h-3 mr-1" />Visible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/report/${report.id}?from=doctor`} className="flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              View Report
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleHideReport(report.id)}>
                            {report.isHidden ? (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Show to Patient
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide from Patient
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(report.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <Button
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'gradient-primary' : ''}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
              The patient will no longer be able to access this report.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
