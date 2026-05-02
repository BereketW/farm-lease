"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@farm-lease/ui/components/button";
import { Input } from "@farm-lease/ui/components/input";
import { Textarea } from "@farm-lease/ui/components/textarea";
import { Label } from "@farm-lease/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@farm-lease/ui/components/card";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Matches backend validation schema
const formSchema = z.object({
  name: z.string().min(3),
  description: z.string().max(2000).optional(),
  location: z.string().min(3),
  region: z.string().min(2),
  totalArea: z.coerce.number().positive(),
  cropTypes: z.string().min(1), // comma separated
  geodata: z.string().min(1), // JSON
  coordinates: z.string().min(1), // JSON
  farmers: z.array(z.object({ userId: z.string().min(1), landShare: z.coerce.number().positive() })).min(1),
  documents: z.any().nullable(),
});

export function RegisterClusterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      region: "",
      totalArea: 0,
      cropTypes: "",
      geodata: '{"type": "FeatureCollection", "features": []}',
      coordinates: '{"lat": 0, "lng": 0}',
      farmers: [{ userId: "", landShare: 0 }],
      documents: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "farmers",
  });

  const register = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "farmers") {
          formData.append(key, JSON.stringify(value));
        } else if (key === "documents" && value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append("documents", file));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value as string);
        }
      });
      if (data.cropTypes) {
        formData.set("cropTypes", JSON.stringify(data.cropTypes.split(",").map((s: string) => s.trim())));
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/api/clusters`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to register cluster");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cluster registration submitted!");
      router.push("/clusters");
    },
  });

  return (
    <form onSubmit={form.handleSubmit((d) => register.mutate(d))} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Cluster Name" {...form.register("name")} />
          <Textarea placeholder="Description" {...form.register("description")} />
          <Input placeholder="Location" {...form.register("location")} />
          <Input placeholder="Region" {...form.register("region")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Technical Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input type="number" placeholder="Total Area (ha)" {...form.register("totalArea")} />
          <Input placeholder="Crop Types (comma separated)" {...form.register("cropTypes")} />
          <Textarea placeholder="Geodata (JSON)" {...form.register("geodata")} />
          <Textarea placeholder="Coordinates (JSON)" {...form.register("coordinates")} />
          <Input type="file" multiple onChange={(e) => form.setValue("documents", e.target.files as any)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Member Farmers</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ userId: "", landShare: 0 })}>
            <Plus className="size-4 mr-2" /> Add Farmer
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input placeholder="User ID" {...form.register(`farmers.${index}.userId`)} />
              <Input type="number" placeholder="Land Share %" {...form.register(`farmers.${index}.landShare`)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="size-4 text-rose-500" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={register.isPending}>
        {register.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit Registration"}
      </Button>
    </form>
  );
}
