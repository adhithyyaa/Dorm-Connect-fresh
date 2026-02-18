import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type Student = { id: string; name: string; roll_no: string; room_no: string; email: string };

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    supabase.from("student_details").select("*").order("room_no").then(({ data }) => {
      if (data) setStudents(data);
    });
  }, []);

  const filtered = students.filter(s => !filter || s.room_no.includes(filter) || s.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl">Student Directory</h1>
          <p className="text-muted-foreground">Room-wise student information</p>
        </div>
        <Input placeholder="Filter by room or name..." className="max-w-xs" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No students found</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.room_no}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.roll_no}</TableCell>
                  <TableCell>{s.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudents;
