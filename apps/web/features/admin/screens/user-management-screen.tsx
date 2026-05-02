"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listUsers, updateUserStatus } from "../datasource/users";
import { Button } from "@farm-lease/ui/components/button";
import { Loader2 } from "lucide-react";

export function UserManagementScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated");
    },
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="space-y-4">
        {data?.users.map((user) => (
          <div key={user.id} className="flex justify-between items-center p-4 border rounded">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email} - {user.status}</p>
            </div>
            <div className="space-x-2">
              <Button onClick={() => mutation.mutate({ id: user.id, status: "ACTIVE" })}>Activate</Button>
              <Button variant="destructive" onClick={() => mutation.mutate({ id: user.id, status: "SUSPENDED" })}>Suspend</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
