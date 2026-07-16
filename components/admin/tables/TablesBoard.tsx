'use client';

import { useMemo, useState } from 'react';
import {
  Grid3X3,
  Layers,
  Users,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApiError } from '@/lib/api-client';
import { createTable, deleteTable, tablesQueryOptions, updateTable } from '@/lib/queries/tables';
import { useSession } from '@/hooks/use-session';
import type { Area, Table, TableStatus } from '@/types/api';

// Backend cuma punya area indoor/outdoor (lihat table.schema.ts) — VIP di mock lama
// dihapus sesuai prinsip "backend adalah kiblat".
const AREA_OPTIONS: Area[] = ['indoor', 'outdoor'];
// occupied/reserved bukan status yang di-set manual (occupied di-toggle order flow,
// reserved dihitung live server-side) — form manual cuma expose 2 status ini.
const MANUAL_STATUS_OPTIONS: TableStatus[] = ['available', 'maintenance'];

interface EditFormState {
  name: string;
  area: Area;
  capacity: number;
  status: TableStatus;
}

interface CreateFormState {
  name: string;
  area: Area;
  capacity: number;
}

const EMPTY_CREATE_FORM: CreateFormState = { name: '', area: 'indoor', capacity: 2 };

function getStatusBadge(status: TableStatus) {
  const base = "rounded-none font-bold uppercase tracking-wider text-[2.4vw] md:text-[0.6vw]";
  switch (status) {
    case 'available':
      return <Badge className={`${base} bg-green-500 hover:bg-green-500 text-white`}>Available</Badge>;
    case 'reserved':
      return <Badge className={`${base} bg-amber-500 hover:bg-amber-500 text-white`}>Reserved</Badge>;
    case 'occupied':
      return <Badge className={`${base} bg-red-500 hover:bg-red-500 text-white`}>Occupied</Badge>;
    case 'maintenance':
      return <Badge className={`${base} bg-gray-400 hover:bg-gray-400 text-white`}>Maintenance</Badge>;
  }
}

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export const TablesBoard = () => {
  const { data: tables } = useSuspenseQuery({ ...tablesQueryOptions(), refetchInterval: 12000 });
  const { data: session } = useSession();
  const isOwner = session?.user.role === 'owner';
  const queryClient = useQueryClient();

  const [areaFilter, setAreaFilter] = useState<'ALL' | Area>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TableStatus>('ALL');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTable, setActiveTable] = useState<Table | null>(null);

  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchArea = areaFilter === 'ALL' || t.area === areaFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchArea && matchStatus;
    });
  }, [tables, areaFilter, statusFilter]);

  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Meja baru berhasil ditambahkan.');
      setIsCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal menambahkan meja, coba lagi.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditFormState }) => updateTable(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Meja berhasil diperbarui.');
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal memperbarui meja, coba lagi.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Meja berhasil dihapus.');
      setIsDetailOpen(false);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Gagal menghapus meja, coba lagi.'));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable || !editForm) return;
    updateMutation.mutate({ id: activeTable.id, input: editForm });
  };

  const handleDelete = () => {
    if (!activeTable) return;
    if (!window.confirm(`Hapus meja "${activeTable.name}"?`)) return;
    deleteMutation.mutate(activeTable.id);
  };

  const openDetail = (table: Table) => {
    setActiveTable(table);
    setIsDetailOpen(true);
  };

  const openEdit = () => {
    if (!activeTable) return;
    setEditForm({
      name: activeTable.name,
      area: activeTable.area,
      capacity: activeTable.capacity,
      // Kalau status saat ini occupied/reserved (dikelola sistem), tetap dibawa
      // ke form supaya trigger Select tidak kosong — tapi opsi yang bisa dipilih
      // ulang cuma available/maintenance (lihat MANUAL_STATUS_OPTIONS).
      status: activeTable.status,
    });
    setIsDetailOpen(false);
    setIsEditOpen(true);
  };

  return (
    <div className="w-full flex flex-col gap-[4vw] md:gap-[2vw]">

      <div className="w-full bg-white border border-black/5 p-[4vw] md:p-[1.5vw] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-[3vw] md:gap-[1.5vw]">
        <div className="flex items-center gap-[2vw] md:gap-[0.5vw]">
          <Grid3X3 className="w-[5vw] h-[5vw] md:w-[1.2vw] md:h-[1.2vw] text-[#6E3A2F]" />
          <h2 className="text-[4vw] md:text-[1vw] font-bold uppercase tracking-tight text-black">Tables Layout</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-[2vw] md:gap-[1vw]">

          <Select value={areaFilter} onValueChange={(val) => setAreaFilter(val as 'ALL' | Area)}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-none border-black/10 font-bold uppercase text-[3.5vw] md:text-[0.8vw] bg-transparent">
              <SelectValue placeholder="ZONE AREA" />
            </SelectTrigger>
            <SelectContent className="rounded-none font-bold uppercase text-[0.8vw]">
              <SelectItem value="ALL">All Areas</SelectItem>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as 'ALL' | TableStatus)}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-none border-black/10 font-bold uppercase text-[3.5vw] md:text-[0.8vw] bg-transparent">
              <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent className="rounded-none font-bold uppercase text-[0.8vw]">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          {isOwner && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center justify-center gap-[1.5vw] md:gap-[0.5vw] bg-black text-white text-[3.5vw] md:text-[0.8vw] font-bold uppercase tracking-wider px-[4vw] md:px-[1.2vw] py-[2vw] md:py-[0.6vw] hover:bg-black/80 transition-colors rounded-none"
                  />
                }
              >
                <Plus className="w-[4vw] h-[4vw] md:w-[0.9vw] md:h-[0.9vw]" /> Add Table
              </DialogTrigger>
              <DialogContent className="rounded-none border-black/10 max-w-[90%] sm:max-w-[420px] p-[6vw] md:p-[2vw] bg-white gap-[4vw] md:gap-[1.2vw]">
                <form onSubmit={handleCreateSubmit} className="flex flex-col gap-[4vw] md:gap-[1.2vw]">
                  <DialogHeader className="border-b border-black/5 pb-[3vw] md:pb-[1vw]">
                    <DialogTitle className="text-[4.5vw] md:text-[1.1vw] font-bold text-black uppercase">Add New Table</DialogTitle>
                  </DialogHeader>

                  <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                    <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Table Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full bg-black/[0.02] border border-black/10 p-[2.5vw] md:p-[0.5vw] text-[3.8vw] md:text-[0.85vw] font-bold focus:outline-none focus:border-black rounded-none"
                    />
                  </div>

                  <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                    <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={createForm.capacity}
                      onChange={(e) => setCreateForm({ ...createForm, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-black/[0.02] border border-black/10 p-[2.5vw] md:p-[0.5vw] text-[3.8vw] md:text-[0.85vw] font-bold focus:outline-none focus:border-black rounded-none"
                    />
                  </div>

                  <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                    <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Area</label>
                    <Select value={createForm.area} onValueChange={(val) => setCreateForm({ ...createForm, area: val as Area })}>
                      <SelectTrigger className="w-full rounded-none border-black/10 font-bold uppercase bg-black/[0.02]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-bold uppercase">
                        {AREA_OPTIONS.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-[2vw] pt-[2vw]">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1 bg-black/5 text-black text-[3.5vw] md:text-[0.8vw] font-bold uppercase py-[3vw] md:py-[0.6vw] hover:bg-black/10 transition-colors rounded-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 bg-black text-white text-[3.5vw] md:text-[0.8vw] font-bold uppercase py-[3vw] md:py-[0.6vw] hover:bg-black/90 transition-colors rounded-none disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Saving...' : 'Create Table'}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[4vw] md:gap-[1.5vw] w-full">
        {filteredTables.length === 0 ? (
          <p className="col-span-full text-center text-black/30 uppercase tracking-wide font-medium py-[6vw]">
            No tables found.
          </p>
        ) : (
          filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => openDetail(table)}
              className="border border-black/5 bg-white p-[5vw] md:p-[1.8vw] flex flex-col justify-between items-start h-[45vw] md:h-[12vw] cursor-pointer transition-all duration-200 hover:border-black/30 group relative rounded-none"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[4vw] md:text-[1.1vw] font-bold text-black tracking-tight">{table.name}</span>
                {getStatusBadge(table.status)}
              </div>

              <div className="flex justify-between items-end w-full border-t border-black/5 pt-[3vw] md:pt-[1vw]">
                <div className="flex flex-col">
                  <span className="text-[2.2vw] md:text-[0.6vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.3vw]">
                    <Layers className="w-[2.5vw] h-[2.5vw] md:w-[0.7vw] md:h-[0.7vw]" /> Zone
                  </span>
                  <span className="text-[3.2vw] md:text-[0.8vw] font-bold text-black/70 uppercase mt-[0.1vw]">{table.area}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[2.2vw] md:text-[0.6vw] font-bold text-black/30 uppercase tracking-wider flex items-center gap-[0.3vw]">
                    <Users className="w-[2.5vw] h-[2.5vw] md:w-[0.7vw] md:h-[0.7vw]" /> Seats
                  </span>
                  <span className="text-[3.2vw] md:text-[0.8vw] font-bold text-black mt-[0.1vw]">{table.capacity} PAX</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-none border-black/10 max-w-[90%] sm:max-w-[480px] p-[6vw] md:p-[2vw] bg-white gap-[4vw] md:gap-[1.5vw]">
          {activeTable && (
            <>
              <DialogHeader className="border-b border-black/5 pb-[3vw] md:pb-[1vw]">
                <span className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-widest">{activeTable.area} SECTION</span>
                <DialogTitle className="text-[5vw] md:text-[1.3vw] font-bold text-black uppercase mt-[0.2vw]">{activeTable.name}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-[2vw] bg-black/[0.02] border border-black/5 p-[3vw] md:p-[1vw]">
                <div className="flex flex-col">
                  <span className="text-[2.2vw] md:text-[0.6vw] font-bold text-black/30 uppercase tracking-wide">Capacity</span>
                  <span className="text-[3.8vw] md:text-[0.9vw] font-bold text-black mt-[0.1vw]">{activeTable.capacity} PAX</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[2.2vw] md:text-[0.6vw] font-bold text-black/30 uppercase tracking-wide">Current Status</span>
                  <span className="text-[3.8vw] md:text-[0.9vw] font-bold uppercase mt-[0.1vw] text-black">{activeTable.status}</span>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-[2vw] md:gap-[0.8vw]">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="flex-1 bg-black text-white text-[3.5vw] md:text-[0.8vw] font-bold uppercase tracking-wider py-[3vw] md:py-[0.6vw] flex items-center justify-center gap-[2vw] md:gap-[0.5vw] hover:bg-black/80 transition-colors rounded-none"
                  >
                    <Edit3 className="w-[4vw] h-[4vw] md:w-[0.9vw] md:h-[0.9vw]" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 bg-red-600 text-white text-[3.5vw] md:text-[0.8vw] font-bold uppercase tracking-wider py-[3vw] md:py-[0.6vw] flex items-center justify-center gap-[2vw] md:gap-[0.5vw] hover:bg-red-700 transition-colors rounded-none disabled:opacity-50"
                  >
                    <Trash2 className="w-[4vw] h-[4vw] md:w-[0.9vw] md:h-[0.9vw]" /> {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-none border-black/10 max-w-[90%] sm:max-w-[420px] p-[6vw] md:p-[2vw] bg-white gap-[4vw] md:gap-[1.2vw]">
          {activeTable && editForm && (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-[4vw] md:gap-[1.2vw]">
              <DialogHeader className="border-b border-black/5 pb-[3vw] md:pb-[1vw]">
                <DialogTitle className="text-[4.5vw] md:text-[1.1vw] font-bold text-black uppercase">Modify {activeTable.name}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Table Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-black/[0.02] border border-black/10 p-[2.5vw] md:p-[0.5vw] text-[3.8vw] md:text-[0.85vw] font-bold focus:outline-none focus:border-black rounded-none"
                />
              </div>

              <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/[0.02] border border-black/10 p-[2.5vw] md:p-[0.5vw] text-[3.8vw] md:text-[0.85vw] font-bold focus:outline-none focus:border-black rounded-none"
                />
              </div>

              <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Area</label>
                <Select
                  value={editForm.area}
                  onValueChange={(val) => setEditForm({ ...editForm, area: val as Area })}
                >
                  <SelectTrigger className="w-full rounded-none border-black/10 font-bold uppercase bg-black/[0.02]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-bold uppercase">
                    {AREA_OPTIONS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-[1vw] md:gap-[0.3vw]">
                <label className="text-[2.5vw] md:text-[0.65vw] font-bold text-black/40 uppercase tracking-wider">Status</label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm({ ...editForm, status: val as TableStatus })}
                >
                  <SelectTrigger className="w-full rounded-none border-black/10 font-bold uppercase bg-black/[0.02]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-bold uppercase">
                    {/* occupied/reserved dikelola sistem (order flow / live overlay booking),
                        bukan di-set manual — kalau status saat ini salah satu dari itu, tetap
                        ditampilkan di sini sebagai opsi disabled supaya trigger tidak kosong,
                        tapi owner cuma bisa pindah ke available/maintenance. */}
                    {!MANUAL_STATUS_OPTIONS.includes(activeTable.status) && (
                      <SelectItem value={activeTable.status} disabled>
                        {activeTable.status} (system-managed)
                      </SelectItem>
                    )}
                    {MANUAL_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-[2vw] pt-[2vw]">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 bg-black/5 text-black text-[3.5vw] md:text-[0.8vw] font-bold uppercase py-[3vw] md:py-[0.6vw] hover:bg-black/10 transition-colors rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-black text-white text-[3.5vw] md:text-[0.8vw] font-bold uppercase py-[3vw] md:py-[0.6vw] hover:bg-black/90 transition-colors rounded-none disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TablesBoard;
