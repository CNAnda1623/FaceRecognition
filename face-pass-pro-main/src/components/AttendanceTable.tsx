import { useState, useMemo } from "react";
import { ClipboardList, Search, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  name: string;
  roll: string;
  time: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  date: string;
  onRefresh: () => void;
}

export function AttendanceTable({ records, date, onRefresh }: AttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(
      record => 
        record.name.toLowerCase().includes(query) ||
        record.roll.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const handleExport = () => {
    const csvContent = [
      "Name,Roll,Time",
      ...records.map(r => `${r.name},${r.roll},${r.time}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${date.replace(/\s/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <ClipboardList className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Today's Attendance</h2>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Roll Number</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <TableRow 
                    key={`${record.roll}-${index}`}
                    className="transition-colors"
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {record.roll}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.time}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No attendance records found</p>
                      {searchQuery && (
                        <p className="text-sm mt-1">Try a different search term</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredRecords.length} of {records.length} records
        </span>
        <span className="font-mono">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
